import gsap from "gsap";
import type { UIAnimatedElement } from "./UIAnimatedElement";

const DEFAULT_SCALE = 1.15;
const DEFAULT_ITERATIONS = Infinity;
const DEFAULT_COOLDOWN = 4;
const DEFAULT_START_WITH_COOLDOWN = true;
const DEFAULT_DURATION = 0.5;
const DEFAULT_EASE_IN = "power1.in";
const DEFAULT_EASE_OUT = "power1.out";

const DEFAULT_STOP_SCALE = 1;
const DEFAULT_STOP_DURATION = 0.25;
const DEFAULT_STOP_EASE = "power1.inOut";

export interface UIPulseAnimatorCallOptions {
  scale: number;
  iterations: number;
  cooldown: number;
  startWithCooldown: boolean;
  duration: number;
  easeIn: gsap.EaseString;
  easeOut: gsap.EaseString;
}

export interface UIPulseAnimatorStopOptions {
  scale: number;
  duration: number;
  ease: gsap.EaseString;
}

export class UIPulseAnimator {
  public static pulse(
    target: UIAnimatedElement | UIAnimatedElement[],
    options: Partial<UIPulseAnimatorCallOptions> = {},
  ): void {
    const {
      scale = DEFAULT_SCALE,
      iterations = DEFAULT_ITERATIONS,
      cooldown = DEFAULT_COOLDOWN,
      startWithCooldown = DEFAULT_START_WITH_COOLDOWN,
      duration = DEFAULT_DURATION,
      easeIn = DEFAULT_EASE_IN,
      easeOut = DEFAULT_EASE_OUT,
    } = options;

    const elements = Array.isArray(target) ? target : [target];

    for (const element of elements) {
      const timeline = gsap.timeline({
        repeat: iterations,
        onComplete: () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Removing tween reference from element
          delete (element as any).__laymurPulseTween;
        },
      });

      timeline
        .to(element.micro, {
          scaleX: scale,
          scaleY: scale,
          delay: startWithCooldown ? cooldown : 0,
          duration,
          ease: easeIn,
        })
        .to(element.micro, {
          scaleX: element.micro.scaleX,
          scaleY: element.micro.scaleY,
          duration,
          ease: easeOut,
        });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Adding tween reference to element for cleanup
      (element as any).__laymurPulseTween = timeline;

      if (cooldown > 0 && !startWithCooldown) {
        timeline.repeatDelay(cooldown);
      }
    }
  }

  public static stopPulse(
    target: UIAnimatedElement | UIAnimatedElement[],
    options: Partial<UIPulseAnimatorStopOptions> = {},
  ): void {
    const {
      scale = DEFAULT_STOP_SCALE,
      duration = DEFAULT_STOP_DURATION,
      ease = DEFAULT_STOP_EASE,
    } = options;
    const elements = Array.isArray(target) ? target : [target];

    for (const element of elements) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Accessing tween reference from element
      const tween = (element as any).__laymurPulseTween;
      if (tween instanceof gsap.core.Timeline) {
        tween.kill();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Removing tween reference from element
        delete (element as any).__laymurPulseTween;

        gsap.to(element.micro, {
          scaleX: scale,
          scaleY: scale,
          duration,
          ease,
        });
      }
    }
  }
}
