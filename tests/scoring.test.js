import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreMatch, buildLeaderboard, buildRankTrends } from '../lib/scoring.js';

const players = ['whyl', 'bayboushe', 'maf', 'clowrid', 'gruntzy', 'linkthepomme', 'abyssou', 'mino'];

test('FFA awards 5,3,2,1,1,0,0,0 by placement', () => {
  const match = { id: 'm1', format: 'ffa', placements: players };
  assert.deepEqual(scoreMatch(match), Object.fromEntries(players.map((id, i) => [id, [5,3,2,1,1,0,0,0][i]])));
});

test('2v2v2v2 awards 3,2,1,0 to every player by team placement', () => {
  const match = { id: 'm2', format: '2v2v2v2', teams: [
    { placement: 1, players: ['whyl','maf'] }, { placement: 2, players: ['mino','abyssou'] },
    { placement: 3, players: ['clowrid','gruntzy'] }, { placement: 4, players: ['bayboushe','linkthepomme'] }
  ]};
  assert.deepEqual(scoreMatch(match), { whyl:3, maf:3, mino:2, abyssou:2, clowrid:1, gruntzy:1, bayboushe:0, linkthepomme:0 });
});

test('4v4 awards two to winners and one to losers', () => {
  const match = { id: 'm3', format: '4v4', teams: [
    { outcome: 'win', players: players.slice(0,4) }, { outcome: 'loss', players: players.slice(4) }
  ]};
  assert.deepEqual(scoreMatch(match), Object.fromEntries(players.map((id, i) => [id, i < 4 ? 2 : 1])));
});

test('leaderboard accumulates raw matches and sorts score descending then name', () => {
  const roster = players.map(id => ({ id, name: id }));
  const matches = [
    { id:'m1', format:'ffa', placements: players },
    { id:'m2', format:'4v4', teams:[{outcome:'win',players:players.slice(4)},{outcome:'loss',players:players.slice(0,4)}] }
  ];
  const board = buildLeaderboard(roster, matches);
  assert.equal(board[0].id, 'whyl');
  assert.equal(board[0].score, 6);
  assert.equal(board.at(-1).score, 2);
  assert.equal(board.length, 8);
});

test('malformed results are rejected', () => {
  assert.throws(() => scoreMatch({ id:'bad', format:'ffa', placements:['whyl'] }), /8 placements/);
  assert.throws(() => scoreMatch({ id:'bad2', format:'4v4', teams:[] }), /two teams/);
  assert.throws(() => scoreMatch({ id:'bad3', format:'unknown' }), /Unsupported format/);
});

test('rank trends compare current standings with standings before the last three chronological results', () => {
  const roster = players.map(id => ({ id, name: id }));
  const matches = [
    { id:'latest', date:'2026-09-19T15:00:00Z', format:'ffa', placements:['mino','abyssou','linkthepomme','gruntzy','clowrid','maf','bayboushe','whyl'] },
    { id:'baseline', date:'2026-09-19T10:00:00Z', format:'ffa', placements:players },
    { id:'third-latest', date:'2026-09-19T13:00:00Z', format:'ffa', placements:['mino','abyssou','linkthepomme','gruntzy','clowrid','maf','bayboushe','whyl'] },
    { id:'second-latest', date:'2026-09-19T14:00:00Z', format:'ffa', placements:['mino','abyssou','linkthepomme','gruntzy','clowrid','maf','bayboushe','whyl'] }
  ];
  const trends = buildRankTrends(roster, matches, 3);
  assert.deepEqual(trends.mino, { direction:'up', magnitude:7, previousRank:8, currentRank:1 });
  assert.deepEqual(trends.whyl, { direction:'down', magnitude:3, previousRank:1, currentRank:4 });
  assert.deepEqual(trends.gruntzy, { direction:'down', magnitude:1, previousRank:5, currentRank:6 });
  assert.deepEqual(buildRankTrends(roster, [], 3).whyl, { direction:'stable', magnitude:0, previousRank:8, currentRank:8 });
});

test('rank trend window is chronological and deterministic when match input is shuffled', () => {
  const roster = players.map(id => ({ id, name: id }));
  const matches = [
    { id:'one', date:'2026-09-19T10:00:00Z', format:'ffa', placements:players },
    { id:'two', date:'2026-09-19T11:00:00Z', format:'ffa', placements:[...players].reverse() },
    { id:'three', date:'2026-09-19T12:00:00Z', format:'ffa', placements:players },
    { id:'four', date:'2026-09-19T13:00:00Z', format:'ffa', placements:[...players].reverse() }
  ];
  assert.deepEqual(buildRankTrends(roster, matches, 3), buildRankTrends(roster, [matches[2], matches[0], matches[3], matches[1]], 3));
});
