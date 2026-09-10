import { scoreMatch } from './scoring.js';

const ordinal = place => place === 1 ? '1re place' : `${place}e place`;

export function buildMatchRows(matches, players) {
  const byId = new Map(players.map(player => [player.id, player]));
  return [...matches].sort((a, b) => new Date(b.date) - new Date(a.date) || b.id.localeCompare(a.id)).map(match => {
    const points = scoreMatch(match);
    if (match.format === 'ffa') {
      return {
        ...match,
        groups: [],
        results: match.placements.map((id, index) => ({ id, label: ordinal(index + 1), player: byId.get(id), points: points[id] }))
      };
    }
    return {
      ...match,
      results: [],
      groups: match.teams.map((team, index) => ({
        index: index + 1,
        label: match.format === '4v4'
          ? (team.outcome === 'win' ? 'Victoire' : 'Défaite')
          : ordinal(team.placement),
        placement: team.placement,
        outcome: team.outcome,
        members: team.players.map(id => ({ id, player: byId.get(id), points: points[id] }))
      }))
    };
  });
}

export function buildAchievements(catalog, unlocks, players) {
  const unlocked = new Set(unlocks.map(unlock => `${unlock.achievementId}:${unlock.playerId}`));
  return catalog.map(achievement => ({
    ...achievement,
    players: players.map(player => ({
      player,
      unlocked: unlocked.has(`${achievement.id}:${player.id}`)
    }))
  }));
}
