import { beforeEach, describe, expect, it } from 'vitest';
import { useSim } from '../../store/useSim';
import { useTour } from '../../store/useTour';
import { useView } from '../../store/useView';
import { kpiTiles } from '../../ui/viewModels';
import { finishTour, pauseTour, resumeTour, startTour, stopTour, TOUR, TOUR_TOTAL_MS } from '../tour';

const sim = () => useSim.getState();
const view = () => useView.getState();

describe('naskah auto-tour', () => {
  it('total 60 detik dengan urutan sesuai brief', () => {
    expect(TOUR_TOTAL_MS).toBe(60_000);
    expect(TOUR.map((s) => s.id)).toEqual(['overview', 'normal', 'surge', 'nodeA', 'route', 'disruption', 'kpi']);
  });

  it('setiap langkah punya keterangan yang tidak kosong', () => {
    for (const s of TOUR) expect(s.caption().length).toBeGreaterThan(20);
  });
});

describe('menjalankan langkah berurutan', () => {
  beforeEach(() => {
    sim().pause();
    view().setCompareMode(false);
    view().selectNode(null);
  });

  it('menampilkan alur Predict → Protect → Circulate → perbandingan', async () => {
    const run = async (id: (typeof TOUR)[number]['id']) => {
      await TOUR.find((s) => s.id === id)!.enter();
      sim().tick(10); // jeda waktu antarlangkah (dipadatkan)
    };

    await run('overview');
    expect(sim().nivora.scenarioId).toBe('normal');
    expect(view().focusMode).toBe(true);

    await run('normal');
    await run('surge');
    expect(sim().nivora.scenarioId).toBe('surge');

    await TOUR.find((s) => s.id === 'nodeA')!.enter();
    expect(sim().nivora.nodes.find((n) => n.id === 'A')?.status).toBe('critical');
    // Kartu Rekomendasi harus selaras dengan narasi "Node A critical".
    expect(sim().nivora.recommendation).toMatchObject({ nodeId: 'A', urgency: 'now' });
    expect(view().selected).toBe('A');
    expect(view().whatIf?.trajectories.A).toHaveLength(31);

    await run('route');
    expect(view().preset).toBe('route');
    expect(sim().nivora.recommendation?.selectedCandidate).toBe('B');

    await TOUR.find((s) => s.id === 'disruption')!.enter();
    expect(sim().nivora.scenarioId).toBe('disruption');
    expect(sim().nivora.recommendation?.selectedCandidate).toBe('C');

    await TOUR.find((s) => s.id === 'kpi')!.enter();
    expect(view().compareMode).toBe(true);
    expect(sim().nivora.t).toBeGreaterThan(240);
    const [people] = kpiTiles(sim().nivora, sim().reactive);
    expect(people?.trend).toBe('better'); // dosis paparan NiVORA < reaktif
    // Tes ini memadatkan waktu antarlangkah, jadi trip terjadwal reaktif belum tentu terjadi:
    // cukup pastikan tidak ada KPI yang lebih buruk dan semuanya sudah bernilai.
    for (const t of kpiTiles(sim().nivora, sim().reactive)) {
      expect(t.value, t.key).not.toBe('—');
      expect(t.trend, t.key).not.toBe('worse');
    }
  });

  it('dapat direproduksi: overview selalu memulai state identik, apa pun kondisi sebelumnya', async () => {
    await TOUR[0]!.enter();
    const a = structuredClone(sim().nivora);
    // Ubah kondisi sebanyak mungkin: skenario lain, bobot lain, waktu berjalan.
    sim().setScenario('disruption');
    sim().setWeights({ route: { alpha: 1, beta: 0, gamma: 0 } });
    sim().tick(30);
    await TOUR[0]!.enter();
    expect(sim().nivora).toEqual(a);
  });
});

describe('kontrol runner', () => {
  it('start / jeda / lanjut / selesai / berhenti', () => {
    startTour();
    expect(useTour.getState()).toMatchObject({ active: true, index: 0, paused: false });
    pauseTour();
    expect(useTour.getState().paused).toBe(true);
    expect(sim().running).toBe(false);
    resumeTour();
    expect(useTour.getState().paused).toBe(false);
    finishTour();
    expect(useTour.getState().index).toBe(TOUR.length);
    stopTour();
    expect(useTour.getState().active).toBe(false);
    expect(view().focusMode).toBe(false);
  });
});
