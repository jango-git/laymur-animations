import gsap from "gsap";
import type { UIAnimatedElement } from "./UIAnimatedElement";

const jumpCallTweens = new WeakMap<UIAnimatedElement, gsap.core.Timeline>();

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
  /** Height of the jump in pixels */
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
   * Starts a jumping animation with scale and position effects.
   * @param target - Single element or array of elements to animate
   * @param options - Animation configuration options
   */
  public static jump(
    target: UIAnimatedElement | UIAnimatedElement[],
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
    } = options;

    const elements = Array.isArray(target) ? target : [target];

    for (const element of elements) {
      const timeline = gsap.timeline({
        repeat: Number.isNaN(iterations) ? -1 : iterations,
        onComplete: () => {
          jumpCallTweens.delete(element);
        },
      });

      if (startWithCooldown && cooldown > 0) {
        timeline.to({}, { delay: cooldown });
      }

      element.micro.anchorY = 0;

      timeline
        .to(element.micro, {
          scaleX: scaleIn,
          scaleY: 1 / scaleIn,
          duration: durationIn * 0.5,
          ease: "power1.inOut",
        })
        .to(element.micro, {
          scaleX: 1 / scaleIn,
          scaleY: scaleIn,
          duration: durationIn * 0.25,
          ease: "power1.inOut",
        })
        .to(element.micro, {
          scaleX: 1,
          scaleY: 1,
          duration: durationIn * 0.25,
          ease: "power1.inOut",
        })
        .to(
          element.micro,
          {
            y: jumpHeight,
            duration: durationIn * 0.375,
            ease: easeIn,
          },
          durationIn * 0.625 +
            (startWithCooldown && cooldown > 0 ? cooldown : 0),
        )
        .to(element.micro, {
          y: 0,
          duration: durationOut * 0.375,
          ease: easeOut,
        })
        .to(element.micro, {
          scaleX: scaleOut,
          scaleY: 1 / scaleOut,
          duration: durationOut * 0.225,
          ease: "power1.out",
        })
        .to(element.micro, {
          scaleX: 1,
          scaleY: 1,
          duration: durationOut * 0.4,
          ease: "power1.inOut",
        });

      if (!startWithCooldown && cooldown > 0) {
        timeline.to({}, { delay: cooldown });
      }

      jumpCallTweens.set(element, timeline);
    }
  }

  /**
   * Stops the jumping animation and returns elements to rest position.
   * @param target - Single element or array of elements to stop animating
   * @param options - Stop animation configuration options
   */
  public static stopJump(
    target: UIAnimatedElement | UIAnimatedElement[],
    options: Partial<UIJumpCallAnimatorStopOptions> = {},
  ): void {
    const { duration = DEFAULT_STOP_DURATION, ease = DEFAULT_STOP_EASE } =
      options;
    const elements = Array.isArray(target) ? target : [target];

    for (const element of elements) {
      const tween = jumpCallTweens.get(element);

      if (tween instanceof gsap.core.Timeline) {
        tween.kill();
        jumpCallTweens.delete(element);

        gsap.to(element.micro, {
          y: 0,
          duration,
          ease,
        });
      }
    }
  }
}
