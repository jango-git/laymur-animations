import gsap from "gsap";
import type { UIMicro } from "laymur";
import type { UIMicroAnimatedElement } from "./UIAnimatedElement.js";
import { resolveTargets, UICallTracker } from "./miscellaneous.js";

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
}
