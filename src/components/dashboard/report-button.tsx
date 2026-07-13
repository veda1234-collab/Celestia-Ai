'use client';

import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import type { BirthChart } from '@/lib/astrology/types';
import { Button } from '@/components/ui/button';

export function ReportButton({ chart }: { chart: BirthChart }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const download = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chart }),
      });
      if (!res.ok) throw new Error('report failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `celestia-${(chart.meta.name || 'report').replace(/\s+/g, '-').toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="glass" size="sm" onClick={download} disabled={loading} title="Download a PDF report">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
      {error ? 'Try again' : 'Report PDF'}
    </Button>
  );
}
