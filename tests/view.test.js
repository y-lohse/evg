import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMatchRows, groupAchievements } from '../lib/view.js';

const players = [
  {id:'a',name:'Alpha',initials:'AL',color:'#65D5D2'}, {id:'b',name:'Bravo',initials:'BR',color:'#F2A65A'},
  {id:'c',name:'Charlie',initials:'CH',color:'#A98BFF'}, {id:'d',name:'Delta',initials:'DE',color:'#B9D65C'},
  {id:'e',name:'Echo',initials:'EC',color:'#E27D91'}, {id:'f',name:'Foxtrot',initials:'FO',color:'#78A6E8'},
  {id:'g',name:'Golf',initials:'GO',color:'#E3C463'}, {id:'h',name:'Hotel',initials:'HO',color:'#B58BCB'}
];

test('match rows are newest first and expose each awarded point total', () => {
  const matches = [
    {id:'old',date:'2026-09-19T10:00:00+02:00',game:'Old',format:'ffa',placements:players.map(p=>p.id)},
    {id:'new',date:'2026-09-19T12:00:00+02:00',game:'New',format:'4v4',teams:[{outcome:'win',name:'Win',players:['a','b','c','d']},{outcome:'loss',name:'Loss',players:['e','f','g','h']}]}
  ];
  const rows = buildMatchRows(matches, players);
  assert.deepEqual(rows.map(row => row.id), ['new','old']);
  assert.equal(rows[0].results.find(r => r.player.id === 'a').points, 2);
  assert.match(rows[0].results.find(r => r.player.id === 'e').label, /Défaite/);
  assert.match(rows[1].results.find(r => r.player.id === 'a').label, /1re place/);
});

test('achievements group in catalog order and attach unlocking players', () => {
  const catalog = [
    {id:'one',group:'Endurance',name:'One'}, {id:'two',group:'Compétition',name:'Two'}, {id:'three',group:'Vie en LAN',name:'Three'}
  ];
  const groups = groupAchievements(catalog, [{playerId:'b',achievementId:'one'}], players);
  assert.deepEqual(groups.map(group => group.name), ['Endurance','Compétition','Vie en LAN']);
  assert.equal(groups[0].items[0].players[0].name, 'Bravo');
  assert.deepEqual(groups[1].items[0].players, []);
});
