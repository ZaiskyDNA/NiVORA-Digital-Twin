/**
 * Edge-AI (rule-based mock) — klasifikasi status sensor (§5.2).
 * Dijalankan SETELAH MWERI dihitung pada tick yang sama (§13.2).
 */
import { EDGE_AI_THRESHOLDS } from '../config/thresholds';
import type { EdgeAIReason, Status } from './types';

export type { EdgeAIReason };

export interface EdgeAIInput {
  residueLevel: number;
  pm: number; // skor 0–10
  mweri: number;
  /** Kemiringan tren residueLevel (% per menit); null bila belum cukup data. */
  levelSlope: number | null;
}

export interface EdgeAIResult {
  status: Status;
  reasons: EdgeAIReason[];
}

export function classifyStatus(input: EdgeAIInput, th = EDGE_AI_THRESHOLDS): EdgeAIResult {
  const critical: EdgeAIReason[] = [];
  if (input.residueLevel >= th.criticalLevel) critical.push('volume');
  if (input.pm >= th.criticalPm) critical.push('pm');
  if (input.mweri >= th.criticalMweri) critical.push('mweri');
  if (critical.length > 0) return { status: 'critical', reasons: critical };

  const warning: EdgeAIReason[] = [];
  if (input.residueLevel >= th.warningLevel) warning.push('volume');
  if (input.pm >= th.warningPm) warning.push('pm');
  if (input.levelSlope !== null && input.levelSlope > th.warningLevelSlope) warning.push('trend');
  if (warning.length > 0) return { status: 'warning', reasons: warning };

  return { status: 'normal', reasons: [] };
}
