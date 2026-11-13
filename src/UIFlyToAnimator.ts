import gsap from "gsap";
import type { UIColor, UIMicro } from "laymur";

import { resolveTargets, settle } from "./miscellaneous.js";
import type { UIMicroAnimatedElement } from "./UIAnimatedElement.js";

const flights = new WeakMap<UIMicro, gsap.core.Timeline>();

const DEFAULT_ARC_HEIGHT = 100;
const DEFAULT_DELAY = 0;
const DEFAULT_STAGGER = 0.05;
const DEFAULT_DURATION = 0.6;
const DEFAULT_EASE = "power2.in";

/**
 * Element that can fly: its layout center is where the flight starts from.
 */
export interface UIFlyToElement extends UIMicroAnimatedElement {
  /** Center X coordinate in world units, without the micro transform */
  readonly centerX: number;
  /** Center Y coordinate in world units, without the micro transform */
  readonly centerY: number;
  /** Element color, faded when alphaTo is given */
  color?: UIColor;
}

/**
 * Where to fly: the center of an element, or a point in layer coordinates.
 */
export type UIFlyToTarget =
  | { readonly centerX: number; readonly centerY: number }
  | { readonly x: number; readonly y: number };

/**
 * Configuration options for fly-to animations.
 */
export interface UIFlyToAnimatorOptions {
  /** Height of the arc above the straight path at its middle in world units; 0 for a line */
  arcHeight: number;
  /** Target scale value on arrival; the scale is kept when not given */
  scaleTo: number;
  /** Target alpha value on arrival, for elements with a color; kept when not given */
  alphaTo: number;
  /** Animation delay in seconds */
  delay: number;
  /** Delay between the starts of consecutive elements in seconds */
  stagger: number;
  /** Animation duration in seconds */
  duration: number;
  /** GSAP easing function along the path */
  ease: gsap.EaseString;
}

/**
 * Animator for flights to a target, such as collected coins flying to a counter.
 */
export class UIFlyToAnimator {
  /**
   * Flies elements along an arc to the target through their micro offset; they stay there,
   * so reset their micro transform once they are done with. A flight replaces the one
   * running on the same element.
   * @param target - Single element or array of elements to fly
   * @param destination - Element or point to fly to
   * @param options - Animation configuration options
   * @returns Promise that resolves when animation completes or is interrupted
   */
  public static flyTo(
    target: UIFlyToElement | UIFlyToElement[],
    destination: UIFlyToTarget,
    options: Partial<UIFlyToAnimatorOptions> = {},
  ): Promise<void> {
    const {
      arcHeight = DEFAULT_ARC_HEIGHT,
      scaleTo,
      alphaTo,
      delay = DEFAULT_DELAY,
      stagger = DEFAULT_STAGGER,
      duration = DEFAULT_DURATION,
      ease = DEFAULT_EASE,
    } = options;

    const destinationX = "centerX" in destination ? destination.centerX : destination.x;
    const destinationY = "centerY" in destination ? destination.centerY : destination.y;

    const animations = resolveTargets(target).map((element, index) => {
      const micro = element.micro;
      flights.get(micro)?.kill();

      const fromX = micro.x;
      const fromY = micro.y;
      const toX = destinationX - element.centerX;
      const toY = destinationY - element.centerY;
      const progress = { value: 0 };

      const timeline = gsap.timeline({ delay: delay + index * stagger });
      timeline.to(
        progress,
        {
          value: 1,
          duration,
          ease,
          onUpdate: () => {
            const t = progress.value;
            micro.x = fromX + (toX - fromX) * t;
            micro.y = fromY + (toY - fromY) * t + arcHeight * 4 * t * (1 - t);
          },
        },
        0,
      );

      if (scaleTo !== undefined) {
        timeline.to(micro, { scaleX: scaleTo, scaleY: scaleTo, duration, ease }, 0);
      }
      if (alphaTo !== undefined && element.color !== undefined) {
        timeline.to(element.color, { a: alphaTo, duration, ease }, 0);
      }

      flights.set(micro, timeline);
      return settle(timeline).then(() => {
        if (flights.get(micro) === timeline) {
          flights.delete(micro);
        }
      });
    });

    return Promise.all(animations).then(() => undefined);
  }
}
