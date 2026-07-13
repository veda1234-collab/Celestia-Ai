'use client';

import { CosmicBackground } from './cosmic-background';

/**
 * Cinematic backdrop. Renders the animated 2D cosmos (gradient, aurora,
 * starfield, meteors). The Three.js galaxy scene has been removed.
 */
export function CinematicBackground(_props: { overlay?: boolean } = {}) {
  return <CosmicBackground />;
}
