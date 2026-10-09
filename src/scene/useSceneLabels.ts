/**
 * Label scene yang dibangun ulang hanya bila teks/warnanya berubah. Dipakai terpisah oleh
 * LabelLeaders (di dalam Canvas) dan LabelLayer (DOM) agar PlantScene sendiri tidak pernah
 * re-render — re-render PlantScene sempat memicu ContactShadows merender ulang seluruh scene.
 */
import { useMemo } from 'react';
import { UI_TEXT_MS, useThrottledSim } from '../ui/hooks';
import { selectViewed, useSim, type SimStore } from '../store/useSim';
import { useView } from '../store/useView';
import { buildRouteLabels, buildSceneLabels, sceneLabelKey, type SceneLabel } from './sceneLabels';

const selectKey = (s: SimStore) => sceneLabelKey(selectViewed(s));

export function useSceneLabels(): readonly SceneLabel[] {
  const key = useThrottledSim(selectKey, UI_TEXT_MS);
  const selected = useView((s) => s.selected);
  return useMemo(() => {
    void key;
    const s = selectViewed(useSim.getState());
    return [...buildSceneLabels(s.nodes, selected), ...buildRouteLabels(s)];
  }, [key, selected]);
}
