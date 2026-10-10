# NiVORA — Briefing Proyek untuk Claude Code

> **Cara pakai:** simpan file ini sebagai `CLAUDE.md` (atau `BRIEFING.md`) di root folder proyek kosong, lalu jalankan Claude Code dan beri perintah:
> *"Baca BRIEFING.md lalu bangun proyek NiVORA sesuai fase-fase di dalamnya. Kerjakan fase per fase, jalankan `npm run dev` dan `npm test` setiap selesai satu fase."*
>
> Gambar `NiVORA_3D_DigitalTwin.png` adalah **referensi visual target** — taruh di `docs/reference.png`.

---

## 1. Ringkasan Proyek

**NiVORA** (Human-Centric Digital Twin untuk Pengelolaan Residu Nikel) adalah konsep dari esai IOSH Summit 2026 (subtema *Digitalisasi Lingkungan*). Prototype ini adalah **simulasi web 3D interaktif** yang memperlihatkan paradigma **Predict – Protect – Circulate**:

1. **Predict** — NiVORA Node (sensor partikulat, level/load residu, keberadaan pekerja) → Edge-AI mengklasifikasi status *Normal / Warning / Critical* → Digital Twin memprediksi kapan node menjadi kritis.
2. **Protect** — **MWERI** (Mining Waste Exposure Risk Index) memprioritaskan node berdasarkan risiko paparan pekerja, bukan sekadar volume residu.
3. **Circulate** — **Circular Material Decision Pathway** menentukan jalur residu (Reuse/Reprocessing → Repurpose/Recycle → Recovery → Treatment → Safe Disposal), lalu **graph-based safe routing** memilih rute pemindahan yang paling aman (bukan selalu terpendek).

**Tujuan prototype:** demo untuk presentasi/juri — pengguna melihat pabrik nikel 3D, residu menumpuk dan debu muncul secara real-time, node berubah warna, MWERI berubah, dan sistem merekomendasikan *kapan, seberapa prioritas, ke mana, lewat rute mana*.

**Bukan tujuan:** sistem produksi, integrasi sensor fisik, atau alat diagnosis medis. Semua angka **ilustratif** dan harus diberi label demikian di UI.

---

## 2. Tech Stack

| Bagian | Pilihan |
|---|---|
| Build | Vite + React 18 + TypeScript (strict) |
| 3D | `three`, `@react-three/fiber`, `@react-three/drei` (OrbitControls, Html, Line, Text, Environment, ContactShadows) |
| Efek | `@react-three/postprocessing` (Bloom ringan untuk beacon & rute) |
| State | `zustand` |
| Grafik 2D | `recharts` (grafik MWERI terhadap waktu) |
| Styling | Tailwind CSS (tema gelap) |
| Test | `vitest` untuk modul logika (MWERI, routing, pathway, prediksi) |
| Deploy (opsional) | build statis → Vercel / GitHub Pages |

Font: **Inter** (UI), **JetBrains Mono** (rumus & angka teknis).

---

## 3. Struktur Folder

```
nivora/
├─ docs/reference.png
├─ src/
│  ├─ main.tsx, App.tsx
│  ├─ config/
│  │  ├─ plant.ts          # layout fasilitas, node, graf rute (data, bukan kode)
│  │  ├─ weights.ts        # bobot MWERI & routing (bisa diubah dari UI)
│  │  └─ scenarios.ts      # Normal / Production Surge / Route Disruption
│  ├─ sim/
│  │  ├─ engine.ts         # loop tick simulasi (deterministik, seeded RNG)
│  │  ├─ sensors.ts        # generator data sensor sintetis per node
│  │  ├─ edgeAI.ts         # klasifikasi Normal/Warning/Critical
│  │  ├─ digitalTwin.ts    # prediksi time-to-critical (regresi tren)
│  │  ├─ mweri.ts          # indeks prioritas
│  │  ├─ pathway.ts        # circular material decision
│  │  ├─ routing.ts        # Dijkstra dengan biaya komposit
│  │  └─ metrics.ts        # KPI 3P
│  ├─ store/useSim.ts      # zustand: state simulasi + aksi UI
│  ├─ scene/
│  │  ├─ PlantScene.tsx    # Canvas, kamera, cahaya, lantai grid
│  │  ├─ Facility.tsx      # bangunan generik (box + label)
│  │  ├─ Conveyor.tsx      # conveyor + material yang bergerak
│  │  ├─ NodeMarker.tsx    # tiang sensor + beacon berwarna + ring pulsa
│  │  ├─ DustCloud.tsx     # partikel debu (Points), kepadatan = PM
│  │  ├─ Workers.tsx       # figur pekerja (instanced), bergerak di zona
│  │  ├─ WorkerZone.tsx    # area lantai transparan
│  │  ├─ Routes.tsx        # rute terpendek (merah putus) vs safe route (cyan menyala)
│  │  └─ HaulTruck.tsx     # kendaraan pengangkut residu yang mengikuti rute terpilih
│  ├─ ui/
│  │  ├─ TopBar.tsx        # judul, chip Predict/Protect/Circulate, jam simulasi, play/pause/speed
│  │  ├─ MweriPanel.tsx    # ranking node + bar + grafik prediksi
│  │  ├─ RoutingPanel.tsx  # tabel D/R/O/Cost + rekomendasi
│  │  ├─ NodeCard.tsx      # kartu melayang di atas node (drei <Html>)
│  │  ├─ PathwayBar.tsx    # 5 tahap jalur sirkular, tahap aktif menyala
│  │  ├─ ScenarioBar.tsx   # pemilih skenario
│  │  ├─ WeightsDrawer.tsx # slider bobot MWERI & routing (dengan normalisasi Σ=1)
│  │  ├─ ImpactPanel.tsx   # KPI 3P: People / Planet / Productivity
│  │  └─ CompareToggle.tsx # mode "Reaktif vs NiVORA"
│  └─ sim/__tests__/       # vitest
└─ package.json
```

