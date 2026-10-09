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
  /** 'card' = NodeCard (dirender NodeCardLayer); default label callout. */
  kind?: 'label' | 'card';
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
  'zone-wz-high': [-4, 1.5],
};

const NODE_CARD_ALIGN: Record<string, LabelAlign> = { A: 'below', B: 'right', C: 'below' };

const place = (id: string, anchor: Vec3, fallbackUp = 3): Vec3 => {
  const [right, up] = LABEL_OFFSET[id] ?? [0, fallbackUp];
  return offsetOnScreen(anchor, right, up);
};

/** Puncak bangunan — smelter memperhitungkan cerobong. */
const topOf = (f: Facility): number => (f.kind === 'smelter' ? f.size[1] * 1.75 : f.size[1]);

export function buildSceneLabels(nodes: readonly NodeState[], selected: string | null = null): SceneLabel[] {
  const facilities = FACILITIES.map((f): SceneLabel => {
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
  const zoneLabels: SceneLabel[] = zoneAnchor
    ? [
        {
          id: 'zone-wz-high',
          anchor: zoneAnchor,
          at: place('zone-wz-high', zoneAnchor),
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

/** Titik tengah ruas ke-`which` sebuah rute ('mid' = ruas tengah) — posisi label. */
function midpoint(route: Route, which: 'first' | 'mid' = 'mid'): Vec3 | null {
  const i = which === 'first' ? 0 : Math.floor((route.vertices.length - 1) / 2);
  const a = VERTEX_POS[route.vertices[i] ?? ''];
  const b = VERTEX_POS[route.vertices[i + 1] ?? ''];
  if (!a || !b) return null;
  return [(a[0] + b[0]) / 2, ROUTE_Y, (a[2] + b[2]) / 2];
}

/** Label rute terpilih & rute terpendek (bila berbeda) — biaya komposit dengan bobot saat ini. */
export function buildRouteLabels(s: SimState): SceneLabel[] {
  const rec = s.recommendation;
  if (!rec) return [];
  const cost = compositeCost(s.weights.route);
  const costOf = (r: Route) => r.edges.reduce((sum, e) => sum + cost(e), 0).toFixed(1);
  const out: SceneLabel[] = [];
  const same = rec.route && rec.shortest && rec.route.vertices.join() === rec.shortest.vertices.join();

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
  if (rec.shortest && (s.policy !== 'nivora' || !same)) {
    // Ruas pertama (menembus zona pekerja) agar tidak bertumpuk dengan label safe route.
    const at = midpoint(rec.shortest, 'first');
    if (at) {
      out.push({
        id: 'route-shortest',
        anchor: at,
        at: offsetOnScreen(at, 1, 1),
        title: ROUTE_LABEL.shortest(candidateOf(rec.shortest), costOf(rec.shortest)),
        color: COLOR.critical,
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
  return `${statuses}#${workers}#${routes}`;
}
