# NiVORA — Design System

Dashboard digital twin bertema gelap "control room". Dokumen ini adalah spesifikasi. Nilai token yang berlaku ada di [`src/styles/tokens.css`](../src/styles/tokens.css), dan bila keduanya berbeda, **file CSS yang benar**.

Sumber: CLAUDE.md §7, `docs/reference.png`, keputusan §13. Tailwind v4: semua token didefinisikan di `@theme` dan langsung tersedia sebagai utility, tanpa `tailwind.config`.

---

## 1. Prinsip

1. **Scene adalah panggungnya, panel cuma bingkai.** Panel memakai warna netral dan tenang. Saturasi tinggi hanya dipakai untuk hal yang perlu diperhatikan operator: status node, rute, dan rekomendasi.
2. **Cyan berarti keputusan NiVORA.** `safe` (#22e1ff) hanya dipakai untuk safe route di scene, baris rute terpilih, dan kotak rekomendasi. Tidak boleh untuk tombol, link, atau dekorasi. Keperluan interaktif memakai `accent`. Dengan aturan ini, juri bisa langsung melihat mana keluaran sistem.
3. **Status tidak boleh hanya disampaikan lewat warna.** Setiap warna status selalu muncul bersama **bentuk** dan **teks**: ● Normal, ▲ Warning, ◆ Critical.
4. **Angka pakai mono, kata pakai sans.** JetBrains Mono (`tabular-nums`, `slashed-zero`) untuk nilai, rumus, dan jam simulasi. Inter untuk label dan kalimat. Mono tidak dipakai untuk label biasa.
5. **Status sensor dan prioritas MWERI adalah dua hal berbeda** (§13.2). Warna status sensor mengikuti keluaran Edge-AI, sedangkan warna angka MWERI mengikuti kelas MWERI. Node C sengaja menampilkan status kuning dengan MWERI hijau.
6. **Jujur soal data.** Data disebut "LIVE" hanya saat simulasi berjalan; saat dijeda tulisannya berubah menjadi "JEDA". Label "ilustratif" dan disclaimer MWERI selalu tampil.

---

## 2. Token

### 2.1 Warna

| Peran | Token (utility) | Hex | Pemakaian |
|---|---|---|---|
| Kanvas | `canvas` | `#070c16` | latar terdalam, tepi radial |
| | `canvas-glow` | `#13233b` | pusat radial di belakang scene |
| | `floor` | `#1b2c45` | lantai 3D (grid cyan 7%) |
| Surface | `surface-0` | `#0b1424` | Panel, NodeCard |
| | `surface-1` | `#111e33` | KPI tile, chip, step, baris |
| | `surface-2` | `#172a45` | hover, baris terpilih |
| Garis | `line` | `#1d2e48` | pemisah dekoratif |
| | `line-strong` | `#2a4266` | tepi panel |
| | `line-control` | `#5577a2` | batas kontrol interaktif (≥3:1) |
| Teks | `fg` | `#e8f0fc` | teks utama, angka |
| | `fg-2` | `#a9bad3` | sekunder; **wajib** untuk label di wadah ber-tint |
| | `fg-3` | `#8597b3` | muted; **hanya** di surface polos |
| | `fg-disabled` | `#56677f` | kontrol non-aktif saja |
| | `on-status` | `#06101c` | teks di atas fill status solid |
| Status | `normal` | `#2bd99f` | ● Normal, MWERI Rendah |
| | `warning` | `#ffb020` | ▲ Warning, MWERI Sedang |
| | `high` | `#ff7a3d` | MWERI Tinggi (6–8) |
| | `critical` | `#ff4d5e` | ◆ fill, glow, beacon |
| | `critical-fg` | `#ff7682` | **teks** merah (lebih terang agar lulus AA) |
| Peran | `safe` | `#22e1ff` | dicadangkan untuk keputusan NiVORA (prinsip 2) |
| | `accent` | `#6fb6ff` | judul panel, kontrol aktif, cincin fokus |
| | `worker` | `#f2a33a` | figur & zona pekerja |

**Tint status** = `bg-<status>/16`. Yang transparan hanya latarnya, teks tetap pekat. Tint boleh dipakai di atas `canvas`, `surface-0`, atau `surface-1`, **tetapi tidak di `surface-2`** (`high` di atas tint di surface-2 hanya 4.4:1).

**Pemetaan kelas MWERI → warna:** `0–3 Rendah → normal` · `3–6 Sedang → warning` · `6–8 Tinggi → high` · `8–10 Kritis → critical-fg`.

**Warna di scene 3D** memakai hex yang sama. Komponen scene membacanya dari `getComputedStyle(document.documentElement)` atau dari mirror TS yang dibuat di Fase 3, supaya tidak ada hex yang ditulis langsung di komponen.

### 2.2 Tipografi

| Token | Ukuran / LH | Berat | Font | Pemakaian |
|---|---|---|---|---|
| `text-display` | 28 / 34 | 700 | Inter | judul aplikasi |
| `text-metric-lg` | 32 / 36 | 600 | Mono | skor MWERI di ranking |
| `text-metric` | 24 / 28 | 600 | Mono | nilai NodeCard & KPI |
| `text-heading` | 16 / 22 | 600 | Inter | nama node |
| `text-body` | 14 / 22 | 400 | Inter | teks panel, rekomendasi |
| `text-title` | 13 / 18, +0.08em | 700 | Inter | judul panel, UPPERCASE, `accent` |
| `text-caption` | 13 / 18 | 400 | Inter / Mono | rumus (mono), alasan, catatan |
| `text-label` | 12 / 16, +0.06em | 600 | Inter | label metrik & header tabel, UPPERCASE |

- Ukuran minimum **12px**. Referensi memakai 11px di beberapa tempat; di sini dinaikkan ke 12px.
- UPPERCASE hanya untuk `text-title` dan `text-label`. Keduanya berfungsi sebagai penanda struktur (judul panel dan nama kolom metrik), bukan hiasan. Tidak ada eyebrow di atas heading.
- Rumus seperti `MWERI = 0.2·H + 0.4·P + 0.3·W + 0.1·T` ditulis dengan `font-mono text-caption text-fg-3`, memakai titik tengah `·` sebagai tanda kali.
- Bobot rumus di UI **dibaca dari store**, tidak ditulis langsung, supaya tetap sesuai saat slider diubah.

### 2.3 Spacing

Skala dasar Tailwind 4px dipertahankan. Token semantiknya:

| Token | Nilai | Pemakaian |
|---|---|---|
| `panel` | 20 | padding Panel (`p-panel`) |
| `tile` | 12 | padding KPI tile & NodeCard |
| `stack` | 12 | jarak antar blok dalam panel (`gap-stack`) |
| `gutter` | 24 | jarak panel ke tepi layar |
| `panel-w` | 340 | lebar panel samping (`w-panel-w`) |
| `card-w` | 300 | lebar NodeCard |
| `control` | 32 | tinggi chip & tombol (`h-control`) |
| `row` | 32 | tinggi baris tabel |

Target klik minimal 32px di desktop. WCAG 2.5.8 AA mensyaratkan minimal 24px. Tidak ada versi mobile (§13.7).

### 2.4 Radius (berhierarki)

`badge 4` < `control 8` < `tile 10` < `card 12` < `panel 16`. Semakin besar wadahnya, semakin besar radiusnya. Chip skenario memakai `control`, bukan `rounded-full`. Pill `rounded-full` hanya untuk chip Predict/Protect/Circulate dan indikator LIVE.

### 2.5 Elevasi & glow

Di tema gelap, bayangan hampir tidak terlihat. Kedalaman dibentuk dari **highlight tipis di atas (inset) ditambah bayangan pekat yang lebar**.

| Token | Pemakaian |
|---|---|
| `shadow-panel` | Panel |
| `shadow-raised` | KPI tile, drawer |
| `shadow-glow-{normal,warning,critical,safe}` | NodeCard sesuai status, kotak rekomendasi (`safe`) |

Glow adalah ring 1px plus halo. Pakai **satu glow per elemen**, dan hanya untuk elemen yang statusnya penting saat itu.

### 2.6 Gerak

| Token | Nilai | Pemakaian |
|---|---|---|
| `--duration-fast` | 120ms | hover, pressed |
| `--duration-base` | 200ms | ganti status, toggle |
| `--duration-slow` | 320ms | buka/tutup panel, drawer |
| `ease-out` | `cubic-bezier(.22,1,.36,1)` | masuk |
| `animate-beacon` / `-fast` | 1.6s / 0.8s | titik status (cepat saat critical) |

- `prefers-reduced-motion`: durasi menjadi 0, dan animasi berulang wajib memakai `motion-safe:` (misalnya `motion-safe:animate-beacon`).
- Perubahan angka (MWERI, %) **tidak** dianimasikan dengan efek hitung naik, karena di 20× akan terus berkedip. Cukup ganti nilainya, lalu warna transisi selama `duration-base`.

### 2.7 Layer (z-index)

`--z-scene 0` · `--z-scene-overlay 10` (NodeCard / drei `<Html>`) · `--z-panel 20` · `--z-drawer 40` · `--z-toast 50`.

---

## 3. Kontras WCAG AA (terverifikasi)

Rasio dihitung dengan rumus luminans relatif WCAG 2.x dari nilai di `tokens.css`. Tint dihitung sebagai campuran 16% warna status di atas surface.

**Teks di surface polos** (min 4.5:1)

| Token | canvas | surface-0 | surface-1 | surface-2 |
|---|---|---|---|---|
| `fg` | 17.1 | 16.1 | 14.6 | 12.6 |
| `fg-2` | 9.9 | 9.3 | 8.5 | 7.3 |
| `fg-3` | 6.6 | 6.2 | 5.6 | 4.9 |
| `normal` | 10.7 | 10.1 | 9.2 | 7.9 |
| `warning` | 10.7 | 10.1 | 9.1 | 7.9 |
| `critical-fg` | 7.6 | 7.2 | 6.5 | 5.6 |
| `high` | 7.6 | 7.1 | 6.4 | 5.6 |
| `safe` | 12.4 | 11.7 | 10.6 | 9.1 |
| `accent` | 9.1 | 8.6 | 7.8 | 6.7 |
| `worker` | 9.4 | 8.8 | 8.0 | 6.9 |

**Teks status di atas tint statusnya sendiri** (min 4.5:1; tint tidak dipakai di surface-2)

| Token | canvas | surface-0 | surface-1 |
|---|---|---|---|
| `normal` | 8.1 | 7.3 | 6.5 |
| `warning` | 8.1 | 7.5 | 6.7 |
| `critical-fg` | 6.5 | 6.1 | 5.4 |
| `high` | 6.1 | 5.7 | 5.1 |
| `safe` | 9.0 | 8.2 | 7.3 |
| `accent` | 7.0 | 6.4 | 5.7 |

**Teks `on-status` di atas fill solid:** normal 10.5 · warning 10.5 · critical 5.9 · high 7.4 · safe 12.1 · accent 8.9.

**Non-teks** (min 3:1): `line-control` 4.2 / 4.0 / 3.6 / 3.1 · cincin fokus `accent` ≥ 6.7 di semua surface.

**Aturan yang muncul dari pengujian:**
- `critical` (#ff4d5e) sebagai teks di `surface-2` hanya 4.45:1, jadi **teks merah selalu memakai `critical-fg`**.
- `fg-3` di atas tint safe hanya 4.37:1, jadi **label di dalam wadah ber-tint memakai `fg-2`**.
- Warna muted di referensi (#62728b) hanya 3.0–4.0:1, sehingga diganti `fg-3` (#8597b3).

---

## 4. Komponen

Notasi kelas di bawah memakai utility token. Setiap komponen adalah komponen presentasional: menerima props dari selector store dan tidak menghitung logika simulasi (§12).

### 4.1 Panel

Wadah panel samping kiri/kanan dan bar bawah.

```
┌─────────────────────────────────────┐  rounded-panel, border line-strong
│ PRIORITAS PENANGANAN · MWERI    [–] │  text-title text-accent + tombol lipat
│ MWERI = 0.2·H + 0.4·P + 0.3·W + 0.1·T│  font-mono text-caption text-fg-3
│                                     │
│  …isi (gap-stack)…                  │  p-panel
└─────────────────────────────────────┘
```

| Bagian | Spesifikasi |
|---|---|
| Wadah | `bg-surface-0/92 border border-line-strong rounded-panel shadow-panel p-panel`, `w-panel-w` |
| Header | `<h2>` `text-title uppercase text-accent`. Subjudul opsional `font-mono text-caption text-fg-3` |
| Tombol lipat | `size-8 rounded-control`, ikon chevron, `aria-expanded`, `aria-controls`. Hover `bg-surface-2` |
| Terlipat | Hanya header yang terlihat. Wajib di bawah 1280px |
| Semantik | `<section aria-labelledby>` |

> **Performa:** jangan pakai `backdrop-filter: blur()` di atas canvas WebGL karena blur dihitung ulang setiap frame. Cukup latar semi-opak 92%.

### 4.2 StatusBadge

Status sensor dari keluaran Edge-AI.

```
 ● NORMAL     ▲ WARNING     ◆ CRITICAL
```

| Properti | Spesifikasi |
|---|---|
| Ukuran | tinggi 20px, `px-2 gap-1.5 rounded-badge`, `text-label uppercase whitespace-nowrap` |
| Bentuk | SVG 8px: lingkaran (normal), segitiga (warning), belah ketupat (critical), `aria-hidden` |
| Varian `soft` (default) | `bg-<status>/16 text-<status>`; critical memakai `text-critical-fg` |
| Varian `solid` | `bg-<status> text-on-status`. Hanya untuk header NodeCard yang critical (penekanan tertinggi) |
| Gerak | Titik critical memakai `motion-safe:animate-beacon-fast` |
| Aksesibilitas | Teks status selalu terlihat. Saat status berubah, pengumuman dilakukan oleh **satu** region `role="status"` global (misalnya "Node A berubah menjadi Critical"), bukan oleh badge masing-masing |

**MweriBadge** adalah varian sejenis untuk kelas MWERI: tanpa bentuk, teks `RENDAH`/`SEDANG`/`TINGGI`/`KRITIS`, warna sesuai pemetaan §2.1.

### 4.3 NodeCard

Kartu melayang (drei `<Html>`) di atas beacon node.

```
┌────────────────────────────────────────┐ rounded-card, shadow-glow-<status>
│ ● NODE A · Transfer Point 1  ◆ CRITICAL│ text-heading + StatusBadge
│ MWERI    RESIDU    PM        PEKERJA   │ text-label text-fg-3
│ 8.4      72%       Tinggi    9/10      │ font-mono text-metric
│────────────────────────────────────────│ border-t line
│ Status sensor   ◆ CRITICAL (volume+PM) │ text-caption
│ Prioritas MWERI KRITIS · #1            │
│ Digital Twin: kritis dalam ±18 menit   │ text-caption text-fg-2
└────────────────────────────────────────┘
```

| Bagian | Spesifikasi |
|---|---|
| Wadah | `w-card-w bg-surface-0/95 rounded-card p-tile`, `shadow-glow-<status sensor>` |
| Header | Titik status, `text-heading text-fg`, lalu `StatusBadge` di kanan (`solid` jika critical, `soft` jika tidak) |
| Grid metrik | 4 kolom. Label `text-label uppercase text-fg-3`, nilai `font-mono text-metric text-fg` |
| Warna nilai MWERI | Mengikuti **kelas MWERI**, bukan status sensor |
| Baris status ganda (§13.2) | Dua baris terpisah: `Status sensor: <badge> (alasan)` dan `Prioritas MWERI: <MweriBadge> · #rank` |
| Prediksi | `text-caption text-fg-2`. Bila `ttc` null: "Tren stabil — belum ada proyeksi kritis" |
| Garis penunjuk | 1px dari kartu ke beacon dengan warna status 60% (digambar di scene, bukan CSS) |
| Mode ringkas | Default saat tidak dipilih: hanya header + MWERI. Mode penuh saat node dipilih atau critical |
| Interaksi | Klik membuka/fokus node. `<button>` dengan `aria-pressed`. Fokus keyboard memakai ring `accent` |
| Performa | Konten di-memo, hanya render ulang saat nilai yang dibulatkan berubah. Tanpa `occlude` |

**Contoh Node C:** header `▲ WARNING`, MWERI `2.6` berwarna `normal`, lalu baris "Status sensor: ▲ WARNING (volume)" dan "Prioritas MWERI: RENDAH · #3", serta catatan *"Residu tinggi, tetapi tidak ada pekerja di zona"*.

### 4.4 KPI tile

Satu metrik 3P di `ImpactPanel`.

```
┌──────────────┐
│ PEOPLE       │ text-label text-fg-2
│ ↓ −41%       │ font-mono text-metric + ikon arah
│ paparan      │ text-caption text-fg-3
└──────────────┘
```

| Bagian | Spesifikasi |
|---|---|
| Wadah | `bg-surface-1 rounded-tile p-tile shadow-raised`, 3 kolom rata |
| Nilai | `font-mono text-metric`, minus tipografis `−` (U+2212) |
| Arti warna | Membaik → `normal`, memburuk → `critical-fg`, netral → `fg`. Arah "baik" ditentukan per metrik: paparan turun itu baik, recovery naik itu baik |
| Selain warna | Ikon panah naik/turun (`aria-hidden`), ditambah teks tersembunyi "turun 41% dibanding reaktif" |
| Baseline | Caption menyebut pembandingnya: "vs reaktif". Bila baseline belum ada: `—` dengan caption "menunggu data" |
| Mode Compare | Dua angka bertumpuk (NiVORA di atas `text-metric`, Reaktif di bawah `text-caption text-fg-3`) |

### 4.5 Tabel routing

```
RUTE              D    R    O   COST
A · terpendek ✕   2    9    3    5.7    text-critical-fg
▌B · safe ✓       4    2    3    2.8    baris terpilih (tint safe)
C · alternatif    5    4    2    3.9
```

| Bagian | Spesifikasi |
|---|---|
| Struktur | `<table>` dengan `<caption class="sr-only">`, `<th scope="col">` |
| Header | `text-label uppercase text-fg-3`, border-bawah `line` |
| Baris | `h-row`, `text-body`. Kolom angka rata kanan `font-mono` |
| Rute terpilih (safe) | `bg-safe/10`, bar kiri 2px `safe`, label `text-safe font-semibold` + ikon centang, `aria-selected="true"` |
| Rute terpendek (bila ≠ terpilih) | Label `text-critical-fg` + ikon ✕ + kata "terpendek" |
| Rute terblokir | `text-fg-disabled line-through` + teks "terblokir" (tidak mengandalkan coret saja) |
| Skala | Total > 10 ditampilkan dinormalisasi 0–10 (§13.3), dengan catatan kaki `text-caption text-fg-3` |
| Perubahan | Saat rute terpilih berganti (Route Disruption), baris baru di-highlight `duration-slow`, lalu `role="status"` global mengumumkan "Rute dialihkan ke C" |

**Kotak rekomendasi** (tepat di bawah tabel): `bg-safe/10 border border-safe/40 rounded-tile p-tile shadow-glow-safe`. Judul `text-title uppercase text-safe`. Isi `text-body text-fg` yang selalu menjawab **kapan · prioritas · ke mana · lewat mana**. Nama entitas ditulis `font-semibold`.

### 4.6 Chip skenario

```
[ Normal Operation ] [▲ Production Surge ] [ Route Disruption ]
```

| Bagian | Spesifikasi |
|---|---|
| Semantik | `role="radiogroup"` dengan label "Skenario". Setiap chip `role="radio"` + `aria-checked`. Panah kiri/kanan memindahkan pilihan |
| Default | `h-control px-3 rounded-control bg-surface-1 border border-line-control text-fg-2 text-body whitespace-nowrap` |
| Hover | `bg-surface-2 text-fg`, transisi `duration-fast` |
| Terpilih | Warna sesuai nada skenario: Normal → `normal`, Surge → `warning`, Disruption → `critical-fg`. `bg-<tone>/16 border-<tone> text-<tone> font-semibold` + ikon bentuk status di kiri |
| Fokus | Ring `accent` 2px offset 2px (global) |
| Mode tur | Saat auto-tour berjalan, chip `aria-disabled` dengan tooltip yang bisa diakses keyboard: "Hentikan tur untuk memilih" |

### 4.7 Pathway step

Lima tahap Circular Material Decision Pathway. Kontennya memang berurutan, jadi pemisah chevron dipakai sebagai informasi.

```
[✓ Reuse / Reprocessing] › [Repurpose / Recycle] › [Recovery] › [Treatment] › [Safe Disposal]
Alasan: Karakteristik material masih memenuhi kebutuhan proses.
```

| Status step | Spesifikasi |
|---|---|
| Struktur | `<ol>`. Setiap step `<li>`. Chevron `aria-hidden` |
| Belum dievaluasi | `h-control px-3 rounded-control bg-surface-1 border border-line text-fg-3` |
| Dievaluasi, tidak layak | Seperti di atas + ikon ✕ kecil, `aria-label` "<tahap>: tidak layak" |
| **Aktif (terpilih)** | `bg-normal/16 border border-normal text-normal font-semibold` + ikon ✓, `aria-current="step"` |
| Aktif = Safe Disposal | Nada `warning`, karena ini pilihan terakhir dan perlu diperhatikan |
| Alasan | Satu baris di bawah: `text-caption text-fg-2`, diawali "Alasan:". Teks diambil dari `i18n.ts` |
| Konteks node | Prefiks kecil "Node A →" (`text-label text-fg-3`) saat beberapa node punya pathway berbeda; bisa diklik untuk berganti node |

---

## 5. Elemen pendukung (ringkas)

- **Chip pilar (Predict/Protect/Circulate):** `rounded-full h-control border-line-control bg-surface-1`. Pilar yang sedang bekerja di tick ini menyala `accent`.
- **Indikator LIVE:** `rounded-full`, titik `normal` dengan `motion-safe:animate-beacon` + `LIVE SIM · t = 14:32` (mono). Saat jeda: titik `fg-3` statis + "JEDA".
- **Legenda:** bentuk + warna + teks. Pekerja memakai kotak kecil `worker`.
- **Disclaimer:** `text-caption text-fg-3`. MWERI: *"MWERI adalah indeks prioritas, bukan instrumen diagnosis medis. Bobot perlu dikalibrasi data lapangan & ahli K3."* Footer: *"Visualisasi konsep · seluruh nilai bersifat ilustratif"*.
- **Grafik MWERI (recharts):** garis data `accent`, proyeksi putus-putus `critical-fg`, garis ambang putus-putus `critical/50` berlabel "ambang kritis 8.0", grid `line`, sumbu `text-label text-fg-3`. Throttle ±2 Hz, `isAnimationActive={false}`.

---

## 6. Checklist sebelum komponen dianggap selesai

- [ ] Hanya memakai token (tanpa hex mentah dan tanpa palet Tailwind bawaan, yang memang sudah di-reset di `@theme`).
- [ ] Status selalu = warna + bentuk + teks.
- [ ] Teks merah memakai `critical-fg`. Label di wadah ber-tint memakai `fg-2`. Tidak ada tint di atas `surface-2`.
- [ ] Ukuran teks ≥ 12px. Angka memakai `font-mono` (otomatis `tabular-nums`).
- [ ] Kontrol: target ≥ 32px, batas `line-control`, fokus terlihat, bisa dioperasikan keyboard.
- [ ] Animasi berulang memakai `motion-safe:`.
- [ ] Perubahan penting diumumkan oleh satu region `role="status"`, bukan oleh setiap badge.
- [ ] Tanpa `backdrop-filter` di atas canvas.
