import { buildLeaderboard } from './lib/scoring.js';
import { generateBalancedTeams, generateRandomTeams } from './lib/teams.js';

const form = document.querySelector('#team-form');
const output = document.querySelector('#generated-teams');
const title = document.querySelector('#team-output-title');
const readout = document.querySelector('#mode-readout');
let event = null;

const escapeHtml = value => String(value).replace(/[&<>'"]/g, char => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;'
}[char]));

function avatar(player) {
  return `<span class="avatar" style="--avatar:${escapeHtml(player.color)}" aria-hidden="true">${escapeHtml(player.initials)}</span>`;
}

function teamAccent(team) {
  const step = 100 / team.length;
  return `linear-gradient(90deg,${team.map((player, index) => `${player.color} ${index * step}% ${(index + 1) * step}%`).join(',')})`;
}

function renderTeams(teams, mode) {
  const scoreLabel = mode === 'balanced';
  output.innerHTML = teams.map((team, index) => {
    const total = team.reduce((sum, player) => sum + player.score, 0);
    return `<article class="generated-team" style="--team-accent:${teamAccent(team)}">
      <header><span>ÉQUIPE ${String(index + 1).padStart(2, '0')}</span>${scoreLabel ? `<b>${total} PTS CUMULÉS</b>` : ''}</header>
      <div>${team.map(player => `<div class="generated-player">${avatar(player)}<strong>${escapeHtml(player.name)}</strong>${scoreLabel ? `<span>${player.score} pts</span>` : ''}</div>`).join('')}</div>
    </article>`;
  }).join('');
}

function generate() {
  if (!event) return;
  const data = new FormData(form);
  const teamSize = Number(data.get('team-size'));
  const mode = data.get('mode');
  const rankedPlayers = buildLeaderboard(event.players, event.matches);
  const teams = mode === 'balanced'
    ? generateBalancedTeams(rankedPlayers, teamSize)
    : generateRandomTeams(rankedPlayers, teamSize);

  const count = teams.length;
  title.textContent = `${count} ${count > 1 ? 'équipes générées' : 'équipe générée'}`;
  readout.textContent = `${count} ÉQUIPES · ${mode === 'balanced' ? 'ÉQUILIBRÉ CLASSEMENT' : 'FULL RANDOM'}`;
  renderTeams(teams, mode);
}

async function load() {
  try {
    const response = await fetch(`./data/event.json?v=${Date.now()}`, { cache:'no-store' });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    event = await response.json();
    generate();
  } catch (error) {
    console.error(error);
    title.textContent = 'Connexion interrompue';
    readout.textContent = 'ERREUR';
    output.innerHTML = `<div class="state-panel error-panel"><p>Impossible de charger la liste des joueurs.<br><small>${escapeHtml(error.message)}</small></p></div>`;
    form.querySelector('button').disabled = true;
  }
}

form.addEventListener('submit', event => {
  event.preventDefault();
  generate();
});

form.addEventListener('change', generate);
load();
