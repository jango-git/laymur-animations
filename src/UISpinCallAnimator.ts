import gsap from "gsap";
import type { UIAnimatedElement } from "./UIAnimatedElement";

const DEFAULT_ANCHOR_X = 0.5;
const DEFAULT_ANCHOR_Y = 0.5;
const DEFAULT_ROTATION = 0.0435;
const DEFAULT_SWAY_COUNT = 4;
const DEFAULT_ITERATIONS = Infinity;
const DEFAULT_COOLDOWN = 4;
const DEFAULT_START_WITH_COOLDOWN = false;
const DEFAULT_DURATION = 1.5;
const DEFAULT_EASE = "power1.inOut";

const DEFAULT_STOP_DURATION = 0.25;
const DEFAULT_STOP_EASE = "power1.inOut";

export interface UISpinCallAnimatorCallOptions {
  anchorX: number;
  anchorY: number;
  rotation: number;
  swayCount: number;
  iterations: number;
  cooldown: number;
  startWithCooldown: boolean;
  duration: number;
  ease: gsap.EaseString;
}

export interface UISpinCallAnimatorStopOptions {
  duration: number;
  ease: gsap.EaseString;
}

export class UISpinCallAnimator {
  public static call(
    target: UIAnimatedElement | UIAnimatedElement[],
    options: Partial<UISpinCallAnimatorCallOptions> = {},
  ): void {
    const {
      anchorX = DEFAULT_ANCHOR_X,
      anchorY = DEFAULT_ANCHOR_Y,
      rotation = DEFAULT_ROTATION,
      swayCount = DEFAULT_SWAY_COUNT,
      iterations = DEFAULT_ITERATIONS,
      cooldown = DEFAULT_COOLDOWN,
      startWithCooldown = DEFAULT_START_WITH_COOLDOWN,
      duration = DEFAULT_DURATION,
      ease = DEFAULT_EASE,
    } = options;

    const elements = Array.isArray(target) ? target : [target];
    const realDuration = duration / (2 + iterations);

    for (const element of elements) {
      element.micro.anchorX = anchorX;
      element.micro.anchorY = anchorY;

      const timeline = gsap.timeline({
        repeat: iterations,
        onComplete: () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Removing tween reference from element
          delete (element as any).__laymurSpinTween;
        },
      });

      timeline.to(element.micro, {
        rotation,
        delay: startWithCooldown ? cooldown : 0,
        duration: realDuration,
        ease,
      });

      let currentRotation = rotation;
      for (let i = 0; i < swayCount; i++) {
        timeline.to(element.micro, {
          rotation: (currentRotation *= -1),
          duration: realDuration,
          ease,
        });
      }

      timeline.to(element.micro, {
        rotation: 0,
        duration: realDuration,
        ease,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Adding tween reference to element for cleanup
      (element as any).__laymurSpinTween = timeline;

      if (cooldown > 0 && !startWithCooldown) {
        timeline.repeatDelay(cooldown);
      }
    }
  }

  public static stopCall(
    target: UIAnimatedElement | UIAnimatedElement[],
    options: Partial<UISpinCallAnimatorStopOptions> = {},
  ): void {
    const { duration = DEFAULT_STOP_DURATION, ease = DEFAULT_STOP_EASE } =
      options;
    const elements = Array.isArray(target) ? target : [target];

    for (const element of elements) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Accessing tween reference from element
      const tween = (element as any).__laymurSpinTween;
      if (tween instanceof gsap.core.Timeline) {
        tween.kill();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Removing tween reference from element
        delete (element as any).__laymurSpinTween;

        gsap.to(element.micro, {
          rotation: 0,
          duration,
          ease,
        });
      }
    }
  }
}
