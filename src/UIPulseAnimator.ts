import gsap from "gsap";
import type { UIAnimatedElement } from "./UIAnimatedElement";

const DEFAULT_SCALE = 1.1;
const DEFAULT_ITERATIONS = -1;
const DEFAULT_COOLDOWN = 3;
const DEFAULT_START_WITH_COOLDOWN = true;
const DEFAULT_DURATION_IN = 0.25;
const DEFAULT_DURATION_OUT = 0.5;
const DEFAULT_EASE_IN = "power1.inOut";
const DEFAULT_EASE_OUT = "power1.inOut";

const DEFAULT_STOP_SCALE = 1;
const DEFAULT_STOP_DURATION = 0.25;
const DEFAULT_STOP_EASE = "power1.inOut";

/**
 * Configuration options for pulse call animations.
 */
export interface UIPulseAnimatorCallOptions {
  /** Scale factor for pulse effect */
  scale: number;
  /** Number of animation iterations (-1 for infinite) */
  iterations: number;
  /** Cooldown time between iterations in seconds */
  cooldown: number;
  /** Whether to start with cooldown delay */
  startWithCooldown: boolean;
  /** Duration of scale in phase in seconds */
  durationIn: number;
  /** Duration of scale out phase in seconds */
  durationOut: number;
  /** GSAP easing function for scale in */
  easeIn: gsap.EaseString;
  /** GSAP easing function for scale out */
  easeOut: gsap.EaseString;
}

/**
 * Configuration options for stopping pulse animations.
 */
export interface UIPulseAnimatorStopOptions {
  /** Target scale value when stopping */
  scale: number;
  /** Duration to return to rest scale in seconds */
  duration: number;
  /** GSAP easing function for stop transition */
  ease: gsap.EaseString;
}

/**
 * Animator for pulse attention effects.
 */
export class UIPulseAnimator {
  /**
   * Starts a pulsing animation with scale effects.
   * @param target - Single element or array of elements to animate
   * @param options - Animation configuration options
   */
  public static pulse(
    target: UIAnimatedElement | UIAnimatedElement[],
    options: Partial<UIPulseAnimatorCallOptions> = {},
  ): void {
    const {
      scale = DEFAULT_SCALE,
      iterations = DEFAULT_ITERATIONS,
      cooldown = DEFAULT_COOLDOWN,
      startWithCooldown = DEFAULT_START_WITH_COOLDOWN,
      durationIn = DEFAULT_DURATION_IN,
      durationOut = DEFAULT_DURATION_OUT,
      easeIn = DEFAULT_EASE_IN,
      easeOut = DEFAULT_EASE_OUT,
    } = options;

    const elements = Array.isArray(target) ? target : [target];

    for (const element of elements) {
      const timeline = gsap.timeline({
        repeat: Number.isNaN(iterations) ? -1 : iterations,
        onComplete: () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Removing tween reference from element
          delete (element as any).__laymurPulseTween;
        },
      });

      if (startWithCooldown && cooldown > 0) {
        timeline.to({}, { duration: cooldown });
      }

      timeline
        .to(element.micro, {
          scaleX: scale,
          scaleY: scale,
          duration: durationIn,
          ease: easeIn,
        })
        .to(element.micro, {
          scaleX: element.micro.scaleX,
          scaleY: element.micro.scaleY,
          duration: durationOut,
          ease: easeOut,
        });

      if (!startWithCooldown && cooldown > 0) {
        timeline.to({}, { duration: cooldown });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Adding tween reference to element for cleanup
      (element as any).__laymurPulseTween = timeline;
    }
  }

  /**
   * Stops the pulsing animation and returns elements to rest scale.
   * @param target - Single element or array of elements to stop animating
   * @param options - Stop animation configuration options
   */
  public static stopPulse(
    target: UIAnimatedElement | UIAnimatedElement[],
    options: Partial<UIPulseAnimatorStopOptions> = {},
  ): void {
    const {
      scale = DEFAULT_STOP_SCALE,
      duration = DEFAULT_STOP_DURATION,
      ease = DEFAULT_STOP_EASE,
    } = options;
    const elements = Array.isArray(target) ? target : [target];

    for (const element of elements) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Accessing tween reference from element
      const tween = (element as any).__laymurPulseTween;
      if (tween instanceof gsap.core.Timeline) {
        tween.kill();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Removing tween reference from element
        delete (element as any).__laymurPulseTween;

        gsap.to(element.micro, {
          scaleX: scale,
          scaleY: scale,
          duration,
          ease,
        });
      }
    }
  }
}
