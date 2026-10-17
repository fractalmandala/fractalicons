# Changelog

## 0.1.0

First release as `@fractaldesign/icons`, the successor to `fractalicons` 0.4.0. Every family is now rebuilt from a pinned upstream release (`sources.json` at the repo root); 23 of the first 29 families generate output identical to 0.4.0.

- **Added families:** `flowbite` (411) and `flowbitesolid` (340) from Flowbite Icons 1.5.0, `ionicons` (421) and `ioniconsfill` (515) from Ionicons 8.0.13, and `phosphorlight` (1,512) from the pinned Phosphor Icons core. Prefixes `fb`, `fbs`, `io`, `iof`, `phl`. Every set in `@fractaldesign/icons-animated` now has its static families here.
- **Changed:** Heroicons is 2.2.0 (324 icons; 0.4.0 had 296, and `gift` was redrawn), the release `icons-animated` uses.
- **Removed:** 22 files in the `remix` family that were never Remix icons (`reIconMoon1`, `reIconToggleSidebar`, `reFolderClosed`, `reTwitter`, and similar). They came from a stray project folder.
- **Added:** 15 real Remix line icons and 7 Remix fill icons that 0.4.0 lacked; one Lucide icon (`phi`).
- **Added:** `materialanim` now has all 1,222 Material Line Icons (line, twotone and filled); 0.4.0 had the 545 line icons. The family is Material Line Icons by Vjacheslav Trushkin (MIT), not Google's Material Design Icons.
- **Renamed upstream:** Phosphor `book-user` is now `book-open-user`.
- **Dropped upstream:** Simple Icons `keycloak` and `syncthing` are not in the pinned release.
- **Touched up upstream:** two Lucide icons (`carrot`, `ungroup`).
- Licence notices for every family are in `NOTICE.md`.

## 0.4.0 (2026-09-28)

- Added Keyline Icons families: `keylinestroke` (`kl`), `keylinefill` (`klf`), `keylineduo` (`kld`), `keylinesharp` (`kls`) — 1,000 icons each

## 0.3.1 (2026-09-10)

- Added `repository`, `homepage`, and `bugs` fields to package.json
- Replaced badge-markdown `description` with a plain-text summary
- Fixed `sideEffects` to `false` (no CSS is shipped)
- Added `engines: { "node": ">=18" }` field
- Added test suite for the generate pipeline (`node --test`)
- Duplicate export detection now errors and exits non-zero

## 0.3.0 (2026-09-08)

- **Breaking**: Single-module-per-family architecture (99.9% file reduction — from ~55,000 files to 59)
- Added fill variants: `phosphorfill`, `tablerfill`, `iconoirfill`, `remixfill`, `heroiconsfill`, `boxsolid`
- Added `--prune` step to clean dist of stray files (`.DS_Store`, `.zip`)

## 0.2.0 (2026-09-08)

- Expanded to 25 icon families

## 0.1.0 (2026-09-05)

- Added `coreui` and `famicons` families

## 0.0.3 (2026-08-28)

- Cleanup pass

## 0.0.2 (2026-08-16)

- Initial release — 11 families
