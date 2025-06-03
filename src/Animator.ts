import { gsap } from "gsap";

export interface AnimatedElement {
  opacity: number;
  micro: {
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    anchorX: number;
    anchorY: number;
    angle: number;
  };
}

export class Animator {
  public static appear(
    targets: AnimatedElement | AnimatedElement[],
    options: {
      x?: number;
      y?: number;
      scale?: number;
      ease?: string;
      duration?: number;
      delay?: number;
      opacity?: number;
    } = {},
  ): Promise<void> {
    const {
      ease = "back.out(1.7)",
      duration = 0.5,
      delay = 0,
      scale = 0.8,
      opacity = 1,
    } = options;
    const elements = Array.isArray(targets) ? targets : [targets];

    const targetMicro = {
      ease,
      duration,
      scaleX: 1,
      scaleY: 1,
      ...(options.x && { x: 0 }),
      ...(options.y && { y: 0 }),
    };

    for (const el of elements) {
      if (options.x) {
        el.micro.x = options.x;
      }
      if (options.y) {
        el.micro.y = options.y;
      }
      if (options.scale) {
        el.micro.scaleX = scale;
        el.micro.scaleY = scale;
      }
      el.opacity = 0;
    }

    return new Promise((resolve) => {
      const timeline = gsap.timeline({ onComplete: resolve, delay });

      for (const element of elements) {
        timeline
          .to(element, { opacity, ease: "power1.inOut", duration }, 0)
          .to(element.micro, targetMicro, 0);
      }
    });
  }

  public static disappear(
    targets: AnimatedElement | AnimatedElement[],
    options: {
      x?: number;
      y?: number;
      scale?: number;
      ease?: string;
      duration?: number;
      delay?: number;
      opacity?: number;
    } = {},
  ): Promise<void> {
    const {
      ease = "back.in(1.7)",
      duration = 0.5,
      delay = 0,
      scale = 0.8,
      opacity = 0,
    } = options;
    const elements = Array.isArray(targets) ? targets : [targets];

    const targetMicro = {
      ease,
      duration,
      scaleX: scale,
      scaleY: scale,
      ...(options.x && { x: options.x }),
      ...(options.y && { y: options.y }),
    };

    return new Promise((resolve) => {
      const timeline = gsap.timeline({ onComplete: resolve, delay });

      for (const element of elements) {
        timeline
          .to(element, { opacity, ease: "power1.inOut", duration }, 0)
          .to(element.micro, targetMicro, 0);
      }
    });
  }

  public static toggleSelect(
    targets: AnimatedElement | AnimatedElement[],
    options: {
      selected: boolean;
      anchorX?: number;
      anchorY?: number;
      scale?: number;
      duration?: number;
      ease?: string;
    },
  ): Promise<void> {
    const {
      selected,
      scale = 1.25,
      duration = 0.25,
      ease = "power1.inOut",
    } = options;

    const elements = Array.isArray(targets) ? targets : [targets];

    const targetMicro = {
      ease,
      duration,
      ...(options.scale && {
        scaleX: selected ? scale : 1,
        scaleY: selected ? scale : 1,
      }),
    };

    for (const element of elements) {
      if (options.anchorX) {
        element.micro.anchorX = options.anchorX;
      }
      if (options.anchorY) {
        element.micro.anchorY = options.anchorY;
      }
      if (options.scale) {
        element.micro.scaleX = options.scale;
        element.micro.scaleY = options.scale;
      }
      element.opacity = 0;
    }

    return new Promise((resolve) => {
      const timeline = gsap.timeline({ onComplete: resolve });

      for (const element of elements) {
        timeline.to(element.micro, targetMicro, 0);
      }
    });
  }

  public static click(
    targets: AnimatedElement | AnimatedElement[],
    options: {
      scale?: number;
      duration?: number;
      ease?: string;
    } = {},
  ): Promise<void> {
    const { scale = 0.9, duration = 0.15, ease = "power1.inOut" } = options;

    const elements = Array.isArray(targets) ? targets : [targets];

    const targetMicro = {
      ease,
      duration,
      ...(options.scale && {
        scaleX: scale,
        scaleY: scale,
      }),
    };

    return new Promise((resolve) => {
      const timeline = gsap.timeline({ onComplete: resolve });

      for (const element of elements) {
        timeline.to(element.micro, targetMicro, 0);
        timeline.to(
          element.micro,
          {
            scaleX: 1,
            scaleY: 1,
            duration,
            ease,
          },
          0,
        );
      }
    });
  }

  public static pulse(
    targets: AnimatedElement | AnimatedElement[],
    options: {
      scale?: number;
      duration?: number;
      ease?: string;
      gap?: number;
      totalDuration?: number;
    } = {},
  ): void {
    const {
      scale = 1.15,
      duration = 0.5,
      ease = "power1.inOut",
      gap = 0,
    } = options;

    const elements = Array.isArray(targets) ? targets : [targets];

    for (const element of elements) {
      const timeline = gsap.timeline({ repeat: -1, defaults: { ease } });

      timeline
        .to(element.micro, {
          scaleX: scale,
          scaleY: scale,
          duration,
        })
        .to(element.micro, {
          scaleX: 1,
          scaleY: 1,
          duration,
        });
      (element as any).__laymurPulseTween = timeline;

      if (gap > 0) {
        timeline.to({}, { duration: gap });
      }

      if (options.totalDuration !== undefined) {
        setTimeout(() => {
          Animator.stopPulse(element);
        }, options.totalDuration * 1000);
      }
    }
  }

