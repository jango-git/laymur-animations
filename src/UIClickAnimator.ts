import gsap from "gsap";
import type { UIAnimatedElement } from "./UIAnimatedElement";

const DEFAULT_X_OFFSET = 0;
const DEFAULT_Y_OFFSET = -25;
const DEFAULT_X_SCALE = 0.85;
const DEFAULT_Y_SCALE = 1;
const DEFAULT_DELAY = 0;
const DEFAULT_DURATION_IN = 0.125;
const DEFAULT_DURATION_OUT = 0.25;
const DEFAULT_EASE_IN = "power1.out";
const DEFAULT_EASE_OUT = "back.out";

/**
 * Configuration options for click animations.
 */
export interface UIClickAnimatorOptions {
  /** X position offset during click */
  xOffset: number;
  /** Y position offset during click */
  yOffset: number;
  /** X scale factor during click */
  xScale: number;
  /** Y scale factor during click */
  yScale: number;
  /** Animation delay in seconds */
  delay: number;
  /** Duration of click in phase in seconds */
  durationIn: number;
  /** Duration of click out phase in seconds */
  durationOut: number;
  /** GSAP easing function for click in */
  easeIn: gsap.EaseString;
  /** GSAP easing function for click out */
  easeOut: gsap.EaseString;
}

/**
 * Animator for click feedback effects.
 */
export class UIClickAnimator {
  /**
   * Animates elements with click feedback including position offset and scale effects.
   * @param target - Single element or array of elements to animate
   * @param options - Animation configuration options
   * @returns Promise that resolves when animation completes
   */
  public static click(
    target: UIAnimatedElement | UIAnimatedElement[],
    options: Partial<UIClickAnimatorOptions> = {},
  ): Promise<void> {
    const {
      xOffset = DEFAULT_X_OFFSET,
      yOffset = DEFAULT_Y_OFFSET,
      xScale = DEFAULT_X_SCALE,
      yScale = DEFAULT_Y_SCALE,
      delay = DEFAULT_DELAY,
      durationIn = DEFAULT_DURATION_IN,
      durationOut = DEFAULT_DURATION_OUT,
      easeIn = DEFAULT_EASE_IN,
      easeOut = DEFAULT_EASE_OUT,
    } = options;

    const elements = Array.isArray(target) ? target : [target];

    return new Promise((onComplete) => {
      const timeline = gsap.timeline({ onComplete });

      const inMicroTarget: Record<string, unknown> = {
        delay,
        duration: durationIn,
        ease: easeIn,
      };

      const outMicroTarget: Record<string, unknown> = {
        duration: durationOut,
        ease: easeOut,
      };

      if (xOffset !== 0) {
        inMicroTarget.x = xOffset;
        outMicroTarget.x = 0;
      }

      if (yOffset !== 0) {
        inMicroTarget.y = yOffset;
        outMicroTarget.y = 0;
      }

      if (xScale !== 1) {
        inMicroTarget.scaleX = xScale;
        outMicroTarget.scaleX = 1;
      }

      if (yScale !== 1) {
        inMicroTarget.scaleY = yScale;
        outMicroTarget.scaleY = 1;
      }

      for (const element of elements) {
        timeline.to(element.micro, inMicroTarget, 0).to(element.micro, outMicroTarget);
      }
    });
  }
}
