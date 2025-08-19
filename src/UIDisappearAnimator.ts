import gsap from "gsap";
import type { UIAnimatedElement } from "./UIAnimatedElement";

const DEFAULT_DELAY = 0;
const DEFAULT_DURATION = 0.25;
const DEFAULT_EASE = "back.out(1.7)";

export interface UIDisappearAnimatorOptions {
  xTo: number;
  yTo: number;

  scaleTo: number;
  opacityTo: number;

  delay: number;
  duration: number;
  ease: gsap.EaseString;
}

export class UIDisappearAnimator {
  public static disappear(
    target: UIAnimatedElement | UIAnimatedElement[],
    options: Partial<UIDisappearAnimatorOptions> = {},
  ): Promise<void> {
    const {
      delay = DEFAULT_DELAY,
      duration = DEFAULT_DURATION,
      ease = DEFAULT_EASE,
    } = options;

    const elements = Array.isArray(target) ? target : [target];
    const elementTarget: Record<string, unknown> = {
      duration,
      ease: "power1.inOut",
    };
    const microTarget: Record<string, unknown> = { duration, ease };

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
    if (options.opacityTo !== undefined) {
      elementTarget.opacity = options.opacityTo;
    }

    return new Promise((onComplete) => {
      const timeline = gsap.timeline({ delay, onComplete });

      for (const element of elements) {
        timeline
          .to(element, elementTarget, 0)
          .to(element.micro, microTarget, 0);
      }
    });
  }
}
