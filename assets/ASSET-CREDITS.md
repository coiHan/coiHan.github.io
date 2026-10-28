# Solar system asset credits

## Current illustrated scene

The active homepage uses code-generated pastel maps, toon shading, geometric rings and a radial glow. These illustrated materials are created inside `solar.js`; it does not request the historical photographic maps below.

## Historical planetary textures

**Solar System Scope / INOVE** provides the original planetary texture maps at [Solar Textures](https://www.solarsystemscope.com/textures/), distributed under [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/).

The provider describes these maps as based on NASA elevation and imagery data, with colors adjusted against spacecraft and telescope images. The pack includes enhanced saturation and filled gaps where planetary surfaces remain unmapped. They are curated visualization maps, rather than unmodified spacecraft photographs. Venus uses the provider's **atmosphere** map.

The maps were downloaded from the provider's linked 2K files on 2026-10-28. Color maps and cloud data were mechanically converted to WebP at quality 88, retaining their 2048 × 1024 equirectangular layout and colors. The Earth normal map was converted from TIFF to WebP at quality 92. The Saturn ring PNG was copied without alteration, retaining its original 2048 × 125 layout and alpha channel. This conversion description applies only to the historical map files. The active illustrated scene now uses separate procedural materials.

| Local asset | Original source |
| --- | --- |
| `textures/sun.webp` | [2k_sun.jpg](https://www.solarsystemscope.com/textures/download/2k_sun.jpg) |
| `textures/mercury.webp` | [2k_mercury.jpg](https://www.solarsystemscope.com/textures/download/2k_mercury.jpg) |
| `textures/venus.webp` | [2k_venus_atmosphere.jpg](https://www.solarsystemscope.com/textures/download/2k_venus_atmosphere.jpg) |
| `textures/earth.webp` | [2k_earth_daymap.jpg](https://www.solarsystemscope.com/textures/download/2k_earth_daymap.jpg) |
| `textures/earth-clouds.webp` | [2k_earth_clouds.jpg](https://www.solarsystemscope.com/textures/download/2k_earth_clouds.jpg) |
| `textures/earth-normal.webp` | [2k_earth_normal_map.tif](https://www.solarsystemscope.com/textures/download/2k_earth_normal_map.tif) |
| `textures/mars.webp` | [2k_mars.jpg](https://www.solarsystemscope.com/textures/download/2k_mars.jpg) |
| `textures/jupiter.webp` | [2k_jupiter.jpg](https://www.solarsystemscope.com/textures/download/2k_jupiter.jpg) |
| `textures/saturn.webp` | [2k_saturn.jpg](https://www.solarsystemscope.com/textures/download/2k_saturn.jpg) |
| `textures/saturn-ring.png` | [2k_saturn_ring_alpha.png](https://www.solarsystemscope.com/textures/download/2k_saturn_ring_alpha.png) |
| `textures/uranus.webp` | [2k_uranus.jpg](https://www.solarsystemscope.com/textures/download/2k_uranus.jpg) |
| `textures/neptune.webp` | [2k_neptune.jpg](https://www.solarsystemscope.com/textures/download/2k_neptune.jpg) |

Suggested visible credit: **Planet textures: Solar System Scope / INOVE · CC BY 4.0 · converted to WebP.** Link “Solar System Scope / INOVE” to the texture source page and “CC BY 4.0” to the license above.

### Data-map handling

`earth-clouds.webp` is grayscale RGB cloud-opacity data, not an image with an alpha channel; its dark areas can be used as transparent regions through a material's alpha map. `earth-normal.webp` is a data texture and should not use an sRGB color space. `saturn-ring.png` is a horizontal radial texture strip with real transparency, so a ring mesh should map its radius along the texture's horizontal coordinate.

## Three.js

**Three.js 0.186.1**, by the Three.js authors, is redistributed under the **MIT License**. Its complete upstream license is retained in [`vendor/three.LICENSE.txt`](vendor/three.LICENSE.txt).

- Official project: [threejs.org](https://threejs.org/) and [mrdoob/three.js](https://github.com/mrdoob/three.js).
- Version metadata: [npm registry, three 0.186.1](https://registry.npmjs.org/three/0.186.1).
- Original package: [three-0.186.1.tgz](https://registry.npmjs.org/three/-/three-0.186.1.tgz).
- Only `build/three.module.js`, `build/three.core.js`, and `LICENSE` were extracted. No package installation or package script was run.
- `three.module.js` imports `./three.core.js`; both upstream module files are retained unchanged. This version's official npm package does not distribute corresponding `.min.js` files.
- The package's SHA-512 integrity was checked against the registry metadata before extraction.

Suggested visible credit: **Three.js · MIT** with links to the official project and the retained license.