**Prinsip:** semua logika di `src/sim/` adalah fungsi murni TypeScript tanpa React/Three, agar bisa diuji. Scene & UI hanya membaca store.

---

## 4. Model Data

```ts
type Status = 'normal' | 'warning' | 'critical';

interface NodeState {
  id: 'A' | 'B' | 'C' | string;
  name: string;              // "Transfer Point 1"
  position: [number, number, number];
  residueLevel: number;      // 0–100 (%)
  pm: number;                // partikulat, skor 0–10
  workers: number;           // jumlah pekerja di zona node (berbasis zona, TANPA identitas)
  exposureMin: number;       // durasi paparan kumulatif (menit)
  hazard: number;            // H: bahaya material 0–10 (dari karakterisasi)
  status: Status;            // keluaran Edge-AI
  mweri: number;             // 0–10
  ttc: number | null;        // time-to-critical (menit) dari Digital Twin
  history: { t: number; mweri: number; level: number }[];
  material: { compatibleWithProcess: boolean; secondaryUse: boolean; recoverableValue: boolean; treatable: boolean };
}

interface Edge { from: string; to: string; D: number; R: number; O: number; disabled?: boolean } // skor 0–10
```

---

## 5. Rumus & Algoritma (WAJIB sesuai esai)

### 5.1 MWERI
```
MWERI_i = wH·H_i + wP·P_i + wW·W_i + wT·T_i ,  wH+wP+wW+wT = 1, semua parameter skala 0–10
```
**Bobot default** (diturunkan dari Lampiran 4 esai — tiga contoh node cocok persis):
`wH = 0.2, wP = 0.4, wW = 0.3, wT = 0.1`

| Node | H | P | W | T | MWERI |
|---|---|---|---|---|---|
| A | 8 | 9 | 9 | 5 | **8.4** |
| B | 7 | 6 | 3 | 4 | **5.1** |
| C | 6 | 3 | 0 | 2 | **2.6** |

Klasifikasi: `0–3 Rendah · 3–6 Sedang · 6–8 Tinggi · 8–10 Kritis`.

Normalisasi sensor → skor:
- `P = clamp(pm_raw / pmLimit × 10)` (pmLimit konfigurabel)
- `W = clamp(workers / maxWorkersZone × 10)`
- `T = clamp(exposureMin / exposureLimitMin × 10)`
- `H` = konstanta per jenis material (input konfigurasi)

> Wajib ada di UI: catatan *"MWERI adalah indeks prioritas, bukan instrumen diagnosis medis. Bobot perlu dikalibrasi data lapangan & ahli K3."*

### 5.2 Edge-AI (klasifikasi status)
Untuk prototype, gunakan aturan ambang + tren (sebut "Edge-AI (rule-based mock)" di kode):
- `critical` jika `residueLevel ≥ 85` ATAU `pm ≥ 8` ATAU `MWERI ≥ 8`
- `warning` jika `residueLevel ≥ 60` ATAU `pm ≥ 5` ATAU kemiringan tren level > ambang
- selain itu `normal`

Opsional (bonus): ganti dengan model kecil (logistic regression di TS) yang dilatih dari data sintetis.

### 5.3 Digital Twin — prediksi time-to-critical
- Ambil 20 sampel terakhir `history`, hitung regresi linear (least squares) terhadap waktu untuk `MWERI` dan `residueLevel`.
- `ttc = (threshold − nilaiSekarang) / slope` jika slope > 0, else `null`.
- Tampilkan proyeksi sebagai garis putus-putus di grafik dan teks "Kritis dalam ±N menit".
- Mode **what-if**: tombol "Simulasikan 30 menit ke depan" menjalankan engine pada salinan state (fork) tanpa mengubah state utama.

### 5.4 Circular Material Decision Pathway
Urutan keputusan (berhenti di tahap pertama yang layak):
1. `compatibleWithProcess` → **Reuse / Reprocessing**
2. `secondaryUse` → **Repurpose / Recycle**
3. `recoverableValue` → **Recovery**
4. `treatable` → **Treatment**
5. lainnya → **Safe Disposal** (pilihan terakhir)

Setiap tahap dipetakan ke fasilitas tujuan di `plant.ts`. UI menyalakan tahap aktif dan menampilkan alasan (*"Karakteristik material masih memenuhi kebutuhan proses"*).

