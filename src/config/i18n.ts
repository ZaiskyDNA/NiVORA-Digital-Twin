/**
 * Glosarium UI (§13.7): label Indonesia, istilah teknis Inggris.
 * Semua string yang tampil di UI diambil dari sini agar konsisten.
 */
import type { EdgeAIReason } from '../sim/edgeAI';
import type { PathwayStage } from '../sim/pathway';
import type { MweriClass, Status } from '../sim/types';

export const STATUS_LABEL: Record<Status, string> = {
  normal: 'Normal',
  warning: 'Warning',
  critical: 'Critical',
};

export const MWERI_CLASS_LABEL: Record<MweriClass, string> = {
  rendah: 'Rendah',
  sedang: 'Sedang',
  tinggi: 'Tinggi',
  kritis: 'Kritis',
};

export const EDGE_AI_REASON_LABEL: Record<EdgeAIReason, string> = {
  volume: 'volume',
  pm: 'partikulat',
  mweri: 'MWERI',
  trend: 'tren naik',
};

export const PATHWAY_LABEL: Record<PathwayStage, string> = {
  reuse: 'Reuse / Reprocessing',
  recycle: 'Repurpose / Recycle',
  recovery: 'Recovery',
  treatment: 'Treatment',
  disposal: 'Safe Disposal',
};

/** Alasan keputusan pathway saat tahap tersebut terpilih. */
export const PATHWAY_REASON: Record<PathwayStage, string> = {
  reuse: 'Karakteristik material masih memenuhi kebutuhan proses.',
  recycle: 'Tidak cocok untuk proses utama, tetapi bisa dimanfaatkan sebagai bahan sekunder.',
  recovery: 'Masih mengandung komponen bernilai yang dapat dipulihkan.',
  treatment: 'Perlu pengelolaan khusus sebelum aman ditangani lebih lanjut.',
  disposal: 'Tidak ada jalur sirkular yang layak — pilihan terakhir, ditimbun secara aman.',
};

export const FACILITY_LABEL: Record<string, string> = {
  stockpile: 'Stockpile',
  crusher: 'Crusher',
  smelter: 'Smelter / Proses Utama',
  reprocessing: 'Unit Reprocessing',
  recovery: 'Unit Recovery',
  treatment: 'Treatment',
  disposal: 'Safe Disposal',
};

/** Keterangan singkat di bawah label fasilitas pada scene. */
export const FACILITY_CAPTION: Record<string, string> = {
  stockpile: 'bijih nikel',
  crusher: 'sumber partikulat',
  smelter: 'SCADA/DCS link',
  reprocessing: 'tujuan residu layak proses',
  recovery: 'pemulihan komponen bernilai',
  treatment: 'pengelolaan khusus',
  disposal: 'pilihan terakhir',
};

export const ZONE_LABEL = {
  high: 'Zona aktivitas pekerja tinggi',
  workersDetected: (n: number) => `${n} pekerja terdeteksi (berbasis zona)`,
} as const;

export const ROUTE_LABEL = {
  safe: (id: string | null, cost: string) => `${id ? `Rute ${id} · ` : ''}Safe Route · C=${cost} ✓`,
  chosenInZone: (id: string | null, cost: string) => `${id ? `Rute ${id} · ` : ''}terpilih, melewati zona pekerja · C=${cost} ⚠`,
  shortest: (id: string | null, cost: string) => `${id ? `Rute ${id} · ` : ''}terpendek · C=${cost} ✕`,
} as const;

export const CAMERA_PRESET_LABEL = {
  overview: 'Overview',
  nodeA: 'Fokus Node A',
  route: 'Rute',
} as const;

