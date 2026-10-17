# Changelog

## 0.1.0

First release as `@fractaldesign/icons-animated`, the successor to `svelte-animated-icon` 1.0.4. Every set is rebuilt from a pinned upstream release (`sources.json` at the repo root), and the generator is part of the repo and tested.

- **Fixed:** the generator removed the first `-light` or `-line` anywhere in a file name, so `cloud-lightning-light` became an icon called `Cloudning`, and `Line`, `LineHeight`, `Overline`, `Underline`, `Sun`, `TableAlt`, `TimelineView` and a few more Remix icons were lost or half-built. It now removes the variant only at the end. Result: 6 Remix icons that were missing are in, and 8 that had one variant now have both.
- **Fixed:** Phosphor `book-open-user` and `cloud-lightning` have all their variants (1.0.4 had `BookUser` with one and `BookOpenUser` with the others, and `Cloudning`).
- **Removed:** 10 icons in the Remix set that were never Remix icons (`IconMoon1`, `IconSun2`, `IconToggleSidebar`, `IconSettings` and similar). They came from a stray project folder.
- **Added:** a `label` prop. An icon with a label is `role="img"` with that name; without one it is `aria-hidden`. (1.0.4 always said `role="img"` and gave no name.)
- **Added:** icons stay still when the system asks for reduced motion.
- **Changed:** Heroicons is v2.2.0, so `gift` is the newer drawing.
- **Not shipped any more:** the site's Sass styles and its Bezier editor, which 1.0.4 included in `dist` by accident.
- The Remix set is licensed Apache 2.0, not MIT as the old README said. See `NOTICE.md`.
