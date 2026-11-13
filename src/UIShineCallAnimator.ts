import gsap from "gsap";
import type { UIMicro } from "laymur";

import { iterationsToRepeat, resolveTargets, UICallTracker } from "./miscellaneous.js";
import type { UIMicroAnimatedElement } from "./UIAnimatedElement.js";

const shineCalls = new UICallTracker(["x", "y"]);

/**
 * Center of the sweep, taken from the first shine, and the start of the last sweep. Kept after a
 * stop: the shine then waits at the start, which is not where it rests.
 */
const shineSweeps = new WeakMap<
  UIMicro,
  { centerX: number; centerY: number; startX: number; startY: number }
>();

const DEFAULT_DX = 300;
const DEFAULT_DY = 0;
const DEFAULT_ITERATIONS = -1;
const DEFAULT_COOLDOWN = 2.5;
const DEFAULT_START_WITH_COOLDOWN = true;
const DEFAULT_DURATION = 0.6;
const DEFAULT_EASE = "power1.inOut";

/**
 * Configuration options for shine call animations.
 */
export interface UIShineCallAnimatorCallOptions {
  /** Horizontal length of the sweep in world units, centered on the rest position */
  dx: number;
  /** Vertical length of the sweep in world units, centered on the rest position */
  dy: number;
  /** Number of animation iterations (-1 for infinite) */
  iterations: number;
  /** Cooldown time between sweeps in seconds */
  cooldown: number;
  /** Whether to start with cooldown delay */
  startWithCooldown: boolean;
  /** Duration of a sweep in seconds */
  duration: number;
  /** GSAP easing function of a sweep */
  ease: gsap.EaseString;
  /** Called once the call ends: completed, stopped or replaced by another shine */
  onComplete: () => void;
}

/**
 * Animator for shine sweeps across an element, such as a glint running over a button.
 *
 * The shine is an element of its own, such as a diagonal light band image, laid at the center
 * of the button and clipped by a mask following the button:
 *
 * ```ts
 * const shine = new UIImage(layer, bandTexture, { mask: new UIMask(button) });
 * UIShineCallAnimator.shine(shine, { dx: button.width * 1.5 });
 * ```
 *
 * Between sweeps the shine waits at the start of the sweep, outside of the mask.
 */
export class UIShineCallAnimator {
  /**
   * Starts sweeping the shine from one end of the vector (dx, dy) to the other, centered on
   * its rest position. Replaces a shine running on the same element.
   * @param target - Single shine element or array of them
   * @param options - Animation configuration options
   */
  public static shine(
    target: UIMicroAnimatedElement | UIMicroAnimatedElement[],
    options: Partial<UIShineCallAnimatorCallOptions> = {},
  ): void {
    const {
      dx = DEFAULT_DX,
      dy = DEFAULT_DY,
      iterations = DEFAULT_ITERATIONS,
      cooldown = DEFAULT_COOLDOWN,
      startWithCooldown = DEFAULT_START_WITH_COOLDOWN,
      duration = DEFAULT_DURATION,
      ease = DEFAULT_EASE,
      onComplete,
    } = options;

    for (const element of resolveTargets(target)) {
      const micro = element.micro;

      shineCalls.start(
        micro,
        (rest) => {
          const centerX = shineSweeps.get(micro)?.centerX ?? rest.x;
          const centerY = shineSweeps.get(micro)?.centerY ?? rest.y;
          const startX = centerX - dx / 2;
          const startY = centerY - dy / 2;
          shineSweeps.set(micro, { centerX, centerY, startX, startY });
          micro.x = startX;
          micro.y = startY;

          const timeline = gsap.timeline({ repeat: iterationsToRepeat(iterations) });

          if (startWithCooldown && cooldown > 0) {
            timeline.to({}, { duration: cooldown });
          }

          timeline
            .to(micro, { x: centerX + dx / 2, y: centerY + dy / 2, duration, ease })
            .set(micro, { x: startX, y: startY });

          if (!startWithCooldown && cooldown > 0) {
            timeline.to({}, { duration: cooldown });
          }

          return timeline;
        },
        onComplete,
      );
    }
  }

  /**
   * Stops the sweeps at once, leaving the shine at the start of the sweep, outside of the mask.
   * @param target - Single shine element or array of them
   */
  public static stopShine(target: UIMicroAnimatedElement | UIMicroAnimatedElement[]): void {
    for (const element of resolveTargets(target)) {
      const sweep = shineSweeps.get(element.micro);
      if (sweep) {
        shineCalls.stop(element.micro, 0, "none", { x: sweep.startX, y: sweep.startY });
      }
    }
  }
}
