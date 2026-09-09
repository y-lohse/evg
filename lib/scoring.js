const FFA_POINTS = [5, 3, 2, 1, 1, 0, 0, 0];
const TEAM_POINTS = { 1: 3, 2: 2, 3: 1, 4: 0 };

function assertUniquePlayers(ids, matchId) {
  if (new Set(ids).size !== ids.length) throw new Error(`${matchId}: duplicate player`);
}

export function scoreMatch(match) {
  if (!match?.id || !match?.format) throw new Error('Match id and format are required');
  if (match.format === 'ffa') {
    if (!Array.isArray(match.placements) || match.placements.length !== 8) throw new Error(`${match.id}: FFA requires 8 placements`);
    assertUniquePlayers(match.placements, match.id);
    return Object.fromEntries(match.placements.map((id, index) => [id, FFA_POINTS[index]]));
  }
  if (match.format === '2v2v2v2') {
    if (!Array.isArray(match.teams) || match.teams.length !== 4) throw new Error(`${match.id}: 2v2v2v2 requires four teams`);
    const ids = match.teams.flatMap(team => team.players ?? []);
    if (ids.length !== 8 || match.teams.some(team => team.players?.length !== 2)) throw new Error(`${match.id}: each team requires two players`);
    assertUniquePlayers(ids, match.id);
    const placements = match.teams.map(team => team.placement);
    if (new Set(placements).size !== 4 || placements.some(value => !TEAM_POINTS.hasOwnProperty(value))) throw new Error(`${match.id}: invalid team placements`);
    return Object.fromEntries(match.teams.flatMap(team => team.players.map(id => [id, TEAM_POINTS[team.placement]])));
  }
  if (match.format === '4v4') {
    if (!Array.isArray(match.teams) || match.teams.length !== 2) throw new Error(`${match.id}: 4v4 requires two teams`);
    if (match.teams.some(team => team.players?.length !== 4) || !match.teams.some(team => team.outcome === 'win') || !match.teams.some(team => team.outcome === 'loss')) throw new Error(`${match.id}: 4v4 requires winner and loser teams of four`);
    const ids = match.teams.flatMap(team => team.players);
    assertUniquePlayers(ids, match.id);
    return Object.fromEntries(match.teams.flatMap(team => team.players.map(id => [id, team.outcome === 'win' ? 2 : 1])));
  }
  throw new Error(`Unsupported format: ${match.format}`);
}

export function buildLeaderboard(players, matches) {
  const totals = new Map(players.map(player => [player.id, 0]));
  for (const match of matches) {
    for (const [id, points] of Object.entries(scoreMatch(match))) {
      if (!totals.has(id)) throw new Error(`${match.id}: unknown player ${id}`);
      totals.set(id, totals.get(id) + points);
    }
  }
  return players.map(player => ({ ...player, score: totals.get(player.id) }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
}
