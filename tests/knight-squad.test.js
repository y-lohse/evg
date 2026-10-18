import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { scoreMatch, buildLeaderboard, buildRankTrends } from '../lib/scoring.js';
import { buildMatchRows } from '../lib/view.js';

const participants = ['whyl','bayboushe','maf','clowrid','gruntzy','linkthepomme','abyssou','mino'];
const players = participants.map(id => ({ id, name:id }));
const ffa = { id:'ks-ffa', format:'ffa', scoring:'knight-squad-ffa', participants, leaders:['bayboushe','maf'] };
const duos = { id:'ks-duos', format:'2v2v2v2', scoring:'winner-only', participants, winners:['maf','gruntzy'] };

test('Knight Squad FFA uses 4/2/1 without inventing lower placements', () => {
  const points = scoreMatch(ffa);
  assert.equal(points.bayboushe, 4);
  assert.equal(points.maf, 2);
  for (const id of participants.filter(id => !ffa.leaders.includes(id))) assert.equal(points[id], 1);
  assert.equal(Object.values(points).reduce((a,b) => a+b, 0), 12);
  const row = buildMatchRows([ffa], players)[0];
  assert.equal(row.results.length, 8);
  assert.deepEqual(row.groups, []);
  assert.ok(row.results.filter(r => !ffa.leaders.includes(r.id)).every(r => r.label.includes('sans classement')));
  assert.ok(row.results.every(r => !/place/.test(r.label)));
});

test('Knight Squad duos award 3 to winners and 1 to others without fabricated teams', () => {
  const points = scoreMatch(duos);
  assert.deepEqual(points, Object.fromEntries(participants.map(id => [id, duos.winners.includes(id) ? 3 : 1])));
  assert.equal(Object.values(points).reduce((a,b) => a+b, 0), 12);
  const row = buildMatchRows([duos], players)[0];
  assert.deepEqual(row.groups, []);
  assert.equal(row.results.filter(r => r.label === 'Duo vainqueur').length, 2);
  assert.equal(row.results.filter(r => r.label.includes('duo non précisé')).length, 6);
});

test('special results reject missing, duplicate or unknown participants and unsupported modes', () => {
  for (const result of [ffa,duos]) {
    assert.throws(() => scoreMatch({...result, participants:participants.slice(1)}));
    assert.throws(() => scoreMatch({...result, participants:[...participants.slice(1),participants[1]]}));
    assert.throws(() => scoreMatch({...result, scoring:'unknown'}));
  }
  for (const leaders of [[],['maf'],['maf','maf'],['maf','unknown']]) assert.throws(() => scoreMatch({...ffa,leaders}));
  for (const winners of [[],['maf'],['maf','maf'],['maf','unknown']]) assert.throws(() => scoreMatch({...duos,winners}));
  assert.throws(() => scoreMatch({...duos,format:'4v4'}));
  assert.throws(() => buildLeaderboard(players,[{...duos,participants:[...participants.slice(1),'unknown']}]), /unknown player/);
});

test('all live results distribute 12 points and render every participant', async () => {
  const event = JSON.parse(await readFile(new URL('../data/event.json', import.meta.url), 'utf8'));
  for (const match of event.matches) assert.equal(Object.values(scoreMatch(match)).reduce((a,b)=>a+b,0),12,match.id);
  const rows = buildMatchRows(event.matches,event.players);
  for (const row of rows) {
    const members = row.results.length ? row.results : row.groups.flatMap(g=>g.members);
    assert.equal(members.length,8,row.id);
    assert.ok(members.every(m=>m.player),row.id);
  }
  const total = buildLeaderboard(event.players,event.matches).reduce((sum,p)=>sum+p.score,0);
  assert.equal(total,event.matches.length*12);
  assert.equal(Object.keys(buildRankTrends(event.players,event.matches)).length,8);
  for (const unlock of event.unlocks.filter(u=>u.achievementId==='achievement-unlocked')) {
    assert.ok(event.unlocks.filter(u=>u.playerId===unlock.playerId&&u.achievementId!=='achievement-unlocked').length>=5);
  }
});
