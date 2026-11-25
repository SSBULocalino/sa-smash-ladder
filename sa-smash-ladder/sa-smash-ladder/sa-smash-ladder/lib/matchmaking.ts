export type CountryCode = 'CL' | 'PE' | 'UY' | 'VE' | 'BR' | 'CO' | 'EC' | 'AR' | 'PY' | 'BO';

export function getNetworkNode(country: CountryCode): 'SUR' | 'NORTE' {
  const nodoSur: CountryCode[] = ['CL', 'AR', 'UY', 'PY', 'BO', 'BR'];
  return nodoSur.includes(country) ? 'SUR' : 'NORTE';
}

export function canMatchPlayers(
  p1: { elo: number; node: string; accept_cross_region: boolean; joined_at: string },
  p2: { elo: number; node: string; accept_cross_region: boolean; joined_at: string }
): boolean {
  const sameNode = p1.node === p2.node;
  const bothAllowCross = p1.accept_cross_region && p2.accept_cross_region;
  if (!sameNode && !bothAllowCross) return false;

  const waitSeconds = Math.max(
    (Date.now() - new Date(p1.joined_at).getTime()) / 1000,
    (Date.now() - new Date(p2.joined_at).getTime()) / 1000
  );
  const maxEloDiff = 150 + Math.floor(waitSeconds / 30) * 50;

  return Math.abs(p1.elo - p2.elo) <= maxEloDiff;
}

export function calculateNewElo(winnerElo: number, loserElo: number) {
  const kFactor = 32;
  const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const expectedLoser = 1 / (1 + Math.pow(10, (winnerElo - loserElo) / 400));

  return {
    newWinnerElo: Math.round(winnerElo + kFactor * (1 - expectedWinner)),
    newLoserElo: Math.round(loserElo + kFactor * (0 - expectedLoser)),
  };
}
