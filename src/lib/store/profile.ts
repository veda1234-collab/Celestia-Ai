'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BirthChart, BirthDetails } from '@/lib/astrology/types';

interface ProfileState {
  details: BirthDetails | null;
  chart: BirthChart | null;
  hydrated: boolean;
  setProfile: (details: BirthDetails, chart: BirthChart) => void;
  clear: () => void;
}

/**
 * Bump whenever `BirthChart` gains fields the UI reads unconditionally. A chart
 * stored by an older build lacks them, so it is discarded on rehydrate and
 * recomputed from the retained birth details rather than crashing a consumer.
 */
export const PROFILE_STORE_VERSION = 2;

/**
 * Persisted profile store — carries the birth details and computed chart across
 * the onboarding → loading → dashboard → chat journey and survives refreshes.
 */
export const useProfile = create<ProfileState>()(
  persist(
    (set) => ({
      details: null,
      chart: null,
      hydrated: false,
      setProfile: (details, chart) => set({ details, chart }),
      clear: () => set({ details: null, chart: null }),
    }),
    {
      name: 'celestia-profile',
      version: PROFILE_STORE_VERSION,
      // Keep the birth details (the expensive thing to re-enter); drop the stale
      // chart so `useChartRefresh` recomputes it against the current engine.
      migrate: (persisted) => {
        const state = (persisted ?? {}) as Partial<ProfileState>;
        return { ...state, chart: null } as ProfileState;
      },
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);