### 5.5 Graph-Based Safe Routing
Graf `G = (V, E)`. Biaya edge:
```
C_ij = α·D_ij + β·R_ij + γ·O_ij ,  α+β+γ = 1
```
**Bobot default** (diturunkan dari Lampiran 7 — cocok persis): `α = 0.3, β = 0.5, γ = 0.2`

| Rute | D | R | O | Cost |
|---|---|---|---|---|
| A (terpendek, lewat zona pekerja) | 2 | 9 | 3 | 5.7 |
| **B (safe route) ✓** | 4 | 2 | 3 | **2.8** |
| C (alternatif) | 5 | 4 | 2 | 3.9 |

- `R_ij` **dinamis**: dihitung ulang tiap tick dari jumlah pekerja di zona yang dilewati edge.
- Implementasi **Dijkstra** di `routing.ts`; juga hitung *shortest path* murni (hanya D) untuk perbandingan visual.
- Edge `disabled` (skenario Route Disruption) diabaikan → sistem re-routing otomatis.

### 5.6 Loop simulasi (engine.ts)
Tick = 1 menit simulasi; kecepatan 1×/5×/20×. Setiap tick:
1. Update sensor (akumulasi residu ∝ laju produksi + noise seeded; PM ∝ aktivitas crusher/conveyor; pekerja bergerak antar zona).
2. Edge-AI → status.
3. Hitung MWERI semua node, urutkan prioritas.
4. Digital Twin → `ttc`.
5. Jika node prioritas #1 `critical` atau `ttc < 20`: buat **task penanganan** → pathway → routing → spawn truk yang berjalan di rute terpilih → setelah sampai, `residueLevel` node turun, metrik tercatat.
6. Update KPI 3P.

Gunakan RNG seeded (mis. mulberry32) agar demo bisa direproduksi.

---

## 6. Layout Pabrik (plant.ts)

Koordinat dunia (x, z) dalam meter-skala-bebas, lantai ±42 × 30:

| Entitas | Posisi kira-kira | Catatan |
|---|---|---|
| Stockpile | depan-kanan | gundukan berundak, coklat |
| Crusher | sebelah stockpile | sumber debu |
| Conveyor 1 → **Node A / Transfer Point 1** | tengah | node kritis, residu 72% |
| Conveyor 2 → **Node B / Transfer Point 2** | belakang | warning |
| Conveyor 3 → Smelter / Proses Utama | belakang tengah | 2 cerobong |
| **Node C** (Stockpile Edge) | dekat stockpile | residu tinggi, tanpa pekerja → MWERI rendah (poin kunci esai!) |
| Zona aktivitas pekerja tinggi | antara Node A & Reprocessing | lantai merah transparan, 6 pekerja |
| Unit Reprocessing | kiri | hijau |
| Unit Recovery | belakang | cyan |
| Treatment | kanan belakang | ungu |
| Safe Disposal | kanan | pit coklat gelap |
| Jalan angkut | mengelilingi zona pekerja | jalur safe route |

Graf: node graf = titik sumber, persimpangan jalan, fasilitas tujuan. Minimal 10 vertex, sehingga ada ≥3 rute alternatif dari Node A ke Reprocessing.

---

## 7. Desain Visual (ikuti `docs/reference.png`)

- **Tema gelap "control room":** background `#070c16 → #13233b` radial, lantai `#1b2c45` dengan grid cyan opasitas 7%.
- **Warna status:** Normal `#2bd99f`, Warning `#ffb020`, Critical `#ff4d5e`, Safe route `#22e1ff`, aksen `#6fb6ff`, pekerja `#f2a33a`.
- Bangunan: low-poly box dengan tepi atas menyala tipis (edges geometry) — gaya digital twin, bukan fotorealistis.
- Kamera default isometrik (OrbitControls, polar terbatas agar tidak masuk ke bawah lantai). Tombol preset kamera: *Overview*, *Fokus Node A*, *Rute*.
- **Node marker:** tiang + bola beacon (emissive + bloom) + 3 ring pulsa di lantai; kecepatan pulsa naik saat critical.
- **Debu:** `Points` partikel melayang di sekitar node; jumlah & opasitas ∝ PM.
- **Rute:** terpendek = garis merah putus-putus; safe route = garis cyan tebal menyala dengan chevron/dash bergerak (animasi dashOffset).
- **Kartu node** (drei `<Html>`) menempel di atas beacon: nama, status badge, MWERI, residu %, PM, pekerja, prediksi.
- Panel kiri: MWERI ranking + grafik prediksi. Panel kanan: routing + rekomendasi + KPI 3P. Bawah: pathway, skenario, legenda.
- Footer kecil: *"Visualisasi konsep · seluruh nilai bersifat ilustratif"*.
- Responsif minimal ≥1280px lebar; di layar kecil panel bisa di-collapse.

---

## 8. Skenario (Lampiran 5 esai)

