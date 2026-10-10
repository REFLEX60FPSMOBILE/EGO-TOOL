import { useState, useCallback } from "@webpack/common";
import { buildUserLookupResult, getThreatLevel, getThreatColor } from "./userLookupService";
import type { UserLookupResult } from "../../types/osint";

export function useUserLookup() {
  const [result, setResult] = useState<UserLookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      // Placeholder: integrate Discord API / public data sources here.
      const base = buildUserLookupResult(userId);
      const threatLevel = getThreatLevel(base.threatScore);
      setResult({ ...base, threatLevel });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, lookup, getThreatColor };
}
