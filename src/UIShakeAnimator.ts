import gsap from "gsap";

import { resolveTargets, UICallTracker } from "./miscellaneous.js";
import type { UIMicroAnimatedElement } from "./UIAnimatedElement.js";

const shakeCalls = new UICallTracker(["x", "rotation"]);

const DEFAULT_AMPLITUDE = 12;
const DEFAULT_ROTATION = 0;
const DEFAULT_SHAKES = 5;
const DEFAULT_DELAY = 0;
const DEFAULT_DURATION = 0.4;
const DEFAULT_EASE = "sine.inOut";

/**
 * Configuration options for shake animations.
 */
export interface UIShakeAnimatorOptions {
  /** Horizontal displacement of the first swing in world units; later swings decay */
  amplitude: number;
  /** Rotation of the first swing in radians, swinging along with the displacement */
  rotation: number;
  /** Number of swings */
  shakes: number;
  /** Animation delay in seconds */
  delay: number;
  /** Total animation duration in seconds */
  duration: number;
  /** GSAP easing function of each swing */
  ease: gsap.EaseString;
}

/**
 * Animator for decaying shake effects, such as an error or refusal feedback.
 */
export class UIShakeAnimator {
  /**
   * Shakes elements horizontally around the position they rest at, with swings decaying to
   * nothing. A shake replaces the one running on the same element.
   * @param target - Single element or array of elements to animate
   * @param options - Animation configuration options
   * @returns Promise that resolves when animation completes or is interrupted
   */
  public static shake(
    target: UIMicroAnimatedElement | UIMicroAnimatedElement[],
    options: Partial<UIShakeAnimatorOptions> = {},
  ): Promise<void> {
    const {
      amplitude = DEFAULT_AMPLITUDE,
      rotation = DEFAULT_ROTATION,
      shakes = DEFAULT_SHAKES,
      delay = DEFAULT_DELAY,
      duration = DEFAULT_DURATION,
      ease = DEFAULT_EASE,
    } = options;

    const swings = Math.max(Math.round(shakes), 1);
    const swingDuration = duration / (swings + 1);

    const animations = resolveTargets(target).map(
      (element) =>
        new Promise<void>((resolve) => {
          const micro = element.micro;

          shakeCalls.start(
            micro,
            (rest) => {
              const timeline = gsap.timeline({ delay });

              for (let i = 0; i < swings; i++) {
                const direction = i % 2 === 0 ? 1 : -1;
                const decay = 1 - i / swings;
                timeline.to(micro, {
                  x: rest.x + amplitude * direction * decay,
                  rotation: rest.rotation + rotation * direction * decay,
                  duration: swingDuration,
                  ease,
                });
              }

              return timeline.to(micro, {
                x: rest.x,
                rotation: rest.rotation,
                duration: swingDuration,
                ease,
              });
            },
            resolve,
          );
        }),
    );

    return Promise.all(animations).then(() => undefined);
  }
}
