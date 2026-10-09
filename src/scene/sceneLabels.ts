/** Data label callout scene (fasilitas, node, zona) — dirender oleh LabelLayer + LabelLeaders. */
import { FACILITY_CAPTION, FACILITY_LABEL, ZONE_LABEL } from '../config/i18n';
import { FACILITIES, WORKER_ZONES, type Facility } from '../config/plant';
import type { NodeState, Vec3 } from '../sim/types';
import { COLOR } from '../styles/tokens';
import { beaconHeight, offsetOnScreen } from './layout';
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
}

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
  'node-A': [4, 3],
  'node-B': [5, 3],
  'node-C': [6, 2],
  'zone-wz-high': [-4, 1.5],
};

const place = (id: string, anchor: Vec3, fallbackUp = 3): Vec3 => {
  const [right, up] = LABEL_OFFSET[id] ?? [0, fallbackUp];
  return offsetOnScreen(anchor, right, up);
};

/** Puncak bangunan — smelter memperhitungkan cerobong. */
const topOf = (f: Facility): number => (f.kind === 'smelter' ? f.size[1] * 1.75 : f.size[1]);

export function buildSceneLabels(nodes: readonly NodeState[]): SceneLabel[] {
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
    return {
      id,
      anchor,
      at: place(id, anchor),
      title: `Node ${n.id} · ${n.name}`,
      color: STATUS_COLOR[n.status],
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
