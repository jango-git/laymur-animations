import gsap from "gsap";

import { iterationsToRepeat, resolveTargets, UICallTracker } from "./miscellaneous.js";
import type { UIMicroAnimatedElement } from "./UIAnimatedElement.js";

const spinCalls = new UICallTracker(["rotation", "anchorX", "anchorY"]);

const DEFAULT_ROTATION = 0.0435;
const DEFAULT_ANCHOR_X = 0.5;
const DEFAULT_ANCHOR_Y = 0.5;
const DEFAULT_SPIN_COUNT = 3;
const DEFAULT_ITERATIONS = -1;
const DEFAULT_COOLDOWN = 3;
const DEFAULT_START_WITH_COOLDOWN = true;
const DEFAULT_DURATION = 1;
const DEFAULT_EASE = "power1.inOut";

const DEFAULT_STOP_DURATION = 0.25;
const DEFAULT_STOP_EASE = "power1.inOut";

/**
 * Configuration options for spin call animations.
 */
export interface UISpinCallAnimatorCallOptions {
  /** Rotation angle in radians, relative to the rest rotation */
  rotation: number;
  /** Anchor point X coordinate (0-1) */
  anchorX: number;
  /** Anchor point Y coordinate (0-1) */
  anchorY: number;
  /** Number of spin oscillations */
  spinCount: number;
  /** Number of animation iterations (-1 for infinite) */
  iterations: number;
  /** Cooldown time between iterations in seconds */
  cooldown: number;
  /** Whether to start with cooldown delay */
  startWithCooldown: boolean;
  /** Total animation duration in seconds */
  duration: number;
  /** GSAP easing function */
  ease: gsap.EaseString;
  /** Called once the call ends: completed, stopped or replaced by another spin */
  onComplete: () => void;
}

/**
 * Configuration options for stopping spin animations.
 */
export interface UISpinCallAnimatorStopOptions {
  /** Duration to return to rest rotation in seconds */
  duration: number;
  /** GSAP easing function for stop transition */
  ease: gsap.EaseString;
}

/**
 * Animator for spin call attention effects.
 */
export class UISpinCallAnimator {
  /**
   * Starts a spinning animation with rotation oscillations. Replaces a spin running on the same
   * element; the anchor is restored once the element is back at rest.
   * @param target - Single element or array of elements to animate
   * @param options - Animation configuration options
   */
  public static spin(
    target: UIMicroAnimatedElement | UIMicroAnimatedElement[],
    options: Partial<UISpinCallAnimatorCallOptions> = {},
  ): void {
    const {
      rotation = DEFAULT_ROTATION,
      anchorX = DEFAULT_ANCHOR_X,
      anchorY = DEFAULT_ANCHOR_Y,
      spinCount = DEFAULT_SPIN_COUNT,
      iterations = DEFAULT_ITERATIONS,
      cooldown = DEFAULT_COOLDOWN,
      startWithCooldown = DEFAULT_START_WITH_COOLDOWN,
      duration = DEFAULT_DURATION,
      ease = DEFAULT_EASE,
      onComplete,
    } = options;

    for (const element of resolveTargets(target)) {
      const micro = element.micro;

      spinCalls.start(
        micro,
        (rest) => {
          micro.anchorX = anchorX;
          micro.anchorY = anchorY;

          const timeline = gsap.timeline({ repeat: iterationsToRepeat(iterations) });

          if (startWithCooldown && cooldown > 0) {
            timeline.to({}, { duration: cooldown });
          }

          const spinDuration = duration / (spinCount + 2);

          timeline.to(micro, {
            rotation: rest.rotation + rotation,
            duration: spinDuration,
            ease,
          });

          let currentRotation = rotation;
          for (let i = 0; i < spinCount; i++) {
            currentRotation *= -1;
            timeline.to(micro, {
              rotation: rest.rotation + currentRotation,
              duration: spinDuration,
              ease,
            });
          }

          timeline.to(micro, {
            rotation: rest.rotation,
            duration: spinDuration,
            ease,
          });

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
   * Stops the spinning animation and returns elements to rest rotation.
   * @param target - Single element or array of elements to stop animating
   * @param options - Stop animation configuration options
   */
  public static stopSpin(
    target: UIMicroAnimatedElement | UIMicroAnimatedElement[],
    options: Partial<UISpinCallAnimatorStopOptions> = {},
  ): void {
    const { duration = DEFAULT_STOP_DURATION, ease = DEFAULT_STOP_EASE } = options;

    for (const element of resolveTargets(target)) {
      spinCalls.stop(element.micro, duration, ease);
    }
  }
}
