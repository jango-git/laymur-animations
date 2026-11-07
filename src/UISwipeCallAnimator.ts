import gsap from "gsap";
import type { UIMicroAnimatedElement } from "./UIAnimatedElement.js";
import { iterationsToRepeat, resolveTargets, UICallTracker } from "./miscellaneous.js";

const swipeCalls = new UICallTracker(["x", "y"]);

const DEFAULT_DX = 25;
const DEFAULT_DY = 0;
const DEFAULT_ITERATIONS = -1;
const DEFAULT_COOLDOWN = 0;
const DEFAULT_START_WITH_COOLDOWN = false;
const DEFAULT_DURATION = 0.4;
const DEFAULT_EASE_IN = "power1.inOut";
const DEFAULT_EASE_OUT = "power1.inOut";

const DEFAULT_STOP_DURATION = 0.25;
const DEFAULT_STOP_EASE = "power1.inOut";

/**
 * Configuration options for swipe call animations.
 */
export interface UISwipeCallAnimatorCallOptions {
  /** Horizontal displacement of the swipe vector in world units */
  dx: number;
  /** Vertical displacement of the swipe vector in world units */
  dy: number;
  /** Number of animation iterations (-1 for infinite) */
  iterations: number;
  /** Cooldown time between iterations in seconds */
  cooldown: number;
  /** Whether to start with cooldown delay */
  startWithCooldown: boolean;
  /** Duration of one direction of the swipe in seconds */
  duration: number;
  /** GSAP easing function for the forward swipe */
  easeIn: gsap.EaseString;
  /** GSAP easing function for the return swipe */
  easeOut: gsap.EaseString;
  /** Called once the call ends: completed, stopped or replaced by another swipe */
  onComplete: () => void;
}

/**
 * Configuration options for stopping swipe animations.
 */
export interface UISwipeCallAnimatorStopOptions {
  /** Duration to return to rest position in seconds */
  duration: number;
  /** GSAP easing function for stop transition */
  ease: gsap.EaseString;
}

/**
 * Animator for swipe call attention effects with pingpong movement along an arbitrary vector.
 */
export class UISwipeCallAnimator {
  /**
   * Starts a pingpong swipe animation along the vector (dx, dy) from the rest position.
   * Replaces a swipe running on the same element.
   * @param target - Single element or array of elements to animate
   * @param options - Animation configuration options
   */
  public static swipe(
    target: UIMicroAnimatedElement | UIMicroAnimatedElement[],
    options: Partial<UISwipeCallAnimatorCallOptions> = {},
  ): void {
    const {
      dx = DEFAULT_DX,
      dy = DEFAULT_DY,
      iterations = DEFAULT_ITERATIONS,
      cooldown = DEFAULT_COOLDOWN,
      startWithCooldown = DEFAULT_START_WITH_COOLDOWN,
      duration = DEFAULT_DURATION,
      easeIn = DEFAULT_EASE_IN,
      easeOut = DEFAULT_EASE_OUT,
      onComplete,
    } = options;

    for (const element of resolveTargets(target)) {
      const micro = element.micro;

      swipeCalls.start(
        micro,
        (rest) => {
          const timeline = gsap.timeline({ repeat: iterationsToRepeat(iterations) });

          if (startWithCooldown && cooldown > 0) {
            timeline.to({}, { duration: cooldown });
          }

          timeline
            .to(micro, {
              x: rest.x + dx,
              y: rest.y + dy,
              duration,
              ease: easeIn,
            })
            .to(micro, {
              x: rest.x,
              y: rest.y,
              duration,
              ease: easeOut,
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
   * Stops the swipe animation and returns elements to rest position.
   * @param target - Single element or array of elements to stop animating
   * @param options - Stop animation configuration options
   */
  public static stopSwipe(
    target: UIMicroAnimatedElement | UIMicroAnimatedElement[],
    options: Partial<UISwipeCallAnimatorStopOptions> = {},
  ): void {
    const { duration = DEFAULT_STOP_DURATION, ease = DEFAULT_STOP_EASE } = options;

    for (const element of resolveTargets(target)) {
      swipeCalls.stop(element.micro, duration, ease);
    }
  }
}
