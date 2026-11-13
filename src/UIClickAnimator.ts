import gsap from "gsap";
import type { UIDummy, UIInputEventData, UIMicro } from "laymur";
import { UIMode } from "laymur";

import { resolveTargets, UICallTracker } from "./miscellaneous.js";
import type { UIMicroAnimatedElement } from "./UIAnimatedElement.js";

const DEFAULT_X_OFFSET = 0;
const DEFAULT_Y_OFFSET = -25;
const DEFAULT_X_SCALE = 0.85;
const DEFAULT_Y_SCALE = 1;
const DEFAULT_DELAY = 0;
const DEFAULT_DURATION_IN = 0.125;
const DEFAULT_DURATION_OUT = 0.25;
const DEFAULT_EASE_IN = "power1.out";
const DEFAULT_EASE_OUT = "back.out";
const DEFAULT_KEEP_HIT_AREA = true;

/** A click replaces the one running on the same element, keeping its rest values */
const clickCalls = new UICallTracker(["x", "y", "scaleX", "scaleY"]);

/** Clicks in progress per micro and its affectsInput from before the first of them */
const hitAreaLocks = new WeakMap<UIMicro, { count: number; affectsInput: boolean }>();

function lockHitArea(micro: UIMicro): void {
  const lock = hitAreaLocks.get(micro);
  if (lock) {
    lock.count++;
    return;
  }
  hitAreaLocks.set(micro, { count: 1, affectsInput: micro.affectsInput });
  micro.affectsInput = false;
}

function unlockHitArea(micro: UIMicro): void {
  const lock = hitAreaLocks.get(micro);
  if (!lock) {
    return;
  }
  lock.count--;
  if (lock.count === 0) {
    hitAreaLocks.delete(micro);
    micro.affectsInput = lock.affectsInput;
  }
}

/** Pressed values and press-in settings of a micro held by {@link UIClickAnimator.press} */
interface UIPressState {
  pressed: { x: number; y: number; scaleX: number; scaleY: number };
  timeline: gsap.core.Timeline | undefined;
  durationIn: number;
  easeIn: gsap.EaseString;
  keepHitArea: boolean;
}

const presses = new WeakMap<UIMicro, UIPressState>();

/**
 * Configuration options for click animations.
 */
export interface UIClickAnimatorOptions {
  /** X position offset during click */
  xOffset: number;
  /** Y position offset during click */
  yOffset: number;
  /** X scale factor during click */
  xScale: number;
  /** Y scale factor during click */
  yScale: number;
  /** Animation delay in seconds */
  delay: number;
  /** Duration of click in phase in seconds */
  durationIn: number;
  /** Duration of click out phase in seconds */
  durationOut: number;
  /** GSAP easing function for click in */
  easeIn: gsap.EaseString;
  /** GSAP easing function for click out */
  easeOut: gsap.EaseString;
  /**
   * Whether the hit area stays in place while the element is pressed, instead of following
   * the shrinking element (see UIMicro.affectsInput); otherwise a release near the edge misses
   */
  keepHitArea: boolean;
}

/**
 * Configuration options for holding an element pressed.
 */
export type UIClickAnimatorPressOptions = Pick<
  UIClickAnimatorOptions,
  "xOffset" | "yOffset" | "xScale" | "yScale" | "durationIn" | "easeIn" | "keepHitArea"
>;

/**
 * Configuration options for releasing a pressed element.
 */
export type UIClickAnimatorReleaseOptions = Pick<UIClickAnimatorOptions, "durationOut" | "easeOut">;

/**
 * Configuration options for binding press feedback to the pointer.
 */
export type UIClickAnimatorBindOptions = UIClickAnimatorPressOptions &
  UIClickAnimatorReleaseOptions;

/**
 * Element whose own presses drive the press feedback, such as any laymur UIElement.
 */
export type UIClickAnimatorBindElement = UIMicroAnimatedElement &
  Pick<UIDummy, "signalPointerPressed" | "signalPointerClicked" | "signalPointerCancelled">;

/**
 * Animator for click feedback effects.
 */
export class UIClickAnimator {
  /**
   * Animates elements with click feedback including position offset and scale effects,
   * relative to the transform the element rests at. A click replaces the one running on the
   * same element.
   * @param target - Single element or array of elements to animate
   * @param options - Animation configuration options
   * @returns Promise that resolves when animation completes or is interrupted
   */
  public static click(
    target: UIMicroAnimatedElement | UIMicroAnimatedElement[],
    options: Partial<UIClickAnimatorOptions> = {},
  ): Promise<void> {
    const {
      xOffset = DEFAULT_X_OFFSET,
      yOffset = DEFAULT_Y_OFFSET,
      xScale = DEFAULT_X_SCALE,
      yScale = DEFAULT_Y_SCALE,
      delay = DEFAULT_DELAY,
      durationIn = DEFAULT_DURATION_IN,
      durationOut = DEFAULT_DURATION_OUT,
      easeIn = DEFAULT_EASE_IN,
      easeOut = DEFAULT_EASE_OUT,
      keepHitArea = DEFAULT_KEEP_HIT_AREA,
    } = options;

    const elements = resolveTargets(target);

    const clicks = elements.map(
      (element) =>
        new Promise<void>((resolve) => {
          const micro = element.micro;
          if (keepHitArea) {
            lockHitArea(micro);
          }

          clickCalls.start(
            micro,
            (rest) =>
              gsap
                .timeline({ delay })
                .to(micro, {
                  x: rest.x + xOffset,
                  y: rest.y + yOffset,
                  scaleX: rest.scaleX * xScale,
                  scaleY: rest.scaleY * yScale,
                  duration: durationIn,
                  ease: easeIn,
                })
                .to(micro, {
                  x: rest.x,
                  y: rest.y,
                  scaleX: rest.scaleX,
                  scaleY: rest.scaleY,
                  duration: durationOut,
                  ease: easeOut,
                }),
            () => {
              if (keepHitArea) {
                unlockHitArea(micro);
              }
              resolve();
            },
          );
        }),
    );

    return Promise.all(clicks).then(() => undefined);
  }

