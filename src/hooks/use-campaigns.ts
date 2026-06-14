"use client";

import * as React from "react";
import type { CampaignDTO } from "@/lib/types";

interface State {
  campaigns: CampaignDTO[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Lightweight client-side hook. No swr dependency.
 */
export function useCampaigns(): State {
  const [campaigns, setCampaigns] = React.useState<CampaignDTO[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/campaigns");
      if (!r.ok) throw new Error(`Fetch failed: ${r.status}`);
      const data = await r.json();
      setCampaigns(data.campaigns ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "unknown");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  return { campaigns, loading, error, refresh };
}
