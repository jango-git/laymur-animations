import gsap from "gsap";

import { iterationsToRepeat, resolveTargets, UICallTracker } from "./miscellaneous.js";
import type { UIMicroAnimatedElement } from "./UIAnimatedElement.js";

const tapCalls = new UICallTracker(["x", "y", "scaleX", "scaleY", "anchorX", "anchorY"]);

const DEFAULT_PRESS_SCALE = 0.85;
const DEFAULT_PRESS_X = 0;
const DEFAULT_PRESS_Y = -10;
const DEFAULT_ANCHOR_X = 0.5;
const DEFAULT_ANCHOR_Y = 0.5;
const DEFAULT_TAPS = 1;
const DEFAULT_TAP_INTERVAL = 0.15;
const DEFAULT_ITERATIONS = -1;
const DEFAULT_COOLDOWN = 1;
const DEFAULT_START_WITH_COOLDOWN = false;
const DEFAULT_DURATION_IN = 0.15;
const DEFAULT_DURATION_OUT = 0.25;
const DEFAULT_EASE_IN = "power1.out";
const DEFAULT_EASE_OUT = "power1.inOut";

const DEFAULT_STOP_DURATION = 0.25;
const DEFAULT_STOP_EASE = "power1.inOut";

/**
 * Configuration options for tap call animations.
 */
export interface UITapCallAnimatorCallOptions {
  /** Scale factor while pressed, relative to the rest scale */
  pressScale: number;
  /** Horizontal shift while pressed in world units */
  pressX: number;
  /** Vertical shift while pressed in world units */
  pressY: number;
  /** Anchor point X coordinate (0-1) the press scales around, such as the fingertip */
  anchorX: number;
  /** Anchor point Y coordinate (0-1) the press scales around */
  anchorY: number;
  /** Number of taps in a row per iteration; 2 for a double tap */
  taps: number;
  /** Pause between taps in a row in seconds */
  tapInterval: number;
  /** Number of animation iterations (-1 for infinite) */
  iterations: number;
  /** Cooldown time between iterations in seconds */
  cooldown: number;
  /** Whether to start with cooldown delay */
  startWithCooldown: boolean;
  /** Duration of the press in seconds */
  durationIn: number;
  /** Duration of the release in seconds */
  durationOut: number;
  /** GSAP easing function for the press */
  easeIn: gsap.EaseString;
  /** GSAP easing function for the release */
  easeOut: gsap.EaseString;
  /** Called once the call ends: completed, stopped or replaced by another tap */
  onComplete: () => void;
}

/**
 * Configuration options for stopping tap animations.
 */
export interface UITapCallAnimatorStopOptions {
  /** Duration to return to rest in seconds */
  duration: number;
  /** GSAP easing function for stop transition */
  ease: gsap.EaseString;
}

/**
 * Animator for tap hints, such as a tutorial hand tapping a button.
 */
export class UITapCallAnimator {
  /**
   * Starts a tapping animation: the element presses in, shrinking and shifting, and releases.
   * Replaces a tap running on the same element; the anchor is restored once the element is
   * back at rest.
   * @param target - Single element or array of elements to animate
   * @param options - Animation configuration options
   */
  public static tap(
    target: UIMicroAnimatedElement | UIMicroAnimatedElement[],
    options: Partial<UITapCallAnimatorCallOptions> = {},
  ): void {
    const {
      pressScale = DEFAULT_PRESS_SCALE,
      pressX = DEFAULT_PRESS_X,
      pressY = DEFAULT_PRESS_Y,
      anchorX = DEFAULT_ANCHOR_X,
      anchorY = DEFAULT_ANCHOR_Y,
      taps = DEFAULT_TAPS,
      tapInterval = DEFAULT_TAP_INTERVAL,
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

      tapCalls.start(
        micro,
        (rest) => {
          micro.anchorX = anchorX;
          micro.anchorY = anchorY;

          const timeline = gsap.timeline({ repeat: iterationsToRepeat(iterations) });

          if (startWithCooldown && cooldown > 0) {
            timeline.to({}, { duration: cooldown });
          }

          const count = Math.max(Math.round(taps), 1);
          for (let tap = 0; tap < count; tap++) {
            if (tap > 0 && tapInterval > 0) {
              timeline.to({}, { duration: tapInterval });
            }
            timeline
              .to(micro, {
                x: rest.x + pressX,
                y: rest.y + pressY,
                scaleX: rest.scaleX * pressScale,
                scaleY: rest.scaleY * pressScale,
                duration: durationIn,
                ease: easeIn,
              })
              .to(micro, {
                x: rest.x,
                y: rest.y,
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
   * Stops the tapping animation and returns elements to rest.
   * @param target - Single element or array of elements to stop animating
   * @param options - Stop animation configuration options
   */
  public static stopTap(
    target: UIMicroAnimatedElement | UIMicroAnimatedElement[],
    options: Partial<UITapCallAnimatorStopOptions> = {},
  ): void {
    const { duration = DEFAULT_STOP_DURATION, ease = DEFAULT_STOP_EASE } = options;

    for (const element of resolveTargets(target)) {
      tapCalls.stop(element.micro, duration, ease);
    }
  }
}