  public static stopPulse(
    targets: AnimatedElement | AnimatedElement[],
    options: { duration?: number } = {},
  ): void {
    const elements = Array.isArray(targets) ? targets : [targets];

    for (const element of elements) {
      const tween = (element as any).__laymurPulseTween;
      if (tween) {
        tween.kill();
        delete (element as any).__laymurPulseTween;

        gsap.to(element.micro, {
          scaleX: 1,
          scaleY: 1,
          duration: options.duration ?? 0.25,
          ease: "power1.out",
        });
      }
    }
  }

  public static shake(
    targets: AnimatedElement | AnimatedElement[],
    options: {
      radius?: number;
      duration?: number;
      frequency?: number;
      totalDuration?: number;
    } = {},
  ): void {
    const {
      radius = 5,
      duration = 0.6,
      frequency = 10,
      totalDuration,
    } = options;

    const elements = Array.isArray(targets) ? targets : [targets];

    for (const element of elements) {
      const interval = 1000 / frequency;
      const key = "__laymurShakeInterval";

      if ((element as any)[key]) {
        return;
      }

      const shakeFunction = (): void => {
        const angle = Math.random() * Math.PI * 2;
        const currentRadius = Math.random() * radius;
        element.micro.x += Math.cos(angle) * currentRadius;
        element.micro.y += Math.sin(angle) * currentRadius;

        gsap.to(element.micro, {
          x: 0,
          y: 0,
          duration: duration / 2,
          ease: "power2.out",
        });
      };

      const id = setInterval(shakeFunction, interval);
      (element as any)[key] = id;

      if (totalDuration !== undefined) {
        setTimeout(() => Animator.stopShake(element), totalDuration * 1000);
      }
    }
  }

  public static stopShake(
    targets: AnimatedElement | AnimatedElement[],
    options: { duration?: number } = {},
  ): void {
    const elements = Array.isArray(targets) ? targets : [targets];

    for (const element of elements) {
      const key = "__laymurShakeInterval";
      const id = (element as any)[key];
      if (id) {
        clearInterval(id);
        delete (element as any)[key];
        gsap.to(element.micro, {
          x: 0,
          y: 0,
          duration: options.duration ?? 0.25,
          ease: "power1.out",
        });
      }
    }
  }

  public static callToClick(
    targets: AnimatedElement | AnimatedElement[],
    options: {
      jumpHeight?: number;
      duration?: number;
      easeUp?: string;
      easeDown?: string;
      gap?: number;
      totalDuration?: number;
    } = {},
  ): void {
    const {
      jumpHeight = 25,
      duration = 0.35,
      easeUp = "power2.out",
      easeDown = "bounce.out",
      gap = 0.5,
      totalDuration,
    } = options;

    const elements = Array.isArray(targets) ? targets : [targets];

    for (const element of elements) {
      const timeline = gsap.timeline({ repeat: -1 });

      timeline
        .to(element.micro, {
          y: -jumpHeight,
          duration,
          ease: easeUp,
        })
        .to(element.micro, {
          y: 0,
          duration,
          ease: easeDown,
        });

      if (gap > 0) {
        timeline.to({}, { duration: gap });
      }

      (element as any).__laymurCallTween = timeline;

      if (totalDuration !== undefined) {
        setTimeout(() => {
          Animator.stopCallToClick(element);
        }, totalDuration * 1000);
      }
    }
  }

  public static stopCallToClick(
    targets: AnimatedElement | AnimatedElement[],
    options: { duration?: number } = {},
  ): void {
    const elements = Array.isArray(targets) ? targets : [targets];

    for (const element of elements) {
      const tween = (element as any).__laymurCallTween;
      if (tween) {
        tween.kill();
        delete (element as any).__laymurCallTween;

        gsap.to(element.micro, {
          y: 0,
          duration: options.duration ?? 0.25,
          ease: "power1.out",
        });
      }
    }
  }

  public static callToClickSpin(
    targets: AnimatedElement | AnimatedElement[],
    options: {
      degrees?: number;
      duration?: number;
      ease?: string;
      gap?: number;
      totalDuration?: number;
      iterations?: number;
      anchorX?: number;
      anchorY?: number;
    } = {},
  ): void {
    const {
      degrees = 2.5,
      duration = 1.5,
      ease = "power1.inOut",
      gap = 4,
      totalDuration,
      iterations = 4,
    } = options;

    const elements = Array.isArray(targets) ? targets : [targets];
    const realDuration = duration / (2 + iterations);

    for (const element of elements) {
      if (options.anchorX) {
        element.micro.anchorX = options.anchorX;
      }
      if (options.anchorY) {
        element.micro.anchorY = options.anchorY;
      }

      const timeline = gsap.timeline({ repeat: -1 });

      timeline.to(element.micro, {
        angle: degrees,
        duration: realDuration,
        ease,
      });

      let currentDegree = degrees;
      for (let i = 0; i < iterations; i++) {
        timeline.to(element.micro, {
          angle: -currentDegree,
          duration: realDuration,
          ease,
        });
        currentDegree = -currentDegree;
      }

      timeline.to(element.micro, {
        angle: 0,
        duration: realDuration,
        ease,
      });

      if (gap > 0) {
        timeline.to({}, { duration: gap });
      }

      (element as any).__laymurSpinTween = timeline;

      if (totalDuration !== undefined) {
        setTimeout(() => {
          Animator.stopCallToClickSpin(element);
        }, totalDuration * 1000);
      }
    }
  }

  public static stopCallToClickSpin(
    targets: AnimatedElement | AnimatedElement[],
    options: { duration?: number } = {},
  ): void {
    const elements = Array.isArray(targets) ? targets : [targets];

    for (const element of elements) {
      const tween = (element as any).__laymurSpinTween;
      if (tween) {
        tween.kill();
        delete (element as any).__laymurSpinTween;

        gsap.to(element.micro, {
          angle: 0,
          duration: options.duration ?? 0.25,
          ease: "power1.out",
        });
      }
    }
  }
}
