/** Data label callout scene (fasilitas, node, zona) — dirender oleh LabelLayer + LabelLeaders. */
import { FACILITY_CAPTION, FACILITY_LABEL, ROUTE_LABEL, ZONE_LABEL } from '../config/i18n';
import { FACILITIES, ROUTE_CANDIDATES, WORKER_ZONES, type Facility } from '../config/plant';
import type { SimState } from '../sim/engine';
import { compositeCost, type Route } from '../sim/routing';
import type { NodeState, Vec3 } from '../sim/types';
import { COLOR } from '../styles/tokens';
import { beaconHeight, offsetOnScreen, ROUTE_Y, VERTEX_POS } from './layout';
import { FACILITY_STYLE, STATUS_COLOR } from './palette';

export interface SceneLabel {
  id: string;
  /** Titik yang ditunjuk. */
  anchor: Vec3;
  /** Titik kotak label (ujung atas garis penunjuk). */
  at: Vec3;
  title: string;
  caption?: string;
  color: string;
  /**
   * 'card' = NodeCard lengkap, 'pill' = ringkasan node kecil (keduanya dirender NodeCardLayer);
   * default = label callout.
   */
  kind?: 'label' | 'card' | 'pill';
  /** Sisi kotak yang menempel ke titik `at`. Default: kotak di atas titik. */
  align?: LabelAlign;
}

export type LabelAlign = 'above' | 'below' | 'right' | 'left';

/**
 * Geseran label (kanan, atas) dalam unit dunia arah layar — meniru tata letak callout pada
 * docs/reference.png dan mencegah label saling tumpuk.
 */
const LABEL_OFFSET: Record<string, [number, number]> = {
  'facility-smelter': [-7, 5],
  'facility-recovery': [6, 3],
  'facility-reprocessing': [3, 3.5],
  'facility-treatment': [5, 3],
  'facility-disposal': [-4, 4],
  'facility-crusher': [-6, 1],
  'facility-stockpile': [8, 1.5],
  // NodeCard: A kiri-bawah & B kanan seperti referensi; C di bawah tiang agar tidak tertutup panel kanan.
  'node-A': [-7, -12],
  'node-B': [9, 3],
  'node-C': [3, -6],
  // Di bawah-kiri zona: menjauh dari label safe route & pill Node A di atasnya.
  'zone-wz-high': [-8, -2.5],
};

const NODE_CARD_ALIGN: Record<string, LabelAlign> = { A: 'below', B: 'right', C: 'below' };

const place = (id: string, anchor: Vec3, fallbackUp = 3): Vec3 => {
  const [right, up] = LABEL_OFFSET[id] ?? [0, fallbackUp];
  return offsetOnScreen(anchor, right, up);
};

/** Puncak bangunan — smelter memperhitungkan cerobong. */
const topOf = (f: Facility): number => (f.kind === 'smelter' ? f.size[1] * 1.75 : f.size[1]);

export interface SceneLabelOptions {
  /** Node yang dibuka detailnya. */
  selected?: string | null;
  /** Fasilitas yang sedang di-hover — labelnya ditampilkan. */
  hoveredFacility?: string | null;
  /** Fasilitas tujuan rute aktif — labelnya selalu tampil. */
  destination?: string | null;
  /** Node prioritas #1 yang critical — otomatis tampil sebagai kartu lengkap. */
  autoCard?: string | null;
  /**
   * Ponsel: hanya pill node — label fasilitas/zona dan kartu melayang tidak muat; detail node
   * dan rekomendasi pindah ke bottom sheet.
   */
  mobile?: boolean;
}

/**
 * Progressive disclosure (declutter): label fasilitas hanya untuk tujuan rute aktif & fasilitas
 * yang di-hover; node tampil sebagai pill kecil kecuali yang dipilih atau prioritas #1 yang critical.
 */