/** Teks panel & kartu (Fase 5). */
export const UI = {
  app: {
    title: 'NiVORA',
    titleAccent: 'Digital Twin',
    subtitle: 'Predictive Circular Material Management · Sirkuit Conveyor 1 · Smelter Nikel',
  },
  pillars: ['Predict', 'Protect', 'Circulate'] as const,
  live: { running: 'LIVE SIM', paused: 'JEDA', play: 'Jalankan simulasi', pause: 'Jeda simulasi', speed: 'Kecepatan simulasi' },
  mweri: {
    title: 'Prioritas penanganan · MWERI',
    chartTitle: (id: string) => `Prediksi Digital Twin · Node ${id}`,
    threshold: 'ambang kritis 8.0',
    chartNote: 'Garis putus = proyeksi · nilai ilustratif',
  },
  routing: {
    title: 'Graph-based safe routing',
    caption: 'Rute kandidat Node A → Unit Reprocessing',
    route: 'Rute',
    cost: 'Cost',
    shortest: 'terpendek',
    safe: 'safe',
    chosenInZone: 'terpilih ⚠ zona pekerja',
    alternative: 'alternatif',
    blocked: 'terblokir',
    scaled: 'Skor dinormalisasi ke skala 0–10.',
    noCandidates: 'Rute kandidat Lampiran 7 hanya untuk Node A → Unit Reprocessing.',
    recommendationTitle: 'Rekomendasi operasional',
    reactiveTitle: 'Tindakan baseline reaktif',
  },
  impact: {
    title: 'Dampak 3P (sesi ini)',
    people: 'People',
    planet: 'Planet',
    productivity: 'Productivity',
    exposure: 'paparan vs reaktif',
    recovery: 'recovery rate',
    unnecessary: 'trip tak perlu vs reaktif',
    waiting: 'menunggu data',
  },
  card: {
    mweri: 'MWERI',
    residue: 'Residu',
    pm: 'PM',
    workers: 'Pekerja',
    sensor: 'Status sensor',
    priority: 'Prioritas MWERI',
    stable: 'Tren stabil — belum ada proyeksi kritis',
    criticalNow: 'Digital Twin: sudah melewati ambang kritis',
    criticalIn: (min: number) => `Digital Twin: kritis dalam ±${min} menit`,
    noWorkers: 'Residu tinggi, tetapi tidak ada pekerja di zona',
    open: (id: string) => `Fokus ke Node ${id} dan buka detail`,
    close: 'Tutup detail',
    composition: 'Komposisi MWERI',
    term: { H: 'Bahaya material', P: 'Partikulat', W: 'Pekerja di zona', T: 'Durasi paparan' },
    zeroWorkers: 'W = 0 → kontribusi pekerja nol, sehingga MWERI rendah walau residu tinggi.',
    exposure: (min: number, window: number) => `Paparan ${min} dari ${window} menit terakhir`,
    slope: (v: number) => `Tren residu ${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(2)} %/menit`,
    pathway: (stage: string, dest: string) => (stage === dest ? `Jalur: ${stage}` : `Jalur: ${stage} → ${dest}`),
  },
  insight: {
    title: 'Volume ≠ risiko',
    body: (id: string, residue: number, mweri: string, rank: number, top: string) =>
      `Node ${id} punya residu tertinggi (${residue}%), tetapi MWERI-nya hanya ${mweri} (prioritas #${rank}) karena tidak ada pekerja di zonanya. Sistem berbasis volume akan mendahulukan Node ${id}; NiVORA mendahulukan Node ${top}, tempat pekerja terpapar.`,
    action: (id: string) => `Lihat komposisi MWERI Node ${id}`,
  },
  whatIf: {
    run: 'Simulasikan 30 menit',
    title: (from: string, to: string) => `Simulasi ${from} → ${to}`,
    note: 'Fork engine — kondisi saat ini tidak berubah.',
    critical: 'akan critical',
    dispatches: (n: number) => `${n} truk dikirim`,
    reroutes: (n: number) => `${n} re-route`,
    after: 'Rekomendasi di akhir simulasi',
    close: 'Tutup hasil simulasi',
    legend: 'Garis titik-titik = hasil simulasi',
  },
  weights: {
    open: 'Atur bobot',
    title: 'Bobot MWERI & rute',
    mweri: 'Bobot MWERI',
    route: 'Bobot biaya rute',
    labels: {
      wH: 'H · bahaya material',
      wP: 'P · partikulat',
      wW: 'W · pekerja di zona',
      wT: 'T · durasi paparan',
      alpha: 'α · jarak (D)',
      beta: 'β · risiko pekerja (R)',
      gamma: 'γ · gangguan operasi (O)',
    },
    sum: 'Σ',
    reset: 'Kembalikan bobot esai',
    preview: 'Pratinjau langsung',
    ranking: 'Ranking',
    route_: 'Rute terpilih',
    close: 'Tutup pengaturan bobot',
    hint: 'Geser satu bobot — bobot lain menyesuaikan proporsional agar Σ = 1.',
  },
  compare: {
    label: 'Tampilan',
    nivora: 'NiVORA',
    reactive: 'Reaktif',
    banner: 'Baseline reaktif: ditangani saat residu ≥ 90% atau terjadwal tiap 120 menit · rute terpendek',
    vs: 'vs',
  },
  pathway: { title: 'Circular material decision pathway', reason: 'Alasan', notFeasible: 'tidak layak' },
  scenario: { title: 'Skenario' },
  legend: { title: 'Legenda', worker: 'Pekerja', camera: 'Kamera' },
  panel: { collapse: 'Lipat panel', expand: 'Buka panel' },
} as const;

/** Level PM dari skor 0–10 — selaras ambang Edge-AI (5 warning, 8 critical). */
export const PM_LEVEL_LABEL = { low: 'Rendah', medium: 'Sedang', high: 'Tinggi' } as const;

export const DISCLAIMER = {
  mweri:
    'MWERI adalah indeks prioritas, bukan instrumen diagnosis medis. Bobot perlu dikalibrasi data lapangan & ahli K3.',
  illustrative: 'Visualisasi konsep · seluruh nilai bersifat ilustratif',
} as const;
