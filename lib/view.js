import { scoreMatch } from './scoring.js';

const ordinal = place => place === 1 ? '1re place' : `${place}e place`;

export function buildMatchRows(matches, players) {
  const byId = new Map(players.map(player => [player.id, player]));
  return [...matches].sort((a, b) => new Date(b.date) - new Date(a.date)).map(match => {
    const points = scoreMatch(match);
    let details;
    if (match.format === 'ffa') {
      details = match.placements.map((id, index) => ({ id, label: ordinal(index + 1) }));
    } else {
      details = match.teams.flatMap(team => team.players.map(id => ({
        id,
        label: match.format === '4v4'
          ? `${team.outcome === 'win' ? 'Victoire' : 'Défaite'} · ${team.name}`
          : `${ordinal(team.placement)} · ${team.name}`
      })));
    }
    return {
      ...match,
      results: details.map(result => ({ ...result, player: byId.get(result.id), points: points[result.id] }))
    };
  });
}

export function groupAchievements(catalog, unlocks, players) {
  const byId = new Map(players.map(player => [player.id, player]));
  const groups = [];
  for (const achievement of catalog) {
    let group = groups.find(candidate => candidate.name === achievement.group);
    if (!group) {
      group = { name: achievement.group, items: [] };
      groups.push(group);
    }
    group.items.push({
      ...achievement,
      players: unlocks.filter(unlock => unlock.achievementId === achievement.id).map(unlock => byId.get(unlock.playerId)).filter(Boolean)
    });
  }
  return groups;
}
