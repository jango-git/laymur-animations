import gsap from "gsap";
import type { UIAnimatedElement } from "./UIAnimatedElement";

const DEFAULT_X_FROM = 0;
const DEFAULT_X_TO = 0;
const DEFAULT_Y_FROM = 0;
const DEFAULT_Y_TO = 0;
const DEFAULT_SCALE_FROM = 0.5;
const DEFAULT_SCALE_TO = 1;
const DEFAULT_OPACITY_FROM = 0;
const DEFAULT_OPACITY_TO = 1;

const DEFAULT_DELAY = 0;
const DEFAULT_DURATION = 0.25;
const DEFAULT_EASE = "back.out(1.7)";

export interface UIAppearAnimatorOptions {
  xFrom: number;
  xTo: number;
  yFrom: number;
  yTo: number;

  scaleFrom: number;
  scaleTo: number;
  opacityFrom: number;
  opacityTo: number;

  delay: number;
  duration: number;
  ease: gsap.EaseString;
}

export class UIAppearAnimator {
  public static appear(
    target: UIAnimatedElement | UIAnimatedElement[],
    options: Partial<UIAppearAnimatorOptions> = {},
  ): Promise<void> {
    const {
      xFrom = DEFAULT_X_FROM,
      xTo = DEFAULT_X_TO,
      yFrom = DEFAULT_Y_FROM,
      yTo = DEFAULT_Y_TO,
      scaleFrom = DEFAULT_SCALE_FROM,
      scaleTo = DEFAULT_SCALE_TO,
      opacityFrom = DEFAULT_OPACITY_FROM,
      opacityTo = DEFAULT_OPACITY_TO,
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

    if (xFrom !== xTo) {
      microTarget.x = xTo;
      for (const element of elements) {
        element.micro.x = xFrom;
      }
    }
    if (yFrom !== yTo) {
      microTarget.y = yTo;
      for (const element of elements) {
        element.micro.y = yFrom;
      }
    }
    if (scaleFrom !== scaleTo) {
      microTarget.scaleX = scaleTo;
      microTarget.scaleY = scaleTo;
      for (const element of elements) {
        element.micro.scaleX = scaleFrom;
        element.micro.scaleY = scaleFrom;
      }
    }
    if (opacityFrom !== opacityTo) {
      elementTarget.opacity = opacityTo;
      for (const element of elements) {
        element.opacity = opacityFrom;
      }
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
