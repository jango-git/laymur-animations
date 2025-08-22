import gsap from "gsap";
import type { UIAnimatedElement } from "./UIAnimatedElement";

const DEFAULT_X_FROM = 0;
const DEFAULT_X_TO = 0;
const DEFAULT_Y_FROM = 0;
const DEFAULT_Y_TO = 0;
const DEFAULT_SCALE_FROM = 0.5;
const DEFAULT_SCALE_TO = 1;
const DEFAULT_ALPHA_FROM = 0;
const DEFAULT_ALPHA_TO = 1;
const DEFAULT_DELAY = 0;
const DEFAULT_DURATION = 0.25;
const DEFAULT_EASE = "back.out(1.7)";

/**
 * Configuration options for appearance animations.
 */
export interface UIAppearAnimatorOptions {
  /** Starting X position */
  xFrom: number;
  /** Target X position */
  xTo: number;
  /** Starting Y position */
  yFrom: number;
  /** Target Y position */
  yTo: number;

  /** Starting scale value */
  scaleFrom: number;
  /** Target scale value */
  scaleTo: number;
  /** Starting alpha value */
  alphaFrom: number;
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
 * Animator for element appearance effects.
 */
export class UIAppearAnimator {
  /**
   * Animates elements appearing with position, scale, and alpha transitions.
   * @param target - Single element or array of elements to animate
   * @param options - Animation configuration options
   * @returns Promise that resolves when animation completes
   */
  public static appear(
    target: UIAnimatedElement | UIAnimatedElement[],
    options: Partial<UIAppearAnimatorOptions> = {},
  ): Promise<void> {
    const {
      xFrom = DEFAULT_X_FROM,
      xTo = DEFAULT_X_TO,
      yFrom = DEFAULT_Y_FROM,
      yTo = DEFAULT_Y_TO,
      scaleFrom = DEFAULT_SCALE_FROM,
      scaleTo = DEFAULT_SCALE_TO,
      alphaFrom = DEFAULT_ALPHA_FROM,
      alphaTo = DEFAULT_ALPHA_TO,
      delay = DEFAULT_DELAY,
      duration = DEFAULT_DURATION,
      ease = DEFAULT_EASE,
    } = options;

    const elements = Array.isArray(target) ? target : [target];
    const elementTarget: Record<string, unknown> = {
      duration,
      ease: "power1.inOut",
    };
    const colorTarget: Record<string, unknown> = {
      duration,
      ease: "power1.inOut",
    };
    const microTarget: Record<string, unknown> = { duration, ease };

    if (xFrom !== xTo) {
      microTarget.x = xTo;
      for (const element of elements) {
        element.micro.x = xFrom;
      }
    }
    if (yFrom !== yTo) {
      microTarget.y = yTo;
      for (const element of elements) {
        element.micro.y = yFrom;
      }
    }
    if (scaleFrom !== scaleTo) {
      microTarget.scaleX = scaleTo;
      microTarget.scaleY = scaleTo;
      for (const element of elements) {
        element.micro.scaleX = scaleFrom;
        element.micro.scaleY = scaleFrom;
      }
    }
    if (alphaFrom !== alphaTo) {
      colorTarget.a = alphaTo;
      for (const element of elements) {
        element.color.a = alphaFrom;
      }
    }

    return new Promise((onComplete) => {
      const timeline = gsap.timeline({ delay, onComplete });

      for (const element of elements) {
        timeline
          .to(element, elementTarget, 0)
          .to(element.micro, microTarget, 0)
          .to(element.color, colorTarget, 0);
      }
    });
  }
}
