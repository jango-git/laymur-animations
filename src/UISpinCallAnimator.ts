import gsap from "gsap";
import type { UIAnimatedElement } from "./UIAnimatedElement";

const spinCallTweens = new WeakMap<UIAnimatedElement, gsap.core.Timeline>();

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
  /** Rotation angle in radians */
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
   * Starts a spinning animation with rotation oscillations.
   * @param target - Single element or array of elements to animate
   * @param options - Animation configuration options
   */
  public static spin(
    target: UIAnimatedElement | UIAnimatedElement[],
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
    } = options;

    const elements = Array.isArray(target) ? target : [target];

    for (const element of elements) {
      element.micro.anchorX = anchorX;
      element.micro.anchorY = anchorY;

      const timeline = gsap.timeline({
        repeat: Number.isNaN(iterations) ? -1 : iterations,
        onComplete: () => {
          spinCallTweens.delete(element);
        },
      });

      if (startWithCooldown && cooldown > 0) {
        timeline.to({}, { delay: cooldown });
      }

      const spinDuration = duration / (spinCount + 2);

      timeline.to(element.micro, {
        rotation,
        duration: spinDuration,
        ease,
      });

      let currentRotation = rotation;
      for (let i = 0; i < spinCount; i++) {
        timeline.to(element.micro, {
          rotation: (currentRotation *= -1),
          duration: spinDuration,
          ease,
        });
      }

      timeline.to(element.micro, {
        rotation: 0,
        duration: spinDuration,
        ease,
      });

      if (!startWithCooldown && cooldown > 0) {
        timeline.to({}, { delay: cooldown });
      }

      spinCallTweens.set(element, timeline);
    }
  }

  /**
   * Stops the spinning animation and returns elements to rest rotation.
   * @param target - Single element or array of elements to stop animating
   * @param options - Stop animation configuration options
   */
  public static stopSpin(
    target: UIAnimatedElement | UIAnimatedElement[],
    options: Partial<UISpinCallAnimatorStopOptions> = {},
  ): void {
    const { duration = DEFAULT_STOP_DURATION, ease = DEFAULT_STOP_EASE } =
      options;
    const elements = Array.isArray(target) ? target : [target];

    for (const element of elements) {
      const tween = spinCallTweens.get(element);
      if (tween instanceof gsap.core.Timeline) {
        tween.kill();
        spinCallTweens.delete(element);

        gsap.to(element.micro, {
          rotation: 0,
          duration,
          ease,
        });
      }
    }
  }
}
