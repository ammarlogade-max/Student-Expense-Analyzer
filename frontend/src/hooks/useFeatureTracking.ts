import { useEffect } from "react";
import { trackFeatureUsage } from "../lib/api";

export function useFeatureTracking(
  feature: string,
  description: string,
  metadata?: Record<string, string>
) {
  useEffect(() => {
    trackFeatureUsage(feature, description, metadata).catch(() => undefined);
  }, [description, feature, metadata]);
}