| Skenario | Perubahan parameter | Perilaku yang harus terlihat |
|---|---|---|
| **Normal Operation** | laju produksi 1.0×, PM stabil | pemantauan rutin, semua hijau/kuning, prediksi tren datar |
| **Production Surge** | laju produksi 1.8×, PM naik | Node A cepat naik ke critical, Digital Twin menampilkan ttc, prioritas naik, truk dikirim |
| **Route Disruption** | edge kunci pada safe route di-`disabled` (tampilkan barikade 3D) | sistem re-optimasi, memilih rute alternatif dengan risiko pekerja terendah berikutnya |

Tambahan mode **"Reaktif vs NiVORA"** (toggle): pada mode reaktif, penanganan hanya terjadi saat `residueLevel ≥ 90` atau berdasarkan jadwal tetap, dan rute = terpendek. Panel KPI menampilkan perbandingan kedua mode berdampingan → inilah argumen utama esai.

---

## 9. KPI 3P (metrics.ts)

- **People:** `worker exposure duration` (pekerja-menit di zona dengan PM ≥ 5), rata-rata MWERI.
- **Planet:** `material recovery rate` = (residu ke reuse/recycle/recovery) / total residu ditangani; `waste-to-disposal ratio`.
- **Productivity:** jumlah trip pengangkutan, trip yang "tidak perlu" (node masih normal saat ditangani), total jarak.

Tampilkan dalam persen perubahan terhadap baseline reaktif.

---

## 10. Fase Pengerjaan

**Fase 0 — Setup:** scaffold Vite React TS, Tailwind, ESLint, vitest, dependensi di atas. Halaman kosong bertema gelap.

**Fase 1 — Logika murni + test:** `mweri.ts`, `routing.ts`, `pathway.ts`, `digitalTwin.ts`, `edgeAI.ts`. Tes wajib:
- MWERI node A/B/C = 8.4 / 5.1 / 2.6 (toleransi 1e-9) dengan bobot default.
- Biaya rute A/B/C = 5.7 / 2.8 / 3.9; Dijkstra memilih B; jika edge B dinonaktifkan memilih C.
- Pathway mengembalikan tahap pertama yang layak.
- Regresi linear memprediksi ttc dengan benar pada data sintetis linear.

**Fase 2 — Engine & store:** loop tick, RNG seeded, skenario, play/pause/speed.

**Fase 3 — Scene 3D statis:** lantai, fasilitas, conveyor, node marker, zona pekerja, label. Sesuaikan dengan `docs/reference.png`.

**Fase 4 — Scene dinamis:** debu, pekerja bergerak, material di conveyor, warna status live, rute + truk animasi.

**Fase 5 — UI panel:** semua panel di §7, terikat ke store.

**Fase 6 — Interaksi:** klik node → fokus kamera + kartu detail; slider bobot; skenario; what-if; mode Reaktif vs NiVORA.

**Fase 7 — Polish & demo:** bloom, transisi kamera, mode presentasi (auto-tour 60 detik: Normal → Surge → kritis → routing → Disruption → ringkasan KPI), README dengan screenshot, build & deploy.

---

## 11. Kriteria Selesai (Definition of Done)

- [ ] `npm test` lulus; angka MWERI & rute sama dengan lampiran esai.
- [ ] Scene 3D berjalan ≥ 50 fps di laptop biasa (gunakan instancing untuk pekerja & partikel).
- [ ] Ketiga skenario + mode Reaktif vs NiVORA dapat didemokan dalam < 2 menit.
- [ ] Node C menunjukkan pesan kunci: residu tinggi tapi MWERI rendah karena tidak ada pekerja.
- [ ] Rekomendasi operasional selalu menjawab: **kapan**, **prioritas**, **ke mana**, **lewat rute mana**.
- [ ] Data pekerja hanya berbasis zona (tidak ada identitas) — sesuai mitigasi privasi Lampiran 9.
- [ ] Label "ilustratif" dan disclaimer MWERI tampil.

## 12. Hal yang Jangan Dilakukan

- Jangan memakai aset/model 3D berhak cipta atau logo perusahaan tambang nyata.
- Jangan menyebut angka sebagai data lapangan nyata.
- Jangan menaruh logika simulasi di dalam komponen React.
- Jangan menambah backend; semua berjalan di browser.

---

## 13. Keputusan Teknis

Keputusan ini **mengesampingkan** bagian sebelumnya bila bertentangan (ditetapkan 2026-10-09).

### 13.1 Proyek & tooling
- Root proyek = folder ini (bukan subfolder `nivora/`). Referensi visual di `docs/reference.png`. Repo git; `.gitignore` minimal `node_modules`, `dist`, `.env`.
- **React 19 + `@react-three/fiber` v9** (menggantikan React 18 di §2). Peer dependency sudah dicek: drei v10, `@react-three/postprocessing` v3, recharts v3, zustand v5 kompatibel. Catatan: fiber 9.8 membatasi `react < 19.4`.
- **Tailwind v4** via `@tailwindcss/vite`. Token design system (warna status, font, dsb.) ditaruh di blok `@theme` pada `src/index.css` — **tidak ada** `tailwind.config`.
- Node lokal 20.x → **vitest 4.x** (vitest 5 butuh Node ≥22) dan **TypeScript 6.0.x** (typescript-eslint belum mendukung TS 7).
- Font di-self-host lewat `@fontsource-variable/inter` & `@fontsource-variable/jetbrains-mono` (demo harus jalan offline).
- Deploy: **Vercel** (tanpa base path). Siapkan `npm run build` + `vercel.json`; deploy baru setelah Fase 7.

