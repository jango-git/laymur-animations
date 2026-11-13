# Changelog

Every notable change to laymur-animations. Versions follow semver; while the major is 0, a minor
release may break the API. The minor version matches the laymur minor the release is made for.
Breaking changes are marked.

## 0.27.0 - 2026-11-13

### Changed

- **Breaking:** requires laymur 0.27 (`>=0.27.0 <0.28.0`).

### Added

- `UIClickAnimator.press` and `UIClickAnimator.release`. A pressed element stays pressed in until
  it is released, and a press released before it is fully in finishes first, so a quick tap still
  shows the whole click. `release` returns a promise that resolves once the element is at rest.
- `UIClickAnimator.bind`, which drives the press by the element's own pointer: pressed while a
  pointer holds it, released on the click or cancel that ends every press. It handles several
  pointers, ignores presses that an `INTERACTIVE_TRANSPARENT` element passes through, and
  returns a function that unbinds the element and releases it if held.
- Press, release and click share their rest values, so a `click` during a press, or a press during
  a click, does not shift the element.
- Types `UIClickAnimatorPressOptions`, `UIClickAnimatorReleaseOptions`,
  `UIClickAnimatorBindOptions` and `UIClickAnimatorBindElement`.

## 0.26.0 - 2026-11-07

### Changed

- **Breaking:** requires laymur 0.26. The package is compiled with `tsc` instead of being bundled
  with rollup; `dist` mirrors the source modules and `./package.json` is exported.
- **Breaking:** `iterations` counts runs, so 1 plays a call once.
- Animators keep the values an element rests at, and a call replaces the one of the same kind
  running on that element instead of stacking on it.
- `UIClickAnimator` keeps the hit area in place while the element is pressed (`keepHitArea`).

### Added

- `UIShakeAnimator`, `UIFlyToAnimator`, `UIFlashAnimator`, `UITapCallAnimator`,
  `UIFloatCallAnimator` and `UIShineCallAnimator`.
