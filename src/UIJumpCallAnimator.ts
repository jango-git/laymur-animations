import gsap from "gsap";
import type { UIAnimatedElement } from "./UIAnimatedElement";

const DEFAULT_JUMP_HEIGHT = 25;
const DEFAULT_ITERATIONS = Infinity;
const DEFAULT_COOLDOWN = 4;
const DEFAULT_START_WITH_COOLDOWN = false;
const DEFAULT_DURATION = 0.5;
const DEFAULT_EASE_UP = "power2.out";
const DEFAULT_EASE_DOWN = "bounce.out";

const DEFAULT_STOP_DURATION = 0.25;
const DEFAULT_STOP_EASE = "power1.inOut";

export interface UIJumpCallAnimatorCallOptions {
  jumpHeight: number;
  iterations: number;
  cooldown: number;
  startWithCooldown: boolean;
  duration: number;
  easeUp: gsap.EaseString;
  easeDown: gsap.EaseString;
}

export interface UIJumpCallAnimatorStopOptions {
  duration: number;
  ease: gsap.EaseString;
}

export class UIJumpCallAnimator {
  public static call(
    target: UIAnimatedElement | UIAnimatedElement[],
    options: Partial<UIJumpCallAnimatorCallOptions> = {},
  ): void {
    const {
      jumpHeight = DEFAULT_JUMP_HEIGHT,
      iterations = DEFAULT_ITERATIONS,
      cooldown = DEFAULT_COOLDOWN,
      startWithCooldown = DEFAULT_START_WITH_COOLDOWN,
      duration = DEFAULT_DURATION,
      easeUp = DEFAULT_EASE_UP,
      easeDown = DEFAULT_EASE_DOWN,
    } = options;

    const elements = Array.isArray(target) ? target : [target];

    for (const element of elements) {
      const timeline = gsap.timeline({
        repeat: iterations,
        onComplete: () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Removing tween reference from element
          delete (element as any).__laymurCallTween;
        },
      });

      timeline
        .to(element.micro, {
          y: jumpHeight,
          delay: startWithCooldown ? cooldown : 0,
          duration,
          ease: easeUp,
        })
        .to(element.micro, {
          y: 0,
          duration,
          ease: easeDown,
        });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Adding tween reference to element for cleanup
      (element as any).__laymurCallTween = timeline;

      if (cooldown > 0 && !startWithCooldown) {
        timeline.repeatDelay(cooldown);
      }
    }
  }

  public static stopCall(
    target: UIAnimatedElement | UIAnimatedElement[],
    options: Partial<UIJumpCallAnimatorStopOptions> = {},
  ): void {
    const { duration = DEFAULT_STOP_DURATION, ease = DEFAULT_STOP_EASE } =
      options;
    const elements = Array.isArray(target) ? target : [target];

    for (const element of elements) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Accessing tween reference from element
      const tween = (element as any).__laymurCallTween;

      if (tween instanceof gsap.core.Timeline) {
        tween.kill();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Removing tween reference from element
        delete (element as any).__laymurCallTween;

        gsap.to(element.micro, {
          y: 0,
          duration,
          ease,
        });
      }
    }
  }
}
