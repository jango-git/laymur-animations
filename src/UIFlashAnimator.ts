import gsap from "gsap";

import { resolveTargets, settle } from "./miscellaneous.js";

const flashes = new WeakMap<UIFlashElement, { rest: number; timeline: gsap.core.Timeline }>();

const DEFAULT_LIGHTNESS = 0.35;
const DEFAULT_FLASHES = 1;
const DEFAULT_DELAY = 0;
const DEFAULT_DURATION_IN = 0.08;
const DEFAULT_DURATION_OUT = 0.3;
const DEFAULT_EASE_IN = "power1.out";
const DEFAULT_EASE_OUT = "power1.in";

/**
 * Element whose lightness can be animated, such as any laymur UIElement.
 */
export interface UIFlashElement {
  /** Lightness offset (0 = unchanged) */
  lightness: number;
}

/**
 * Configuration options for flash animations.
 */
export interface UIFlashAnimatorOptions {
  /** Lightness offset at the peak of the flash, added to the rest lightness */
  lightness: number;
  /** Number of flashes in a row */
  flashes: number;
  /** Animation delay in seconds */
  delay: number;
  /** Duration of the light up in seconds */
  durationIn: number;
  /** Duration of the fade back in seconds */
  durationOut: number;
  /** GSAP easing function for the light up */
  easeIn: gsap.EaseString;
  /** GSAP easing function for the fade back */
  easeOut: gsap.EaseString;
}

/**
 * Animator for flash highlights, such as a hit or reward feedback.
 */
export class UIFlashAnimator {
  /**
   * Lights elements up and fades them back to the lightness they rest at. A flash replaces
   * the one running on the same element.
   * @param target - Single element or array of elements to animate
   * @param options - Animation configuration options
   * @returns Promise that resolves when animation completes or is interrupted
   */
  public static flash(
    target: UIFlashElement | UIFlashElement[],
    options: Partial<UIFlashAnimatorOptions> = {},
  ): Promise<void> {
    const {
      lightness = DEFAULT_LIGHTNESS,
      flashes: count = DEFAULT_FLASHES,
      delay = DEFAULT_DELAY,
      durationIn = DEFAULT_DURATION_IN,
      durationOut = DEFAULT_DURATION_OUT,
      easeIn = DEFAULT_EASE_IN,
      easeOut = DEFAULT_EASE_OUT,
    } = options;

    const animations = resolveTargets(target).map((element) => {
      const previous = flashes.get(element);
      previous?.timeline.kill();
      const rest = previous?.rest ?? element.lightness;

      const timeline = gsap.timeline({ delay });
      for (let i = 0; i < Math.max(Math.round(count), 1); i++) {
        timeline
          .to(element, { lightness: rest + lightness, duration: durationIn, ease: easeIn })
          .to(element, { lightness: rest, duration: durationOut, ease: easeOut });
      }

      flashes.set(element, { rest, timeline });
      return settle(timeline).then(() => {
        if (flashes.get(element)?.timeline === timeline) {
          flashes.delete(element);
        }
      });
    });

    return Promise.all(animations).then(() => undefined);
  }
}
