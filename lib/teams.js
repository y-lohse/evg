function validateRoster(players, teamSize) {
  if (!Array.isArray(players) || players.length === 0) throw new Error('Une liste de joueurs est requise');
  if (![2, 4].includes(teamSize)) throw new Error("La taille d'équipe doit être 2 ou 4");
  if (players.length % teamSize !== 0) throw new Error("Le nombre de joueurs doit être divisible par la taille d'équipe");
}

function shuffle(items, rng) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(rng() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

export function generateRandomTeams(players, teamSize, rng = Math.random) {
  validateRoster(players, teamSize);
  const shuffled = shuffle(players, rng);
  return Array.from({ length: players.length / teamSize }, (_, index) =>
    shuffled.slice(index * teamSize, (index + 1) * teamSize)
  );
}

export function generateBalancedTeams(players, teamSize, rng = Math.random) {
  validateRoster(players, teamSize);
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const ranked = [];
  for (let start = 0; start < sorted.length;) {
    let end = start + 1;
    while (end < sorted.length && sorted[end].score === sorted[start].score) end += 1;
    ranked.push(...shuffle(sorted.slice(start, end), rng));
    start = end;
  }

  if (teamSize === 2) {
    return ranked.slice(0, ranked.length / 2).map((player, index) => [player, ranked.at(-1 - index)]);
  }

  const teams = [[], []];
  const assignment = [0, 1, 1, 0, 0, 1, 1, 0];
  ranked.forEach((player, index) => teams[assignment[index]].push(player));
  return teams;
}
