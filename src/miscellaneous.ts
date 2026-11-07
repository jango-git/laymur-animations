import gsap from "gsap";
import type { UIMicro } from "laymur";
import { UIMode } from "laymur";
import type { UIAnimatedElement } from "./UIAnimatedElement.js";

/** Micro transform properties an animator may own */
export type UIMicroProperty = "x" | "y" | "scaleX" | "scaleY" | "rotation" | "anchorX" | "anchorY";

/** Values of micro properties an animation comes back to */
export type UIMicroRest = Record<UIMicroProperty, number>;

/** Anchors are set, never tweened: changing them mid-animation would shift the element */
const ANCHOR_PROPERTIES: readonly UIMicroProperty[] = ["anchorX", "anchorY"];

interface UICallEntry {
  rest: UIMicroRest;
  /** The running call, or the tween bringing the element back to rest after a stop */
  animation: gsap.core.Animation | undefined;
  onEnd: (() => void) | undefined;
}

/** Appearance or disappearance running on an element */
const visibilityAnimations = new WeakMap<UIAnimatedElement, gsap.core.Animation>();

/** Modes of elements hidden by the disappear animator, given back by the appear animator */
const hiddenModes = new WeakMap<UIAnimatedElement, UIMode>();

/**
 * Normalizes a single target or an array of targets to an array.
 */
export function resolveTargets<T>(target: T | T[]): T[] {
  return Array.isArray(target) ? target : [target];
}

/**
 * Converts an iteration count to the gsap repeat count, which does not count the first run.
 * @param iterations Number of runs; -1 or NaN for infinite, at least one run otherwise
 */
export function iterationsToRepeat(iterations: number): number {
  return Number.isNaN(iterations) || iterations < 0 ? -1 : Math.max(iterations - 1, 0);
}

/**
 * Resolves when the animation completes, with true, or is killed before that, with false.
 * Takes over the onComplete and onInterrupt callbacks of the animation.
 */
export function settle(animation: gsap.core.Animation): Promise<boolean> {
  return new Promise((resolve) => {
    animation.eventCallback("onComplete", () => resolve(true));
    animation.eventCallback("onInterrupt", () => resolve(false));
  });
}

/**
 * Kills the appearance or disappearance running on the element; its promise resolves.
 */
export function stopVisibility(element: UIAnimatedElement): void {
  visibilityAnimations.get(element)?.kill();
  visibilityAnimations.delete(element);
}

/**
 * Remembers the appearance or disappearance of the element, so the next one can replace it.
 */
export function trackVisibility(element: UIAnimatedElement, animation: gsap.core.Animation): void {
  visibilityAnimations.set(element, animation);
}

/**
 * Whether the animation is still the appearance or disappearance of the element.
 */
export function isVisibilityTracked(
  element: UIAnimatedElement,
  animation: gsap.core.Animation,
): boolean {
  return visibilityAnimations.get(element) === animation;
}

/**
 * Hides the element, remembering its mode for {@link restoreMode}. Does nothing for an
 * element without a mode.
 */
export function hideElement(element: UIAnimatedElement): void {
  if (element.mode !== undefined && element.mode !== UIMode.HIDDEN) {
    hiddenModes.set(element, element.mode);
    element.mode = UIMode.HIDDEN;
  }
}

/**
 * Gives an element hidden by {@link hideElement} its mode back.
 */
export function restoreMode(element: UIAnimatedElement): void {
  const mode = hiddenModes.get(element);
  if (mode !== undefined) {
    hiddenModes.delete(element);
    element.mode = mode;
  }
}

/**
 * Keeps track of one kind of call animation per micro.
 *
 * The rest values of the properties the animator owns are taken when the element is idle and
 * kept while calls replace each other, so restarting a call mid-animation does not shift the
 * element. Stopping brings the element back to rest; anchors are restored once it is there.
 */
export class UICallTracker {
  private readonly entries = new WeakMap<UIMicro, UICallEntry>();

  constructor(private readonly properties: readonly UIMicroProperty[]) {}

  /**
   * Starts a call, replacing the call or the return to rest running on the micro.
   * @param micro Micro transform to animate
   * @param build Builds the call timeline from the rest values
   * @param onEnd Called once when the call completes, is stopped or is replaced
   */
  public start(
    micro: UIMicro,
    build: (rest: UIMicroRest) => gsap.core.Timeline,
    onEnd?: () => void,
  ): void {
    const previous = this.entries.get(micro);
    const rest = previous?.rest ?? this.takeRest(micro);

    if (previous) {
      this.kill(previous);
      this.end(previous);
    }

    const entry: UICallEntry = { rest, animation: undefined, onEnd };
    this.entries.set(micro, entry);
    this.track(micro, entry, build(rest));
  }

  /**
   * Stops the call running on the micro and brings it back to rest.
   * @param overrides Values to come back to instead of the rest values
   */
  public stop(
    micro: UIMicro,
    duration: number,
    ease: gsap.EaseString,
    overrides: Partial<UIMicroRest> = {},
  ): void {
    const entry = this.entries.get(micro);
    if (!entry) {
      return;
    }

    this.kill(entry);

    const target: Partial<UIMicroRest> = {};
    for (const property of this.properties) {
      if (!ANCHOR_PROPERTIES.includes(property)) {
        target[property] = overrides[property] ?? entry.rest[property];
      }
    }

    this.track(micro, entry, gsap.to(micro, { ...target, duration, ease }));
    this.end(entry);
  }

  private track(micro: UIMicro, entry: UICallEntry, animation: gsap.core.Animation): void {
    entry.animation = animation;
    animation.eventCallback("onComplete", () => this.finish(micro, entry));
    // Killed from outside, such as by gsap.killTweensOf: the element stays where it was
    animation.eventCallback("onInterrupt", () => {
      if (this.entries.get(micro) === entry) {
        this.entries.delete(micro);
      }
      this.end(entry);
    });
  }

  /** Kills the animation of the entry without it counting as an interruption */
  private kill(entry: UICallEntry): void {
    entry.animation?.eventCallback("onInterrupt", null);
    entry.animation?.kill();
  }

  private takeRest(micro: UIMicro): UIMicroRest {
    return {
      x: micro.x,
      y: micro.y,
      scaleX: micro.scaleX,
      scaleY: micro.scaleY,
      rotation: micro.rotation,
      anchorX: micro.anchorX,
      anchorY: micro.anchorY,
    };
  }

  private finish(micro: UIMicro, entry: UICallEntry): void {
    if (this.entries.get(micro) !== entry) {
      return;
    }
    this.entries.delete(micro);

    for (const property of ANCHOR_PROPERTIES) {
      if (this.properties.includes(property)) {
        micro[property] = entry.rest[property];
      }
    }
    this.end(entry);
  }

  private end(entry: UICallEntry): void {
    const onEnd = entry.onEnd;
    entry.onEnd = undefined;
    onEnd?.();
  }
}
