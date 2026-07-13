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
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);
