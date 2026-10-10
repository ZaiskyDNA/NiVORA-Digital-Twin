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

/** Kebijakan penanganan (§5.6 langkah 5, §8 mode Reaktif). */
export const POLICY = {
  /** NiVORA: tangani node prioritas #1 bila ttc < N menit. */
  nivoraTtcDispatch: 20,
  /** NiVORA: truk hanya dikirim bila residu ≥ N % — mengangkut residu sedikit tidak menurunkan risiko. */
  nivoraMinLoadLevel: 30,
  /** Reaktif: tangani hanya bila residu ≥ N %. */
  reactiveLevel: 90,
  /** Reaktif: jadwal tetap — satu node (bergiliran) setiap N menit. */
  reactiveScheduleMin: 60,
} as const;

/** KPI & simulasi (§9, §13.4). */
export const SIM = {
  /** Panjang shift; KPI paparan per shift di-reset setiap N menit simulasi. */
  shiftMin: 480,
  /** Zona dianggap berdebu bila skor PM ≥ N (§9). */
  exposurePm: 5,
  /** Sampel history maksimum per node. */
  historyMax: 180,
  /** Event log maksimum. */
  eventsMax: 40,
} as const;
