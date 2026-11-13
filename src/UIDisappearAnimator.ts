import gsap from "gsap";

import {
  hideElement,
  isVisibilityTracked,
  resolveTargets,
  settle,
  stopVisibility,
  trackVisibility,
} from "./miscellaneous.js";
import type { UIAnimatedElement } from "./UIAnimatedElement.js";

const DEFAULT_DELAY = 0;
const DEFAULT_STAGGER = 0;
const DEFAULT_DURATION = 0.25;
const DEFAULT_EASE = "back.in(1.7)";
const DEFAULT_ALPHA_TO = 0;
const DEFAULT_HIDE = false;

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
  /** Delay between the starts of consecutive elements in seconds */
  stagger: number;
  /** Animation duration in seconds */
  duration: number;
  /** GSAP easing function */
  ease: gsap.EaseString;
  /**
   * Whether to set the mode of the element to HIDDEN once it has disappeared, so it stops
   * catching input; the appear animator gives the mode back
   */
  hide: boolean;
}

/**
 * Animator for element disappearance effects.
 */
export class UIDisappearAnimator {
  /**
   * Animates elements disappearing with position, scale, and alpha transitions. Replaces an
   * appearance or disappearance running on the same element.
   * @param target - Single element or array of elements to animate
   * @param options - Animation configuration options
   * @returns Promise that resolves when animation completes or is interrupted
   */
  public static disappear(
    target: UIAnimatedElement | UIAnimatedElement[],
    options: Partial<UIDisappearAnimatorOptions> = {},
  ): Promise<void> {
    const {
      delay = DEFAULT_DELAY,
      stagger = DEFAULT_STAGGER,
      duration = DEFAULT_DURATION,
      ease = DEFAULT_EASE,
      alphaTo = DEFAULT_ALPHA_TO,
      hide = DEFAULT_HIDE,
    } = options;

    const elements = resolveTargets(target);
    const microTarget: Record<string, unknown> = { duration, ease };
    const colorTarget: Record<string, unknown> = {
      duration,
      ease: "power1.inOut",
      a: alphaTo,
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

    const animations = elements.map((element, index) => {
      stopVisibility(element);

      const timeline = gsap.timeline({ delay: delay + index * stagger });
      timeline.to(element.micro, microTarget, 0).to(element.color, colorTarget, 0);
      trackVisibility(element, timeline);
      return settle(timeline).then((completed) => {
        // An appearance may have started since the disappearance completed
        if (completed && hide && isVisibilityTracked(element, timeline)) {
          hideElement(element);
        }
      });
    });

    return Promise.all(animations).then(() => undefined);
  }
}
