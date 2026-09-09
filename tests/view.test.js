import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMatchRows, buildAchievements } from '../lib/view.js';

const players = [
  {id:'a',name:'Alpha',initials:'AL',color:'#65D5D2'}, {id:'b',name:'Bravo',initials:'BR',color:'#F2A65A'},
  {id:'c',name:'Charlie',initials:'CH',color:'#A98BFF'}, {id:'d',name:'Delta',initials:'DE',color:'#B9D65C'},
  {id:'e',name:'Echo',initials:'EC',color:'#E27D91'}, {id:'f',name:'Foxtrot',initials:'FO',color:'#78A6E8'},
  {id:'g',name:'Golf',initials:'GO',color:'#E3C463'}, {id:'h',name:'Hotel',initials:'HO',color:'#B58BCB'}
];

test('match rows are newest first and preserve individual FFA placements', () => {
  const matches = [
    {id:'old',date:'2026-09-19T10:00:00+02:00',game:'Old',format:'ffa',placements:players.map(p=>p.id)},
    {id:'new',date:'2026-09-19T12:00:00+02:00',game:'New',format:'4v4',teams:[{outcome:'win',name:'Win',players:['a','b','c','d']},{outcome:'loss',name:'Loss',players:['e','f','g','h']}]}
  ];
  const rows = buildMatchRows(matches, players);
  assert.deepEqual(rows.map(row => row.id), ['new','old']);
  assert.equal(rows[0].groups[0].members.find(r => r.player.id === 'a').points, 2);
  assert.match(rows[0].groups[1].label, /Défaite/);
  assert.match(rows[1].results.find(r => r.player.id === 'a').label, /1re place/);
});

test('4v4 and 2v2v2v2 history keeps teammates in two and four visual groups', () => {
  const matches = [
    {id:'four',date:'2026-09-19T12:00:00Z',game:'Four',format:'4v4',teams:[{outcome:'win',name:'Alpha',players:['a','b','c','d']},{outcome:'loss',name:'Bravo',players:['e','f','g','h']}]},
    {id:'duos',date:'2026-09-19T13:00:00Z',game:'Duos',format:'2v2v2v2',teams:[
      {placement:1,name:'One',players:['a','b']},{placement:2,name:'Two',players:['c','d']},
      {placement:3,name:'Three',players:['e','f']},{placement:4,name:'Four',players:['g','h']}
    ]}
  ];
  const rows = buildMatchRows(matches, players);
  assert.deepEqual(rows.find(row => row.id === 'four').groups.map(group => group.members.length), [4,4]);
  assert.deepEqual(rows.find(row => row.id === 'duos').groups.map(group => group.members.length), [2,2,2,2]);
  assert.equal(rows.find(row => row.id === 'duos').groups[0].members[0].points, 3);
});

test('achievements remain in catalog order and expose all players with unlocked states', () => {
  const catalog = [
    {id:'one',group:'Endurance',name:'One'}, {id:'two',group:'Compétition',name:'Two'}, {id:'three',group:'Vie en LAN',name:'Three'}
  ];
  const items = buildAchievements(catalog, [{playerId:'b',achievementId:'one'}], players);
  assert.deepEqual(items.map(item => item.id), ['one','two','three']);
  assert.equal(items[0].players.length, 8);
  assert.deepEqual(items[0].players.map(entry => entry.player.id), players.map(player => player.id));
  assert.equal(items[0].players.find(entry => entry.player.id === 'b').unlocked, true);
  assert.equal(items[0].players.find(entry => entry.player.id === 'a').unlocked, false);
  assert.ok(items[1].players.every(entry => !entry.unlocked));
});
