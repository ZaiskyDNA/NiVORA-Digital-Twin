/** Ambang Edge-AI & Digital Twin (§5.2, §5.3). Jangan diubah tanpa memperbarui CLAUDE.md (§13.2). */
export const EDGE_AI_THRESHOLDS = {
  criticalLevel: 85, // residueLevel ≥ 85 %
  criticalPm: 8, // skor PM ≥ 8
  criticalMweri: 8, // MWERI ≥ 8
  warningLevel: 60, // residueLevel ≥ 60 %
  warningPm: 5, // skor PM ≥ 5
  /** Kemiringan tren level (% per menit) yang dianggap naik tajam. Ilustratif. */
  warningLevelSlope: 0.5,
} as const;

export const DIGITAL_TWIN = {
  /** Jumlah sampel history terakhir untuk regresi (§5.3). */
  regressionWindow: 20,
  mweriCritical: EDGE_AI_THRESHOLDS.criticalMweri,
  levelCritical: EDGE_AI_THRESHOLDS.criticalLevel,
} as const;
