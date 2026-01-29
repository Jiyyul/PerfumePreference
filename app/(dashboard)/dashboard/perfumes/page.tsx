'use client';

import { useEffect, useState } from 'react';
import { usePerfumes } from '@/hooks/use-perfumes';
import type { Database } from '@/types/database';

type Perfume = Database['public']['Tables']['user_perfumes']['Row'];

export default function PerfumesPage() {
  const api = usePerfumes();
  const [data, setData] = useState<Perfume[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await api.listPerfumes();
      if (!mounted) return;
      if (res?.error) {
        setError(res.error);
        return;
      }
      setData(res?.data ?? []);
    })();
    return () => {
      mounted = false;
    };
  }, [api]);

  return (
    <div className="px-6 py-8">
      <h1 className="mb-4 text-xl font-medium">My Perfumes</h1>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
