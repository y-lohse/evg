import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const load = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));

test('event data contains exactly eight unique participants and valid match references', async () => {
  const event = await load('data/event.json');
  assert.equal(event.players.length, 8);
  const ids = new Set(event.players.map(player => player.id));
  assert.equal(ids.size, 8);
  assert.deepEqual(event.players.map(p => p.name), ['Whyl','Bayboushe','Maf','Clowrid','Gruntzy','linkthepomme','abyssou','Mino']);
  for (const match of event.matches) {
    const refs = match.placements ?? match.teams.flatMap(team => team.players);
    refs.forEach(id => assert.ok(ids.has(id), `${match.id} references unknown player ${id}`));
    assert.equal(new Set(refs).size, 8, `${match.id} must reference all eight players once`);
  }
});

test('achievement catalog contains exactly twenty IDs and all unlock references are valid', async () => {
  const [event, achievements] = await Promise.all([load('data/event.json'), load('data/achievements.json')]);
  assert.equal(achievements.length, 20);
  assert.deepEqual([...new Set(achievements.map(a => a.group))], ['Endurance','Compétition','Vie en LAN']);
  const achievementIds = new Set(achievements.map(a => a.id));
  const playerIds = new Set(event.players.map(p => p.id));
  assert.equal(achievementIds.size, 20);
  for (const unlock of event.unlocks) {
    assert.ok(achievementIds.has(unlock.achievementId), `unknown achievement ${unlock.achievementId}`);
    assert.ok(playerIds.has(unlock.playerId), `unknown player ${unlock.playerId}`);
  }
});

test('demo DotA matches use the 4v4 team format', async () => {
  const event = await load('data/event.json');
  const dotaMatches = event.matches.filter(match => match.game.startsWith('DotA'));
  assert.ok(dotaMatches.length > 0);
  assert.ok(dotaMatches.every(match => match.format === '4v4'));
});

test('programme references four existing poster images', async () => {
  const programme = await load('data/programme.json');
  const posters = programme.days.flatMap(day => day.items).filter(item => item.poster).map(item => item.poster);
  assert.equal(posters.length, 4);
  await Promise.all(posters.map(path => access(new URL(path.replace(/^\.\//, ''), root))));
});
