import type { CountryCode } from './matchmaking';
export type Profile = {
  id: string; discord_username: string; smash_tag: string; country: CountryCode;
  has_lan: boolean; elo: number; accept_cross_region: boolean; wins: number; losses: number;
};
export type Match = {
  id: string; player1_id: string; player2_id: string;
  status: 'rps' | 'striking' | 'playing' | 'disputed' | 'completed';
  arena_id: string | null; arena_pass: string | null; turn_user_id: string | null;
  banned_stages: string[]; selected_stage: string | null; p1_score: number; p2_score: number;
  winner_id: string | null; rps_p1: string | null; rps_p2: string | null; game_no: number;
  first_banner_id: string | null; game_winner_id: string | null;
  report_p1: string | null; report_p2: string | null;
};