### 13.2 Status sensor vs prioritas MWERI (Node C)
- Ambang Edge-AI §5.2 **tidak diubah**. Node C (residu 61%) berstatus **WARNING**, tetapi MWERI 2.6 → prioritas **RENDAH**. Ini pesan kunci esai: sistem berbasis volume akan memprioritaskan Node C, MWERI tidak karena tidak ada pekerja.
- `NodeCard` menampilkan dua baris terpisah: `Status sensor: WARNING (volume)` dan `Prioritas MWERI: RENDAH`.
- Urutan per tick: hitung **MWERI dulu**, baru Edge-AI (karena aturan `critical` memakai `MWERI ≥ 8`).

### 13.3 Skor rute & routing
- D/R/O sebuah rute = **jumlah (sum)** skor edge sepanjang rute (aditif → valid untuk Dijkstra). Skor edge di `plant.ts` dirancang agar total tiap rute sama persis dengan Lampiran 7: A = 2/9/3 (cost 5.7), B = 4/2/3 (cost 2.8), C = 5/4/2 (cost 3.9).
- Di test, R dibekukan pada snapshot awal. R dinamis (dari jumlah pekerja di zona) hanya berlaku saat simulasi berjalan.
- Di UI, skor rute yang totalnya > 10 ditampilkan ternormalisasi ke skala 0–10.

### 13.4 Waktu & paparan
- Skala waktu: 1 tick = 1 menit simulasi. **1× = 1 tick per detik nyata**, 5× = 5/detik, 20× = 20/detik. Scene menginterpolasi di antara tick.
- Input T pada MWERI memakai **jendela bergulir 60 menit** (`exposureWindowMin` di `weights.ts`, konfigurabel), bukan kumulatif.
- KPI "worker exposure duration" di `ImpactPanel` tetap **kumulatif per shift**, reset setiap 8 jam simulasi.
- `history` di-warm-up (prefill) saat inisialisasi agar `ttc` langsung tersedia di awal demo.

### 13.5 Reaktif vs NiVORA & determinisme
- Engine reaktif berjalan **headless** paralel dengan seed yang sama; scene 3D hanya menampilkan mode aktif.
- **Dua stream RNG terpisah:** `envRng` (sensor/lingkungan/pekerja) dan `decisionRng` (keputusan/penanganan). Kedua mode menerima input sensor identik → perbedaan KPI murni berasal dari kebijakan penanganan.
- State RNG disimpan di dalam state engine (bukan closure) agar fork what-if (`structuredClone`) deterministik.

### 13.6 Pathway
- Tujuan default: **A → Reprocessing, B → Recovery, C → Treatment**. Flag material disimpan di `plant.ts`.
- `PathwayBar` menampilkan alasan setiap keputusan.

### 13.7 Bahasa & layout
- Bahasa campuran: label Indonesia, istilah teknis Inggris (MWERI, Digital Twin, Edge-AI, Safe Route, Reprocessing, dll.). Semua string UI lewat glosarium `src/config/i18n.ts`.
- Di bawah 1280px: panel bisa dilipat. Ponsel punya layout tersendiri (§13.16, menggantikan "tidak ada versi mobile").

### 13.8 Sinkronisasi store–scene (pedoman performa)
- Objek 3D yang berubah tiap frame membaca store via `useSim.getState()` / `subscribe` di dalam `useFrame` dan menulis ke ref — **bukan** lewat selector React.
- Komponen React hanya berlangganan nilai turunan yang jarang berubah (dengan `useShallow`). Grafik recharts di-throttle ±2 Hz.
- Pekerja: `InstancedMesh`. Debu: satu `Points` per node dengan buffer prealokasi + `drawRange`. Bloom selektif (`toneMapped={false}` + threshold tinggi), `dpr` dibatasi `[1, 1.5]`.

### 13.9 Design system
- Spesifikasi: `docs/design-system.md`. Token: `src/styles/tokens.css` (blok `@theme`, diimpor `src/index.css`). Palet bawaan Tailwind di-reset → hanya token NiVORA yang tersedia.
- Aturan inti: cyan `safe` dicadangkan untuk keputusan NiVORA; status = warna + bentuk + teks; teks merah pakai `critical-fg`; label di wadah ber-tint pakai `fg-2`; teks ≥ 12px; tanpa `backdrop-filter` di atas canvas.

