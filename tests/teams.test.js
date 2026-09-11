import test from 'node:test';
import assert from 'node:assert/strict';
import { generateBalancedTeams, generateRandomTeams } from '../lib/teams.js';

const players = Array.from({ length: 8 }, (_, index) => ({
  id: `p${index + 1}`,
  name: `Player ${index + 1}`,
  score: 8 - index
}));

const sequenceRng = values => {
  let index = 0;
  return () => values[index++ % values.length];
};

test('random mode produces complete teams of the requested size', () => {
  const teams = generateRandomTeams(players, 2, sequenceRng([0.1, 0.8, 0.3, 0.6]));
  assert.equal(teams.length, 4);
  assert.ok(teams.every(team => team.length === 2));
  assert.deepEqual(new Set(teams.flat().map(player => player.id)), new Set(players.map(player => player.id)));
});

test('balanced mode pairs the highest ranked players with the lowest ranked players', () => {
  const teams = generateBalancedTeams(players, 2, () => 0.5);
  assert.deepEqual(teams.map(team => team.map(player => player.id)), [
    ['p1', 'p8'], ['p2', 'p7'], ['p3', 'p6'], ['p4', 'p5']
  ]);
});

test('balanced mode distributes ranked players evenly between two squads', () => {
  const teams = generateBalancedTeams(players, 4, () => 0.5);
  assert.deepEqual(teams.map(team => team.map(player => player.id)), [
    ['p1', 'p4', 'p5', 'p8'], ['p2', 'p3', 'p6', 'p7']
  ]);
  assert.deepEqual(teams.map(team => team.reduce((sum, player) => sum + player.score, 0)), [18, 18]);
});

test('balanced mode randomizes players tied on score before distributing them', () => {
  const tied = players.map(player => ({ ...player, score: 0 }));
  const first = generateBalancedTeams(tied, 2, () => 0).flat().map(player => player.id);
  const second = generateBalancedTeams(tied, 2, () => 0.999).flat().map(player => player.id);
  assert.notDeepEqual(first, second);
});
