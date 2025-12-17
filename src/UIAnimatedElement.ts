import type { UIColor, UIMicro } from "laymur";

/**
 * Interface for UI elements that can be animated.
 */
export interface UIAnimatedElement {
  /** Micro transformation object */
  micro: UIMicro;
  /** Element alpha value */
  color: UIColor;
}
