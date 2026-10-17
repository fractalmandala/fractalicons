# fractalicons

Icon packages for Svelte 5, in one repo.
https://github.com/fractalmandala/fractalicons

https://www.npmjs.com/package/@fractaldesign/icons
https://www.npmjs.com/package/@fractaldesign/icons-animated

| Package | What it is |
|---|---|
| [`@fractaldesign/icons`](packages/icons) | Static icons: 34 families, over 35,000 icons, tree-shakeable, short-prefix imports |
| `@fractaldesign/icons-animated` | The same idea with built-in animations, on the Web Animations API |

Each package has its own README, version and changelog. 
Releases are tagged `<package>@<version>`, for example `icons@0.1.0`.

## Which animations work on which family

[`ANIMATED-MAP.md`](ANIMATED-MAP.md) maps every icon family to the animations that work on it and the plan for animating all of them.

## Working in the repo

```sh
pnpm install
pnpm sources      # fetch the upstream SVGs, pinned in sources.json
pnpm build
pnpm test
```

The upstream SVGs are not committed. `sources.json` pins the exact upstream version of every family, and `pnpm sources` fetches them into `.sources/` and prepares each package's inputs. The generated icon modules are not committed either; each package builds them.

Every icon family keeps its own licence: see the `NOTICE.md` in each package.


## Commands

- Dev: TODO
- Desktop: TODO
- Build: TODO
