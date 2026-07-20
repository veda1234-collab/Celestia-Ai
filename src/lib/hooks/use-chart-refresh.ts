'use client';

import { useEffect, useRef, useState } from 'react';
import { useProfile } from '@/lib/store/profile';

/**
 * Recomputes the chart when the store holds birth details but no chart — which
 * happens after a store-version migration drops a chart written by an older
 * build. Returns true while that recompute is in flight so callers can show a
 * loader instead of bouncing the user back through onboarding.
 */
export function useChartRefresh(enabled: boolean): boolean {
  const details = useProfile((s) => s.details);
  const chart = useProfile((s) => s.chart);
  const setProfile = useProfile((s) => s.setProfile);
  const [failed, setFailed] = useState(false);
  // One attempt per mount — a failing API must not spin in a retry loop.
  const attempted = useRef(false);

  useEffect(() => {
    if (!enabled || chart || !details || attempted.current) return;
    attempted.current = true;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/chart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(details),
        });
        const data = res.ok ? ((await res.json()) as { chart?: unknown }) : null;
        if (cancelled) return;
        if (data?.chart) setProfile(details, data.chart as never);
        else setFailed(true);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, chart, details, setProfile]);

  // Derived synchronously so a caller's redirect guard in the same render pass
  // sees "pending" immediately, rather than one commit after the effect runs.
  return enabled && !chart && !!details && !failed;
}
