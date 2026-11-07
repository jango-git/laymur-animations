import type { UIColor, UIMicro, UIMode } from "laymur";

/**
 * Interface for UI elements whose micro transform can be animated, such as UISpine.
 */
export interface UIMicroAnimatedElement {
  /** Micro transformation object */
  micro: UIMicro;
}

/**
 * Interface for UI elements that can be animated.
 */
export interface UIAnimatedElement extends UIMicroAnimatedElement {
  /** Element alpha value */
  color: UIColor;
  /** Visibility and interactivity, hidden and restored by the disappear and appear animators */
  mode?: UIMode;
}