### 13.10 Engine & store (Fase 2)
- Engine mulai dari **baseline awal shift** (`NODE_SEEDS`, belum ada node critical). Nilai Lampiran 4 disimpan sebagai `ESSAY_SNAPSHOT` (acuan & test); kondisi serupa muncul saat Production Surge (Node A critical ±10 menit).
- `step()` murni (structuredClone). Ambang & parameter kebijakan di `config/thresholds.ts` (`POLICY`, `SIM`); dinamika sensor, truk, dan zona di `config/plant.ts` (`NODE_DYNAMICS`, `HAULING`, `WORKER_ZONES`).
- NiVORA mengirim truk bila node critical, atau node prioritas #1 dengan `ttc < 20`, **dan** residu ≥ 30% (`nivoraMinLoadLevel`). Urgensi rekomendasi "now" mengikuti aturan yang sama.
- Reaktif: residu ≥ 90% atau jadwal tetap tiap 60 menit (bergiliran; lihat §13.18), rute terpendek; **tujuan tetap mengikuti pathway** (yang dibedakan hanya waktu & rute, sesuai §8).
- R dinamis: R edge berzona = R snapshot × pekerja sekarang / pekerja baseline zona.
- Truk dialihkan segera saat ruasnya diblokir (termasuk saat muat dan saat skenario diganti); bila sedang di ruas yang diblokir, truk mundur (`retreat`) ke awal ruas.
- Store `useSim` memegang engine `nivora` + `reactive` (seed & skenario & bobot sama); `setWeights` menormalisasi Σ = 1. Jam: `store/clock.ts` (rAF). Halaman debug sementara: `#debug`.

### 13.11 Scene 3D (Fase 3)
- Kamera **ortografis isometrik sejati** (azimuth 45°, elevasi ≈35.26°) — hasil kalibrasi keempat sudut lantai `docs/reference.png` (galat < 10 px). Koordinat di `plant.ts` dipetakan dari referensi dengan kalibrasi yang sama. Zoom dasar mengikuti ukuran viewport (`scene/layout.ts`).
- Preset kamera = target + polar + azimuth + pengali zoom (`CAMERA_PRESETS_POSE`); transisi damped, dibatalkan saat pengguna menyeret; reduced-motion = lompat langsung. Polar dibatasi ≤ 68°, titik orbit dijepit di dalam lantai.
- Label callout **tidak** memakai drei `<Html>` per objek (satu React root per label → error unmount di React 19 StrictMode). Satu `LabelLayer` DOM di luar Canvas; posisi ditulis per frame lewat ref oleh `LabelLeaders` (`scene/labelRegistry.ts`). Pola yang sama dipakai untuk NodeCard di Fase 5.
- Warna scene dari `src/styles/tokens.ts` (mirror `tokens.css`, dijaga test); warna fasilitas khusus scene di `scene/palette.ts`. Grid cyan 7%/14% = warna yang sudah dicampur ke lantai (drei Grid tanpa opacity). Tanpa `Environment` preset (butuh unduhan CDN — demo harus offline).

### 13.12 Scene dinamis (Fase 4)
- Store → scene lewat `scene/simFrame.ts`: objek modul berisi `prev`/`curr` SimState (via `useSim.subscribe`) + `tickAlpha()` untuk interpolasi antar-tick. Semua animasi membaca ini di `useFrame` dan menulis ke ref — tidak ada `setState` per frame dan tidak ada `new` di `useFrame`.
- Perubahan struktural (rute, barikade, teks/warna label) memakai selector yang mengembalikan **string kunci** agar re-render hanya saat benar-benar berubah. `PlantScene` sendiri **tidak boleh** berlangganan store: re-render-nya sempat membuat ContactShadows merender ulang seluruh scene (render ganda ±8% frame).
- Geometri statis digabung (`scene/staticGeometry.ts`): semua bangunan + conveyor = 1 mesh warna per-vertex; semua tepi menyala = 1 LineSegments2; jalan = 1 mesh; garis penunjuk label = 1 LineSegments2. Draw call turun 404 → ±70.
- Debu: posisi partikel dihitung di vertex shader; CPU hanya `drawRange` (∝ PM²), opacity, dan uniform. Pekerja & bijih conveyor: InstancedMesh. Truk: slot = `HAULING.fleet`, posisi = parameter ruas yang diinterpolasi lalu dievaluasi di polyline Dijkstra.
- Bloom selektif: `luminanceThreshold = 1`; hanya material HDR (`toneMapped={false}`, warna × >1) — beacon, safe route, lampu truk — yang menyala. EffectComposer mematikan tone mapping renderer → `ToneMapping` ACES di akhir chain.
- `eslint`: `react-hooks/immutability` dimatikan khusus `src/scene/**` (mutasi objek three di `useFrame` adalah pola resmi R3F).
- Dev-only: `window.__nivoraPerf` (fps, draw call, segitiga, deteksi render ganda) & `window.__nivoraSim` (store) untuk pengujian.

