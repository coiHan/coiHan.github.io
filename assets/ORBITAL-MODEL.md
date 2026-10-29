# Desktop orbital model

Source: [JPL approximate planetary positions](https://ssd.jpl.nasa.gov/planets/approx_pos.html), J2000 table. The initial phases serve composition; the page does not claim to show the current sky.

For each planet the shared active elapsed time gives M=M0+2πt/T, where T/Tearth=(aAU/aEarth)^1.5 and Tearth=180s. Newton iteration solves E−e sin(E)=M. Orbital coordinates are x=aDisplay(cos(E)−e), y=aDisplay sqrt(1−e²) sin(E). The screen uses (cx+x, cy−0.60y), giving counterclockwise motion and a common projected orbital plane. The Sun is the projected focus, centered in the scene.

The display radii are compressed for legibility. This retains ellipse geometry, equal swept areas within each displayed orbit and real relative periods, but is not one uniformly scaled gravitational system. Orbits satisfy aOuter(1−eOuter)>aInner(1+eInner). Illustration silhouettes may overlap in projection, so depth order follows front/back position. The four fixed footer links remain usable. Hover/focus pauses the whole simulation, as does the manual pause control; there is no independent collision stop. Resizing changes only display scale, preserving elapsed time and phase. Mobile widths under1100px keep the previous single-planet selection experience.

Checks: Kepler residual below1e−10, equal position after one period, ordered noncrossing orbits, centered Sun, pause/resize phase continuity, native navigation and hash placeholders. Implementation: `orbital-model.js` and `solar.js`.

## Illustration separation

The small orbital point follows the Kepler solution exactly. When illustration rectangles project close together, their display callouts separate with a thin leader to the orbital point. Separation affects presentation only; it does not alter orbital elements, elapsed time or individual periods. Desktop positions use composited translate3d updates at the browser frame rate rather than repeated left/top layout changes.
