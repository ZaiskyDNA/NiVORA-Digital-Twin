/**
 * Label scene yang dibangun ulang hanya bila teks/warnanya berubah. Dipakai terpisah oleh
 * LabelLeaders (di dalam Canvas) dan LabelLayer (DOM) agar PlantScene sendiri tidak pernah
 * re-render — re-render PlantScene sempat memicu ContactShadows merender ulang seluruh scene.
 */
import { useMemo } from 'react';
import { selectViewed, useSim } from '../store/useSim';
import { buildRouteLabels, buildSceneLabels, sceneLabelKey, type SceneLabel } from './sceneLabels';

export function useSceneLabels(): readonly SceneLabel[] {
  const key = useSim((s) => sceneLabelKey(selectViewed(s)));
  return useMemo(() => {
    void key;
    const s = selectViewed(useSim.getState());
    return [...buildSceneLabels(s.nodes), ...buildRouteLabels(s)];
  }, [key]);
}
