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
  assert.equal(event.matches.length, 6);
  assert.ok(event.matches.every(match => match.id.startsWith('demo-')), 'all six results must be clearly labeled demo data');
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

test('page declares an existing favicon', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  const href = html.match(/<link rel="icon" href="([^"]+)"/)?.[1];
  assert.ok(href, 'missing favicon link');
  await access(new URL(href.replace(/^\.\//, ''), root));
});

test('programme references four existing poster images', async () => {
  const programme = await load('data/programme.json');
  const posters = programme.days.flatMap(day => day.items).filter(item => item.poster).map(item => item.poster);
  assert.equal(posters.length, 4);
  await Promise.all(posters.map(path => access(new URL(path.replace(/^\.\//, ''), root))));
});

test('official programme sessions use structured games with participant-facing formats only', async () => {
  const programme = await load('data/programme.json');
  const official = programme.days.flatMap(day => day.items).filter(item => item.poster);
  const allowed = new Set(['FFA', '4v4', '2v2v2v2', 'FORMAT LIBRE']);
  assert.equal(official.length, 4);
  for (const session of official) {
    assert.ok(!('details' in session), `${session.title} still has ad-hoc details`);
    assert.ok(Array.isArray(session.games) && session.games.length > 0);
    for (const game of session.games) {
      assert.ok(game.title);
      assert.ok(Array.isArray(game.formats) && game.formats.length > 0);
      game.formats.forEach(format => assert.ok(allowed.has(format), `${format} is not approved vocabulary`));
    }
  }
  const warcraft = official.flatMap(session => session.games).find(game => game.title === 'Warcraft III classique');
  assert.deepEqual(warcraft.formats, ['FFA', '4v4']);
  const dota = official.flatMap(session => session.games).find(game => game.title === 'DotA');
  assert.deepEqual(dota.formats, ['4v4']);
  const worms = official.flatMap(session => session.games).find(game => game.title === 'Worms W.M.D.');
  assert.deepEqual(worms.formats, ['4v4']);
});

test('programme includes revised overnight and Sunday copy', async () => {
  const programme = await load('data/programme.json');
  const items = programme.days.flatMap(day => day.items);
  const overnight = items.find(item => item.title === 'Connexion nocturne');
  assert.equal(overnight.time, 'DÈS 00:30');
  assert.deepEqual(overnight.games.map(game => game.title), ['Trackmania','Brawlhalla','Fall Guys','Rocket League']);
  const breakfast = items.find(item => item.title === 'Petit déjeuner & jeux libres');
  assert.equal(breakfast.time, 'AVANT 10:00');
  const finale = items.find(item => item.title === 'Résultats et repas');
  assert.equal('details' in finale, false);
});

test('shell omits refresh controls and legacy descriptive banner copy', async () => {
  const [html, app] = await Promise.all([
    readFile(new URL('index.html', root), 'utf8'),
    readFile(new URL('app.js', root), 'utf8')
  ]);
  assert.doesNotMatch(html, /Actualiser|id="refresh"/i);
  assert.doesNotMatch(app, /Deux jours, quatre sessions|ÉCRAN|scoreboard|planification/i);
});
