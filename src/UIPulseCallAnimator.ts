import gsap from "gsap";
import type { UIMicroAnimatedElement } from "./UIAnimatedElement.js";
import { iterationsToRepeat, resolveTargets, UICallTracker } from "./miscellaneous.js";

const pulseCalls = new UICallTracker(["scaleX", "scaleY"]);

const DEFAULT_SCALE = 1.1;
const DEFAULT_BEATS = 1;
const DEFAULT_ITERATIONS = -1;
const DEFAULT_COOLDOWN = 3;
const DEFAULT_START_WITH_COOLDOWN = true;
const DEFAULT_DURATION_IN = 0.25;
const DEFAULT_DURATION_OUT = 0.5;
const DEFAULT_EASE_IN = "power1.inOut";
const DEFAULT_EASE_OUT = "power1.inOut";

const DEFAULT_STOP_DURATION = 0.25;
const DEFAULT_STOP_EASE = "power1.inOut";

/**
 * Configuration options for pulse call animations.
 */
export interface UIPulseCallAnimatorOptions {
  /** Scale factor for pulse effect, relative to the rest scale */
  scale: number;
  /** Number of pulses in a row per iteration; 2 with short durations makes a heartbeat */
  beats: number;
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
  /** Called once the call ends: completed, stopped or replaced by another pulse */
  onComplete: () => void;
}

/**
 * Configuration options for stopping pulse animations.
 */
export interface UIPulseCallAnimatorStopOptions {
  /** Target scale value when stopping; the rest scale by default */
  scale: number;
  /** Duration to return to rest scale in seconds */
  duration: number;
  /** GSAP easing function for stop transition */
  ease: gsap.EaseString;
}

/**
 * Animator for pulse attention effects.
 */
export class UIPulseCallAnimator {
  /**
   * Starts a pulsing animation with scale effects. Replaces a pulse running on the same
   * element; the scale it rests at is kept from the first one.
   * @param target - Single element or array of elements to animate
   * @param options - Animation configuration options
   */
  public static pulse(
    target: UIMicroAnimatedElement | UIMicroAnimatedElement[],
    options: Partial<UIPulseCallAnimatorOptions> = {},
  ): void {
    const {
      scale = DEFAULT_SCALE,
      beats = DEFAULT_BEATS,
      iterations = DEFAULT_ITERATIONS,
      cooldown = DEFAULT_COOLDOWN,
      startWithCooldown = DEFAULT_START_WITH_COOLDOWN,
      durationIn = DEFAULT_DURATION_IN,
      durationOut = DEFAULT_DURATION_OUT,
      easeIn = DEFAULT_EASE_IN,
      easeOut = DEFAULT_EASE_OUT,
      onComplete,
    } = options;

    for (const element of resolveTargets(target)) {
      const micro = element.micro;

      pulseCalls.start(
        micro,
        (rest) => {
          const timeline = gsap.timeline({ repeat: iterationsToRepeat(iterations) });

          if (startWithCooldown && cooldown > 0) {
            timeline.to({}, { duration: cooldown });
          }

          for (let beat = 0; beat < Math.max(beats, 1); beat++) {
            timeline
              .to(micro, {
                scaleX: rest.scaleX * scale,
                scaleY: rest.scaleY * scale,
                duration: durationIn,
                ease: easeIn,
              })
              .to(micro, {
                scaleX: rest.scaleX,
                scaleY: rest.scaleY,
                duration: durationOut,
                ease: easeOut,
              });
          }

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
   * Stops the pulsing animation and returns elements to rest scale.
   * @param target - Single element or array of elements to stop animating
   * @param options - Stop animation configuration options
   */
  public static stopPulse(
    target: UIMicroAnimatedElement | UIMicroAnimatedElement[],
    options: Partial<UIPulseCallAnimatorStopOptions> = {},
  ): void {
    const { scale, duration = DEFAULT_STOP_DURATION, ease = DEFAULT_STOP_EASE } = options;

    for (const element of resolveTargets(target)) {
      pulseCalls.stop(
        element.micro,
        duration,
        ease,
        scale === undefined ? {} : { scaleX: scale, scaleY: scale },
      );
    }
  }
}
