import gsap from "gsap";
import type { UIAnimatedElement } from "./UIAnimatedElement";

const DEFAULT_DELAY = 0;
const DEFAULT_DURATION = 0.25;
const DEFAULT_EASE = "back.out(1.7)";

/**
 * Configuration options for disappearance animations.
 */
export interface UIDisappearAnimatorOptions {
  /** Target X position */
  xTo: number;
  /** Target Y position */
  yTo: number;

  /** Target scale value */
  scaleTo: number;
  /** Target alpha value */
  alphaTo: number;

  /** Animation delay in seconds */
  delay: number;
  /** Animation duration in seconds */
  duration: number;
  /** GSAP easing function */
  ease: gsap.EaseString;
}

/**
 * Animator for element disappearance effects.
 */
export class UIDisappearAnimator {
  /**
   * Animates elements disappearing with position, scale, and alpha transitions.
   * @param target - Single element or array of elements to animate
   * @param options - Animation configuration options
   * @returns Promise that resolves when animation completes
   */
  public static disappear(
    target: UIAnimatedElement | UIAnimatedElement[],
    options: Partial<UIDisappearAnimatorOptions> = {},
  ): Promise<void> {
    const {
      delay = DEFAULT_DELAY,
      duration = DEFAULT_DURATION,
      ease = DEFAULT_EASE,
    } = options;

    const elements = Array.isArray(target) ? target : [target];
    const microTarget: Record<string, unknown> = { duration, ease };
    const colorTarget: Record<string, unknown> = {
      duration,
      ease: "power1.inOut",
    };

    if (options.xTo !== undefined) {
      microTarget.x = options.xTo;
    }
    if (options.yTo !== undefined) {
      microTarget.y = options.yTo;
    }
    if (options.scaleTo !== undefined) {
      microTarget.scaleX = options.scaleTo;
      microTarget.scaleY = options.scaleTo;
    }
    if (options.alphaTo !== undefined) {
      colorTarget.a = options.alphaTo;
    }

    return new Promise((onComplete) => {
      const timeline = gsap.timeline({ delay, onComplete });

      for (const element of elements) {
        timeline
          .to(element.micro, microTarget, 0)
          .to(element.color, colorTarget, 0);
      }
    });
  }
}