export function buildSceneLabels(nodes: readonly NodeState[], opts: SceneLabelOptions = {}): SceneLabel[] {
  const { selected = null, hoveredFacility = null, destination = null, autoCard = null, mobile = false } = opts;
  const visibleFacilities = mobile ? [] : FACILITIES.filter((f) => f.id === hoveredFacility || f.id === destination);
  const facilities = visibleFacilities.map((f): SceneLabel => {
    const id = `facility-${f.id}`;
    const anchor: Vec3 = [f.position[0], topOf(f), f.position[2]];
    return {
      id,
      anchor,
      at: place(id, anchor),
      title: FACILITY_LABEL[f.id] ?? f.id,
      caption: FACILITY_CAPTION[f.id],
      color: FACILITY_STYLE[f.kind].edge,
    };
  });

  const nodeLabels = nodes.map((n): SceneLabel => {
    const id = `node-${n.id}`;
    const anchor: Vec3 = [n.position[0], beaconHeight(n.id) + 0.5, n.position[2]];
    const isSelected = n.id === selected;
    const full = !mobile && (isSelected || (selected === null && n.id === autoCard));
    if (!full) {
      // Pill kecil tepat di atas beacon.
      return {
        id,
        anchor,
        at: offsetOnScreen(anchor, 0, 1.4),
        title: `Node ${n.id}`,
        color: STATUS_COLOR[n.status],
        kind: 'pill',
        align: 'above',
      };
    }
    return {
      id,
      anchor,
      // Kartu detail node terpilih menempel di kanan beacon (kamera fokus menyisakan ruang di sana).
      at: isSelected ? offsetOnScreen(anchor, 2.5, -1) : place(id, anchor),
      title: `Node ${n.id} · ${n.name}`,
      color: STATUS_COLOR[n.status],
      kind: 'card',
      align: isSelected ? 'right' : (NODE_CARD_ALIGN[n.id] ?? 'above'),
    };
  });

  const zone = WORKER_ZONES.find((z) => z.id === 'wz-high');
  const zoneWorkers = nodes.find((n) => n.zoneId === 'wz-high')?.workers ?? 0;
  // Sudut kiri-depan zona (dari sudut pandang isometrik).
  const zoneAnchor: Vec3 | null = zone
    ? [zone.center[0] - zone.size[0] / 2 + 0.5, 0.05, zone.center[2] + zone.size[1] / 2 - 0.5]
    : null;
  const zoneLabels: SceneLabel[] = zoneAnchor && !mobile
    ? [
        {
          id: 'zone-wz-high',
          anchor: zoneAnchor,
          at: place('zone-wz-high', zoneAnchor),
          align: 'below',
          title: ZONE_LABEL.high,
          caption: ZONE_LABEL.workersDetected(zoneWorkers),
          color: COLOR.critical,
        },
      ]
    : [];

  return [...facilities, ...nodeLabels, ...zoneLabels];
}

/** Id kandidat Lampiran 7 (A/B/C) bila urutan vertex rute sama persis. */
function candidateOf(route: Route): string | null {
  for (const [id, vertices] of Object.entries(ROUTE_CANDIDATES)) {
    if (vertices.length === route.vertices.length && vertices.every((v, i) => v === route.vertices[i])) return id;
  }
  return null;
}

/** Titik tengah ruas tengah sebuah rute — posisi label. */
function midpoint(route: Route): Vec3 | null {
  const i = Math.floor((route.vertices.length - 1) / 2);
  const a = VERTEX_POS[route.vertices[i] ?? ''];
  const b = VERTEX_POS[route.vertices[i + 1] ?? ''];
  if (!a || !b) return null;
  return [(a[0] + b[0]) / 2, ROUTE_Y, (a[2] + b[2]) / 2];
}

/**
 * Hanya rute terpilih yang diberi label (declutter). Rute terpendek cukup berupa garis merah
 * putus-putus; artinya dijelaskan di legenda.
 */
export function buildRouteLabels(s: SimState): SceneLabel[] {
  const rec = s.recommendation;
  if (!rec) return [];
  const cost = compositeCost(s.weights.route);
  const costOf = (r: Route) => r.edges.reduce((sum, e) => sum + cost(e), 0).toFixed(1);
  const out: SceneLabel[] = [];

  if (rec.route && s.policy === 'nivora') {
    const at = midpoint(rec.route);
    if (at) {
      out.push({
        id: 'route-safe',
        anchor: at,
        at: offsetOnScreen(at, -8, 0.8),
        title: rec.route.edges.some((e) => e.zoneId)
          ? ROUTE_LABEL.chosenInZone(candidateOf(rec.route), costOf(rec.route))
          : ROUTE_LABEL.safe(candidateOf(rec.route), costOf(rec.route)),
        color: COLOR.safe,
      });
    }
  }
  return out;
}

/** Kunci perubahan label (status node, pekerja zona, rute & biaya) — selector store yang stabil. */
export function sceneLabelKey(s: SimState): string {
  const statuses = s.nodes.map((n) => n.status).join(',');
  const workers = s.nodes.find((n) => n.zoneId === 'wz-high')?.workers ?? 0;
  const routes = buildRouteLabels(s)
    .map((l) => l.title)
    .join('|');
  const top = s.nodes.find((n) => n.id === s.ranking[0]);
  const autoCard = top?.status === 'critical' ? top.id : '';
  return `${statuses}#${workers}#${routes}#${s.recommendation?.destination ?? ''}#${autoCard}`;
}
