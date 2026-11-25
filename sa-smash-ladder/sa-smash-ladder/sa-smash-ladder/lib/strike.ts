import { SA_STAGES } from './stages';
import type { Match } from './types';

type S = Pick<Match, 'game_no' | 'banned_stages' | 'first_banner_id' | 'game_winner_id' | 'player1_id' | 'player2_id'>;
export type Strike = { actor: string | null; kind: 'ban' | 'pick' | 'done'; left: number };

/** Juego 1: orden 1-2-1 sobre 5 starters. Juegos 2-3: ganador banea 3, perdedor elige. */
export function strikeState(m: S): Strike {
  const other = (id: string | null) => (id === m.player1_id ? m.player2_id : m.player1_id);
  const n = m.banned_stages.length;
  if (m.game_no === 1) {
    const a = m.first_banner_id, b = other(a);
    if (n === 0) return { actor: a, kind: 'ban', left: 1 };
    if (n < 3) return { actor: b, kind: 'ban', left: 3 - n };
    if (n === 3) return { actor: a, kind: 'ban', left: 1 };
    return { actor: null, kind: 'done', left: 0 };
  }
  const w = m.game_winner_id;
  if (n < 3) return { actor: w, kind: 'ban', left: 3 - n };
  return { actor: other(w), kind: 'pick', left: 1 };
}

export const stagePool = (gameNo: number) =>
  SA_STAGES.filter((s) => gameNo > 1 || s.type === 'starter').map((s) => s.id);
