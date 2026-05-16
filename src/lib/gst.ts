export interface GstBreakdown {
  literal: number;
  inferential: number;
  critical: number;
  total: number;
  componentTotal?: number;
}

const sanitizeScore = (value: number | undefined | null) => Math.max(0, Math.floor(Number(value ?? 0)));

export function normalizeGstBreakdown(
  breakdown?: Partial<GstBreakdown> | null,
  fallbackTotal = 0
): GstBreakdown | undefined {
  if (!breakdown) {
    return undefined;
  }

  // Keep the component sum when teachers entered one, but preserve the raw total for display and history.
  const literal = sanitizeScore(breakdown.literal);
  const inferential = sanitizeScore(breakdown.inferential);
  const critical = sanitizeScore(breakdown.critical);
  const providedTotal = sanitizeScore(breakdown.total);
  const explicitSum = literal + inferential + critical;
  const rawTotal = sanitizeScore(fallbackTotal || providedTotal);

  if (explicitSum > 0) {
    return {
      literal,
      inferential,
      critical,
      total: rawTotal,
      componentTotal: explicitSum,
    };
  }

  return undefined;
}

export function hasGstBreakdownComponents(breakdown?: Partial<GstBreakdown> | null) {
  if (!breakdown) {
    return false;
  }

  // The roster uses this to decide whether the GST detail fields should be shown.
  const literal = sanitizeScore(breakdown.literal);
  const inferential = sanitizeScore(breakdown.inferential);
  const critical = sanitizeScore(breakdown.critical);

  return literal + inferential + critical > 0;
}

export function formatGstBreakdown(breakdown: GstBreakdown) {
  const base = `Literal ${breakdown.literal}, Inferential ${breakdown.inferential}, Critical ${breakdown.critical}`;

  if (breakdown.componentTotal !== undefined && breakdown.componentTotal !== breakdown.total) {
    return `${base} (component sum ${breakdown.componentTotal}/20; raw total ${breakdown.total}/20)`;
  }

  return base;
}
