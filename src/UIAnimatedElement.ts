import type { UIMicro } from "laymur";

/**
 * Interface for UI elements that can be animated.
 */
export interface UIAnimatedElement {
  /** Element opacity value */
  opacity: number;
  /** Micro transformation object */
  micro: UIMicro;
}