  /**
   * Presses elements in and holds them there until {@link release}, relative to the transform
   * they rest at. Does nothing to an element already held pressed.
   * @param target - Single element or array of elements to press
   * @param options - Press configuration options
   */
  public static press(
    target: UIMicroAnimatedElement | UIMicroAnimatedElement[],
    options: Partial<UIClickAnimatorPressOptions> = {},
  ): void {
    const {
      xOffset = DEFAULT_X_OFFSET,
      yOffset = DEFAULT_Y_OFFSET,
      xScale = DEFAULT_X_SCALE,
      yScale = DEFAULT_Y_SCALE,
      durationIn = DEFAULT_DURATION_IN,
      easeIn = DEFAULT_EASE_IN,
      keepHitArea = DEFAULT_KEEP_HIT_AREA,
    } = options;

    for (const element of resolveTargets(target)) {
      const micro = element.micro;
      if (presses.has(micro)) {
        continue;
      }

      const state: UIPressState = {
        pressed: { x: 0, y: 0, scaleX: 1, scaleY: 1 },
        timeline: undefined,
        durationIn,
        easeIn,
        keepHitArea,
      };
      presses.set(micro, state);
      if (keepHitArea) {
        lockHitArea(micro);
      }

      clickCalls.start(
        micro,
        (rest) => {
          state.pressed = {
            x: rest.x + xOffset,
            y: rest.y + yOffset,
            scaleX: rest.scaleX * xScale,
            scaleY: rest.scaleY * yScale,
          };
          // The endless empty tween keeps the call running while the element is held
          state.timeline = gsap
            .timeline()
            .to(micro, { ...state.pressed, duration: durationIn, ease: easeIn })
            .to({}, { duration: 1, repeat: -1 });
          return state.timeline;
        },
        () => {
          // Replaced by a click or killed from outside rather than released
          if (presses.get(micro) === state) {
            presses.delete(micro);
            if (keepHitArea) {
              unlockHitArea(micro);
            }
          }
        },
      );
    }
  }

  /**
   * Releases elements held by {@link press} back to rest. A press released before it is fully
   * in finishes it first, so a quick tap still shows the whole click.
   * @param target - Single element or array of elements to release
   * @param options - Release configuration options
   * @returns Promise that resolves when the elements are back at rest or interrupted
   */
  public static release(
    target: UIMicroAnimatedElement | UIMicroAnimatedElement[],
    options: Partial<UIClickAnimatorReleaseOptions> = {},
  ): Promise<void> {
    const { durationOut = DEFAULT_DURATION_OUT, easeOut = DEFAULT_EASE_OUT } = options;

    const releases = resolveTargets(target).map(
      (element) =>
        new Promise<void>((resolve) => {
          const micro = element.micro;
          const state = presses.get(micro);
          if (state === undefined) {
            resolve();
            return;
          }
          presses.delete(micro);
          const remaining = Math.max(state.durationIn - (state.timeline?.time() ?? 0), 0);

          clickCalls.start(
            micro,
            (rest) => {
              const timeline = gsap.timeline();
              if (remaining > 0) {
                timeline.to(micro, { ...state.pressed, duration: remaining, ease: state.easeIn });
              }
              return timeline.to(micro, {
                x: rest.x,
                y: rest.y,
                scaleX: rest.scaleX,
                scaleY: rest.scaleY,
                duration: durationOut,
                ease: easeOut,
              });
            },
            () => {
              if (state.keepHitArea) {
                unlockHitArea(micro);
              }
              resolve();
            },
          );
        }),
    );

    return Promise.all(releases).then(() => undefined);
  }

  /**
   * Drives the press feedback by the pointer: the element is pressed while a pointer holds it
   * and released on the click or cancel that ends every press it catches. Presses passed
   * through by INTERACTIVE_TRANSPARENT elements, which end with neither, are ignored.
   * @param element - Element to bind
   * @param options - Press and release configuration options
   * @returns Function that unbinds the element, releasing it if held
   */
  public static bind(
    element: UIClickAnimatorBindElement,
    options: Partial<UIClickAnimatorBindOptions> = {},
  ): () => void {
    const pointers = new Set<number>();

    const onPressed = (event: UIInputEventData): void => {
      if (event.element.mode !== UIMode.INTERACTIVE) {
        return;
      }
      pointers.add(event.identifier);
      if (pointers.size === 1) {
        UIClickAnimator.press(element, options);
      }
    };

    const onEnded = (event: UIInputEventData): void => {
      if (pointers.delete(event.identifier) && pointers.size === 0) {
        void UIClickAnimator.release(element, options);
      }
    };

    element.signalPointerPressed.on(onPressed);
    element.signalPointerClicked.on(onEnded);
    element.signalPointerCancelled.on(onEnded);

    return (): void => {
      element.signalPointerPressed.off(onPressed);
      element.signalPointerClicked.off(onEnded);
      element.signalPointerCancelled.off(onEnded);
      if (pointers.size > 0) {
        pointers.clear();
        void UIClickAnimator.release(element, options);
      }
    };
  }
}
