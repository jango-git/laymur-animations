import gsap from "gsap";
import type { UIMicroAnimatedElement } from "./UIAnimatedElement.js";
import { resolveTargets, UICallTracker } from "./miscellaneous.js";

const floatCalls = new UICallTracker(["y", "rotation"]);

const DEFAULT_AMPLITUDE = 10;
const DEFAULT_PERIOD = 2;
const DEFAULT_ROTATION = 0.03;
const DEFAULT_ROTATION_PERIOD = 3;
const DEFAULT_EASE = "sine.inOut";

const DEFAULT_STOP_DURATION = 0.4;
const DEFAULT_STOP_EASE = "power1.inOut";

/**
 * Configuration options for float call animations.
 */
export interface UIFloatCallAnimatorCallOptions {
  /** Vertical swing to each side of the rest position in world units */
  amplitude: number;
  /** Duration of a full up and down cycle in seconds */
  period: number;
  /** Rotation to each side of the rest rotation in radians; 0 for none */
  rotation: number;
  /** Duration of a full rotation cycle in seconds; differing from period keeps it organic */
  rotationPeriod: number;
  /** GSAP easing function of each half cycle */
  ease: gsap.EaseString;
  /** Called once the call ends: stopped or replaced by another float */
  onComplete: () => void;
}

/**
 * Configuration options for stopping float animations.
 */
export interface UIFloatCallAnimatorStopOptions {
  /** Duration to return to rest position in seconds */
  duration: number;
  /** GSAP easing function for stop transition */
  ease: gsap.EaseString;
}

/**
 * Animator for idle floating effects, such as a hovering item or logo.
 */
export class UIFloatCallAnimator {
  /**
   * Starts an endless floating animation: a vertical sway with an optional rocking rotation.
   * Replaces a float running on the same element.
   * @param target - Single element or array of elements to animate
   * @param options - Animation configuration options
   */
  public static float(
    target: UIMicroAnimatedElement | UIMicroAnimatedElement[],
    options: Partial<UIFloatCallAnimatorCallOptions> = {},
  ): void {
    const {
      amplitude = DEFAULT_AMPLITUDE,
      period = DEFAULT_PERIOD,
      rotation = DEFAULT_ROTATION,
      rotationPeriod = DEFAULT_ROTATION_PERIOD,
      ease = DEFAULT_EASE,
      onComplete,
    } = options;

    for (const element of resolveTargets(target)) {
      const micro = element.micro;

      floatCalls.start(
        micro,
        (rest) => {
          // From rest a quarter cycle to one side, then endless half cycles side to side
          const timeline = gsap.timeline();

          timeline
            .to(micro, { y: rest.y + amplitude, duration: period / 4, ease: "sine.out" }, 0)
            .to(micro, {
              y: rest.y - amplitude,
              duration: period / 2,
              ease,
              repeat: -1,
              yoyo: true,
            });

          if (rotation !== 0) {
            timeline
              .to(
                micro,
                {
                  rotation: rest.rotation + rotation,
                  duration: rotationPeriod / 4,
                  ease: "sine.out",
                },
                0,
              )
              .to(
                micro,
                {
                  rotation: rest.rotation - rotation,
                  duration: rotationPeriod / 2,
                  ease,
                  repeat: -1,
                  yoyo: true,
                },
                rotationPeriod / 4,
              );
          }

          return timeline;
        },
        onComplete,
      );
    }
  }

  /**
   * Stops the floating animation and returns elements to rest.
   * @param target - Single element or array of elements to stop animating
   * @param options - Stop animation configuration options
   */
  public static stopFloat(
    target: UIMicroAnimatedElement | UIMicroAnimatedElement[],
    options: Partial<UIFloatCallAnimatorStopOptions> = {},
  ): void {
    const { duration = DEFAULT_STOP_DURATION, ease = DEFAULT_STOP_EASE } = options;

    for (const element of resolveTargets(target)) {
      floatCalls.stop(element.micro, duration, ease);
    }
  }
}
