import gsap from "gsap";
import type { UIMicroAnimatedElement } from "./UIAnimatedElement.js";
import { iterationsToRepeat, resolveTargets, UICallTracker } from "./miscellaneous.js";

const jumpCalls = new UICallTracker(["y", "scaleX", "scaleY", "anchorY"]);

const DEFAULT_JUMP_HEIGHT = 35;
const DEFAULT_SCALE_IN = 1.15;
const DEFAULT_SCALE_OUT = 1.15;
const DEFAULT_ITERATIONS = -1;
const DEFAULT_COOLDOWN = 3;
const DEFAULT_START_WITH_COOLDOWN = true;
const DEFAULT_DURATION_IN = 0.5;
const DEFAULT_DURATION_OUT = 0.5;
const DEFAULT_EASE_IN = "power1.out";
const DEFAULT_EASE_OUT = "power1.in";

const DEFAULT_STOP_DURATION = 0.25;
const DEFAULT_STOP_EASE = "power1.inOut";

/**
 * Configuration options for jump call animations.
 */
export interface UIJumpCallAnimatorCallOptions {
  /** Height of the jump in world units */
  jumpHeight: number;
  /** Scale factor during jump start */
  scaleIn: number;
  /** Scale factor during jump end */
  scaleOut: number;
  /** Number of animation iterations (-1 for infinite) */
  iterations: number;
  /** Cooldown time between iterations in seconds */
  cooldown: number;
  /** Whether to start with cooldown delay */
  startWithCooldown: boolean;
  /** Duration of jump in phase in seconds */
  durationIn: number;
  /** Duration of jump out phase in seconds */
  durationOut: number;
  /** GSAP easing function for jump in */
  easeIn: gsap.EaseString;
  /** GSAP easing function for jump out */
  easeOut: gsap.EaseString;
  /** Called once the call ends: completed, stopped or replaced by another jump */
  onComplete: () => void;
}

/**
 * Configuration options for stopping jump animations.
 */
export interface UIJumpCallAnimatorStopOptions {
  /** Duration to return to rest position in seconds */
  duration: number;
  /** GSAP easing function for stop transition */
  ease: gsap.EaseString;
}

/**
 * Animator for jump call attention effects.
 */
export class UIJumpCallAnimator {
  /**
   * Starts a jumping animation with scale and position effects, squashing around the bottom
   * edge. Replaces a jump running on the same element; the anchor is restored once the
   * element is back at rest.
   * @param target - Single element or array of elements to animate
   * @param options - Animation configuration options
   */
  public static jump(
    target: UIMicroAnimatedElement | UIMicroAnimatedElement[],
    options: Partial<UIJumpCallAnimatorCallOptions> = {},
  ): void {
    const {
      jumpHeight = DEFAULT_JUMP_HEIGHT,
      scaleIn = DEFAULT_SCALE_IN,
      scaleOut = DEFAULT_SCALE_OUT,
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

      jumpCalls.start(
        micro,
        (rest) => {
          micro.anchorY = 0;

          const timeline = gsap.timeline({ repeat: iterationsToRepeat(iterations) });
          const leadIn = startWithCooldown && cooldown > 0 ? cooldown : 0;

          if (leadIn > 0) {
            timeline.to({}, { duration: leadIn });
          }

          timeline
            .to(micro, {
              scaleX: rest.scaleX * scaleIn,
              scaleY: rest.scaleY / scaleIn,
              duration: durationIn * 0.5,
              ease: "power1.inOut",
            })
            .to(micro, {
              scaleX: rest.scaleX / scaleIn,
              scaleY: rest.scaleY * scaleIn,
              duration: durationIn * 0.25,
              ease: "power1.inOut",
            })
            .to(micro, {
              scaleX: rest.scaleX,
              scaleY: rest.scaleY,
              duration: durationIn * 0.25,
              ease: "power1.inOut",
            })
            .to(
              micro,
              {
                y: rest.y + jumpHeight,
                duration: durationIn * 0.375,
                ease: easeIn,
              },
              leadIn + durationIn * 0.625,
            )
            .to(micro, {
              y: rest.y,
              duration: durationOut * 0.375,
              ease: easeOut,
            })
            .to(micro, {
              scaleX: rest.scaleX * scaleOut,
              scaleY: rest.scaleY / scaleOut,
              duration: durationOut * 0.225,
              ease: "power1.out",
            })
            .to(micro, {
              scaleX: rest.scaleX,
              scaleY: rest.scaleY,
              duration: durationOut * 0.4,
              ease: "power1.inOut",
            });

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
   * Stops the jumping animation and returns elements to rest position and scale.
   * @param target - Single element or array of elements to stop animating
   * @param options - Stop animation configuration options
   */
  public static stopJump(
    target: UIMicroAnimatedElement | UIMicroAnimatedElement[],
    options: Partial<UIJumpCallAnimatorStopOptions> = {},
  ): void {
    const { duration = DEFAULT_STOP_DURATION, ease = DEFAULT_STOP_EASE } = options;

    for (const element of resolveTargets(target)) {
      jumpCalls.stop(element.micro, duration, ease);
    }
  }
}
