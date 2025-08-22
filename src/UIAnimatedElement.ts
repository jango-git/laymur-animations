import type { UIColor, UIMicro } from "laymur";

/**
 * Interface for UI elements that can be animated.
 */
export interface UIAnimatedElement {
  /** Element alpha value */
  color: UIColor;
  /** Micro transformation object */
  micro: UIMicro;
}
