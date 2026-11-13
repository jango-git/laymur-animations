# Laymur Animations

A collection of common UI animations for Laymur UI library. Includes popular animations like appear/disappear effects, pulsing, jumping, and spinning.

**Important:** This package does not include GSAP. GSAP is a peer dependency with its own commercial licensing terms - see [GSAP License](https://gsap.com/licensing/) for details. You must install GSAP separately.

## Installation

```bash
npm install laymur-animations gsap
```

## Animations

One-shot, returning a promise: UIAppearAnimator, UIDisappearAnimator, UIClickAnimator, UIShakeAnimator, UIFlyToAnimator, UIFlashAnimator

Calls, running until stopped: UIPulseCallAnimator, UIJumpCallAnimator, UISpinCallAnimator, UISwipeCallAnimator, UITapCallAnimator, UIFloatCallAnimator, UIShineCallAnimator

## Button press

`UIClickAnimator.bind` presses a button in while a finger holds it and releases it on the click or
cancel that ends the press:

```typescript
import { UIClickAnimator } from "laymur-animations";

const unbind = UIClickAnimator.bind(button);
button.signalPointerClicked.on(onBuy);

// Once the button is no longer needed
unbind();
```

`UIClickAnimator.press` and `UIClickAnimator.release` do the same when driven by hand.

## Documentation

See [Usage Example](https://jango-git.github.io/laymur/07_animations.html) for a concrete implementation demonstration.

See [Laymur Documentation](https://jango-git.github.io/laymur/) for complete usage examples and API reference.

## License

MIT