### 13.13 Panel UI (Fase 5)
- Data panel dihitung oleh fungsi murni di `src/ui/viewModels.ts` (diuji di `src/ui/__tests__`): ranking, grafik prediksi, kartu node, kalimat rekomendasi (kapan · prioritas · ke mana · lewat mana), tabel rute, KPI 3P, pathway. Komponen hanya merender hasilnya.
- Kelas MWERI di UI dihitung dari angka yang **ditampilkan** (1 desimal) agar tidak muncul "3.0 · RENDAH".
- **NodeCard tidak memakai drei `<Html>`** (lihat §13.11); dirender di `scene/NodeCardLayer.tsx` dengan registry proyeksi yang sama (opsi `align`). Mode ringkas di bawah 1280px kecuali node critical.
- Laju pembaruan UI: teks panel/kartu/label ≤ 5 Hz (`UI_TEXT_MS`), grafik & KPI ±2 Hz (`UI_CHART_MS`), lewat `useThrottledSim`. Tanpa ini fps turun ke 19 pada 20× (recharts digambar ulang tiap tick); `MweriChart` juga di-`memo`.
- Panel bisa dilipat; default terlipat di bawah 1280px. Isi panel terlipat tidak di-render. Preset kamera pindah ke TopBar; legenda hanya status.
- Satu `role="status"` global (`ui/LiveAnnouncer.tsx`) untuk node yang menjadi critical & re-routing.

### 13.14 Interaksi (Fase 6)
- Pemilihan node (`useView.selectNode`): klik menara/beacon di scene, judul NodeCard, baris ranking, atau tautan insight → kamera `focusPose` (node di kiri-tengah) + kartu detail di kanan beacon. Esc / tombol × menutup dan kembali ke overview. Kartu lain menjadi ringkas.
- Kartu detail menampilkan komposisi MWERI per suku (w × skor) — Node C terlihat langsung `W 0.3×0 = 0`. Panel MWERI memuat insight "Volume ≠ risiko" (`volumeRiskInsight`) selama node residu tertinggi tanpa pekerja bukan prioritas #1.
- WeightsDrawer: `rebalanceWeights` menyebar sisa bobot secara proporsional (Σ = 1); pratinjau ranking & rute ≤ 5 Hz. Rute terpilih yang melewati zona pekerja (mis. β = 0) **tidak** diberi label "safe".
- What-if: `whatIf()` = fork `step()` 30 tick; state utama tidak berubah (diuji). Lintasan tampil sebagai garis titik-titik di grafik.
- Toggle NiVORA/Reaktif mengganti `view`; banner merah + kotak tindakan bernada merah di mode reaktif (cyan tetap khusus keputusan NiVORA). KPI selalu menampilkan nilai kedua mode; tren dinilai relatif terhadap baseline reaktif (Planet pun).
- Performa terukur (semua panel, Surge): 56 fps @1×, 54 @5×, 52 @20×; semua fitur Fase 6 terbuka bersamaan: 51 @20×.

### 13.15 Declutter & presentasi (Fase 7)
- Declutter (progressive disclosure): maksimal tiga blok selalu terlihat — TopBar satu baris, panel MWERI (ranking + grafik; insight di balik ikon (i)), kartu Rekomendasi (kapan · prioritas · ke mana + tahap pathway · rute; tabel D/R/O di balik "Lihat detail routing"). KPI hanya saat "Bandingkan reaktif"; tombol `H` = mode fokus. Label fasilitas hanya untuk tujuan rute aktif & hover; node berupa pill kecuali dipilih atau prioritas #1 yang critical; hanya safe route yang berlabel.
- Presentasi = `src/demo/tour.ts` (naskah 60 detik, 7 langkah, aksi store saja) + `ui/TourOverlay.tsx`. Langkah Overview mengembalikan skenario & bobot esai sebelum `reset(DEFAULT_SEED)` agar demo identik dari kondisi apa pun (diuji). Langkah Node A menunggu A critical **dan** rekomendasi "now" agar narasi, kartu, dan scene selaras. Esc / keluar layar penuh menghentikan tur.
- Build: vendor dipisah lewat `build.rolldownOptions.output.codeSplitting` (three, r3f, charts, react); `chunkSizeWarningLimit` 800 kB karena inti three.js ±740 kB. `vercel.json`: `npm ci`, cache permanen `/assets/*`. `engines.node >= 20.19`.
- Fallback tanpa WebGL: Chrome ≥137 tidak lagi jatuh ke SwiftShader, jadi bila akselerasi GPU mati/diblokir (terjadi di Chrome Linux pengguna; Firefox tetap jalan) WebGL tidak ada sama sekali. `hasWebGL2()` dicek sebelum scene dimuat; `ErrorBoundary` membungkus scene dan seluruh app agar error tidak menyisakan layar kosong. `Fallback` menampilkan tangkapan diam `public/scene-fallback-{dark,light}.jpg` + alamat pengaturan Chrome yang bisa disalin; panel tetap hidup.

