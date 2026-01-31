import gsap from "gsap";
import type { UIAnimatedElement } from "./UIAnimatedElement";

const swipeCallTweens = new WeakMap<UIAnimatedElement, gsap.core.Timeline>();

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
  /** Horizontal displacement of the swipe vector in pixels */
  dx: number;
  /** Vertical displacement of the swipe vector in pixels */
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
   * Starts an infinite pingpong swipe animation along the vector (dx, dy).
   * @param target - Single element or array of elements to animate
   * @param options - Animation configuration options
   */
  public static swipe(
    target: UIAnimatedElement | UIAnimatedElement[],
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
    } = options;

    const elements = Array.isArray(target) ? target : [target];

    for (const element of elements) {
      const timeline = gsap.timeline({
        repeat: Number.isNaN(iterations) ? -1 : iterations,
        onComplete: () => {
          swipeCallTweens.delete(element);
        },
      });

      if (startWithCooldown && cooldown > 0) {
        timeline.to({}, { duration: cooldown });
      }

      timeline
        .to(element.micro, {
          x: element.micro.x + dx,
          y: element.micro.y + dy,
          duration,
          ease: easeIn,
        })
        .to(element.micro, {
          x: element.micro.x,
          y: element.micro.y,
          duration,
          ease: easeOut,
        });

      if (!startWithCooldown && cooldown > 0) {
        timeline.to({}, { duration: cooldown });
      }

      swipeCallTweens.set(element, timeline);
    }
  }

  /**
   * Stops the swipe animation and returns elements to rest position.
   * @param target - Single element or array of elements to stop animating
   * @param options - Stop animation configuration options
   */
  public static stopSwipe(
    target: UIAnimatedElement | UIAnimatedElement[],
    options: Partial<UISwipeCallAnimatorStopOptions> = {},
  ): void {
    const { duration = DEFAULT_STOP_DURATION, ease = DEFAULT_STOP_EASE } = options;
    const elements = Array.isArray(target) ? target : [target];

    for (const element of elements) {
      const tween = swipeCallTweens.get(element);

      if (tween instanceof gsap.core.Timeline) {
        tween.kill();
        swipeCallTweens.delete(element);

        gsap.to(element.micro, {
          x: 0,
          y: 0,
          duration,
          ease,
        });
      }
    }
  }
}