### 13.16 Tampilan ponsel
- Juri kemungkinan besar membuka di ponsel → layout terpisah untuk `MOBILE_QUERY` = `(max-width: 767px), (max-height: 520px)` (`useIsMobile`). Desktop tidak berubah.
- `MobileTopBar`: dua baris (identitas · Tur 60 dtk · menu ☰ / jalankan+jam · skenario selebar layar); lanskap satu baris. Kecepatan, preset kamera, dan bobot di menu. Gradasi latar agar pill tidak menembus teks.
- Scene: hanya pill node (`buildSceneLabels({ mobile })`) — tanpa label fasilitas/zona/rute & tanpa kartu melayang. `baseZoom(..., mobile)` memenuhi lebar layar; `setViewOffset` (`mobileViewShift`) memusatkan scene di area yang tidak tertutup sheet (lebih ke atas saat detail node terbuka; lanskap ke kanan). Sentuhan: 1 jari geser, 2 jari cubit-zoom/putar.
- `MobileSheet` (bottom sheet): tertutup = ringkasan kapan · prioritas · ke mana · rute + tab Rekomendasi/Prioritas/Bandingkan; isi memakai komponen desktop varian `embedded`. Node yang diketuk tampil sebagai `NodeCard embedded` di sheet. Saat tur: hanya ringkasan (langkah KPI menampilkan KPI), kartu tur di atasnya; tur di ponsel tanpa layar penuh.
- `WeightsDrawer` di ponsel = lembar selebar layar. `#root` memakai `100dvh`; safe-area iOS via `viewport-fit=cover` + `env(safe-area-inset-*)`.

### 13.17 Tema gelap & terang
- Nilai warna **hanya** di `src/styles/tokens.css`, blok `[data-theme='dark'|'light']` (`--nv-*`); `@theme` berisi `--color-x: var(--nv-x)` (tanpa hex). `styles/tokens.ts` mem-parse blok itu (`PALETTE`, `color()`) — mirror hex lama dihapus. Dilarang menulis warna di komponen, `palette.ts`, atau CSS lain (`noHardcodedColors.test.ts`).
- Status: warna dasar (`normal/warning/critical/high`) untuk fill & garis (≥3:1), varian `-fg` untuk teks (≥4.5:1, juga di atas tint 16%) — dijaga `contrast.test.ts` di kedua tema. Kuning terang → amber pekat di tema terang. Nama token lama dipertahankan (`safe` = cyan keputusan NiVORA).
- Store `store/useTheme.ts`: default gelap; pilihan di `localStorage['nivora-theme']` (try/catch); `prefers-color-scheme` hanya bila belum ada pilihan. Skrip inline di `index.html` memasang `data-theme` sebelum render pertama. Toggle `ui/ThemeToggle.tsx` (TopBar; menu ☰ di ponsel), shortcut `T`.
- Scene: `scene/palette.ts` = `SCENE_PALETTE[theme]` (warna dari token + parameter non-warna: intensitas cahaya, bayangan, bloom). Komponen memakai `useScenePalette()`; geometri statis ber-warna-vertex dibangun ulang saat tema berganti; `Lighting.tsx` memegang cahaya + ContactShadows (`key` tema). `PlantScene` tetap tidak berlangganan store.
- Bloom hanya tema gelap (pengali HDR > 1). Tema terang: pengali 1, tanpa pass Bloom, tone mapping Neutral; beacon diberi outline kulit-terbalik, safe route = outline opak + cyan pekat + dash putih mengalir. Outline **harus opak** — garis `transparent` digambar setelah yang opak dan menutupi garis di atasnya.
- Recharts memakai `var(--color-*)` langsung pada atribut SVG → ikut tema tanpa re-render.
- Transisi: kelas `theme-transition` di `<html>` selama ±220 ms (warna DOM 200 ms + fade canvas); tidak dipasang bila `prefers-reduced-motion`.
- Terukur (Surge 5×, 1600×900): 54 fps terang, 55 fps gelap.

### 13.18 KPI 3P: definisi yang membedakan kedua mode
- **People = dosis paparan** (`exposureDose`): pekerja-menit ditimbang intensitas (skor PM / 10) di zona dengan PM ≥ 5. Menggantikan durasi murni §9 sebagai angka utama: saat Production Surge PM selalu ≥ 5 di kedua mode sehingga durasi identik (±0%), padahal penanganan dini menurunkan PM Node A dari ±9 ke ±6. Durasi (`exposureTotal`, `exposureShift`) tetap dicatat & tampil di `#debug`.
- **Productivity = trip tepat guna** (`usefulTripRate` = 1 − trip tak perlu / trip). Trip tak perlu = node masih `normal` **atau** residu < `nivoraMinLoadLevel` saat truk dikirim. Ditampilkan seperti Planet (angka NiVORA, "N% vs R%"), bukan persen perubahan — hitungan mentahnya terlalu kecil (0 vs 0 → "—", 0 vs 1 → −100%).
- **Jadwal tetap reaktif 60 menit** (dulu 120): ronde per jam bergiliran antar node adalah sumber trip tak perlu pada operasi terjadwal; pada 120 menit hampir tidak pernah terjadi.
- NiVORA selalu 100% trip tepat guna **karena aturannya** (hanya mengirim saat critical/ttc dekat dan muatan cukup) — KPI ini mengukur pemborosan baseline, bukan keunggulan yang muncul sendiri. Recovery rate berbeda karena *node mana* yang ditangani (kedua mode memakai pathway yang sama).
- Trade-off yang tidak disembunyikan: jarak tempuh NiVORA lebih besar (safe route lebih panjang, trip lebih awal) — dijaga test `kpiDirection.test.ts` dan tampil di `#debug`.
- Test hanya memeriksa **arah** (3 skenario × 1 shift, plus 3 seed lain), bukan nilai. Pada jam-jam awal Normal/Disruption trip tepat guna masih 100% vs 100%.
