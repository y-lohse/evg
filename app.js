import { buildLeaderboard } from './lib/scoring.js';
import { buildMatchRows, groupAchievements } from './lib/view.js';

const app = document.querySelector('#app');
const refreshButton = document.querySelector('#refresh');
const routes = new Set(['programme', 'classement', 'achievements']);
let store = null;

const escapeHtml = value => String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const avatar = (player, small = false, title = '') => `<span class="avatar${small ? ' small' : ''}" style="--avatar:${escapeHtml(player.color)}"${title ? ` title="${escapeHtml(title)}"` : ''} aria-label="${escapeHtml(player.name)}">${escapeHtml(player.initials)}</span>`;
const formatDate = date => new Intl.DateTimeFormat('fr-FR', { weekday:'short', hour:'2-digit', minute:'2-digit' }).format(new Date(date)).replace('.', '');

async function fetchJson(path, bust) {
  const separator = path.includes('?') ? '&' : '?';
  const response = await fetch(`${path}${separator}v=${bust}`, { cache:'no-store' });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

async function loadData() {
  app.innerHTML = '<div class="state-panel loading"><span class="spinner" aria-hidden="true"></span><p>Synchronisation des données…</p></div>';
  refreshButton.disabled = true;
  const bust = Date.now();
  try {
    const [programme, achievements, event] = await Promise.all([
      fetchJson('./data/programme.json', bust), fetchJson('./data/achievements.json', bust), fetchJson('./data/event.json', bust)
    ]);
    store = { programme, achievements, event };
    document.querySelector('#sync-time').textContent = `SYNC ${new Intl.DateTimeFormat('fr-FR',{hour:'2-digit',minute:'2-digit'}).format(new Date())}`;
    renderRoute();
  } catch (error) {
    console.error(error);
    app.innerHTML = `<div class="state-panel error-panel"><strong>Connexion interrompue</strong><p>Impossible de charger les fichiers JSON.<br><small>${escapeHtml(error.message)}</small></p><button type="button" id="retry">Réessayer</button></div>`;
    document.querySelector('#retry').addEventListener('click', loadData);
  } finally { refreshButton.disabled = false; }
}

function viewHead(index, eyebrow, title, description) {
  return `<header class="view-head"><div><span class="eyebrow">ÉCRAN ${index} // ${eyebrow}</span><h1>${title}</h1></div><p>${description}</p></header>`;
}

function renderProgramme() {
  const days = store.programme.days.map(day => `<section class="day" aria-labelledby="day-${day.id}">
    <header class="day-header"><h2 class="day-label" id="day-${day.id}">${escapeHtml(day.label)}</h2><span class="day-date">${escapeHtml(day.date)}</span></header>
    <ol class="schedule">${day.items.map(item => `<li class="schedule-item tone-${item.tone}${item.poster ? ' has-poster' : ''}">
      <time class="schedule-time">${escapeHtml(item.time)}</time>
      <div class="schedule-copy">${item.session ? `<span class="session-id">${escapeHtml(item.session)}</span>` : ''}<h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.details)}</p></div>
      ${item.poster ? `<figure class="poster-frame"><img src="${escapeHtml(item.poster)}" alt="Affiche ${escapeHtml(item.title)}" width="1672" height="941" loading="lazy"></figure>` : ''}
    </li>`).join('')}</ol>
  </section>`).join('');
  app.innerHTML = viewHead('01','planification','Programme','Deux jours, quatre sessions. Le signal passe du jeu libre aux matchs officiels sans bruit organisationnel.') + days;
}

function badgeStrip(playerId) {
  const names = store.event.unlocks.filter(u => u.playerId === playerId).map(u => store.achievements.find(a => a.id === u.achievementId)?.name).filter(Boolean);
  if (!names.length) return '<span class="locked">—</span>';
  const shown = names.slice(0, 5);
  return shown.map(name => `<span class="mini-badge" role="img" aria-label="${escapeHtml(name)}" title="${escapeHtml(name)}"></span>`).join('') + (names.length > shown.length ? `<span class="more-badges">+${names.length-shown.length}</span>` : '');
}

function renderClassement() {
  const board = buildLeaderboard(store.event.players, store.event.matches);
  const rows = buildMatchRows(store.event.matches, store.event.players);
  const leaderboard = board.map((player,index) => `<div class="leader-row">
    <span class="rank" aria-label="Rang ${index+1}">${String(index+1).padStart(2,'0')}</span>${avatar(player)}
    <span class="player-name">${escapeHtml(player.name)}</span><span class="badge-strip" aria-label="Achievements débloqués">${badgeStrip(player.id)}</span>
    <strong class="score">${player.score}<small class="score-label">PTS</small></strong>
  </div>`).join('');
  const history = rows.map(match => `<article class="match-card">
    <header class="match-head"><div><span class="match-meta">${formatDate(match.date)} · SESSION ${escapeHtml(match.session)}</span><h3>${escapeHtml(match.game)}</h3></div><span class="format-chip">${escapeHtml(match.format)}</span></header>
    <div class="match-results">${match.results.map(result => `<div class="result-line">${avatar(result.player,true)}<span><span class="result-player">${escapeHtml(result.player.name)}</span><br><span class="result-label">${escapeHtml(result.label)}</span></span><span class="points">+${result.points}</span></div>`).join('')}</div>
  </article>`).join('');
  app.innerHTML = viewHead('02','scoreboard','Classement','Total calculé côté client depuis les résultats bruts. En cas d’égalité : ordre alphabétique.') + `<div class="score-layout">
    <section aria-labelledby="ranking-title"><h2 class="section-title" id="ranking-title"><span>●</span> Tableau live</h2><div class="leaderboard">${leaderboard}</div>
      <aside class="rules"><h3>Protocole de score · 12 pts / match</h3><dl><dt>FFA · places 1→8</dt><dd>5 / 3 / 2 / 1 / 1 / 0 / 0 / 0</dd><dt>2v2v2v2 · par joueur</dt><dd>3 / 2 / 1 / 0</dd><dt>4v4 · par joueur</dt><dd>2 victoire / 1 défaite</dd></dl></aside>
    </section><section class="history-column" aria-labelledby="history-title"><h2 class="section-title" id="history-title">Historique <span>/ ${rows.length}</span></h2><div class="history-list">${history}</div></section></div>`;
}

function renderAchievements() {
  const groups = groupAchievements(store.achievements, store.event.unlocks, store.event.players);
  const html = groups.map(group => `<section class="achievement-group" aria-labelledby="group-${group.name.replaceAll(' ','-')}">
    <header class="achievement-group-head"><h2 class="section-title" id="group-${group.name.replaceAll(' ','-')}">${escapeHtml(group.name)}</h2><small>${String(group.items.length).padStart(2,'0')} BADGES</small></header>
    <div class="achievement-grid">${group.items.map(item => `<article class="achievement"><img src="./assets/achievement-placeholder.svg" alt="" width="64" height="64"><div><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.description)}</p><div class="unlockers">${item.players.length ? `<span class="unlockers-label">Débloqué</span>${item.players.map(p => avatar(p,true,`Débloqué par ${p.name}`)).join('')}` : '<span class="locked">Aucun déblocage — démo</span>'}</div></div></article>`).join('')}</div>
  </section>`).join('');
  app.innerHTML = viewHead('03','progression','Achievements','Vingt signaux à capter : endurance, compétition et vie en LAN. Les badges définitifs arriveront dans une prochaine build.') + html;
}

function renderRoute() {
  if (!store) return;
  const route = location.hash.slice(1) || 'programme';
  if (!routes.has(route)) { location.hash = 'programme'; return; }
  document.querySelectorAll('[data-route]').forEach(link => { const active = link.dataset.route === route; link.classList.toggle('active', active); if(active) link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current'); });
  ({ programme:renderProgramme, classement:renderClassement, achievements:renderAchievements })[route]();
  window.scrollTo({ top:0, behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  document.title = `${route[0].toUpperCase()+route.slice(1)} // Clowrid Invitational`;
}

window.addEventListener('hashchange', renderRoute);
refreshButton.addEventListener('click', loadData);
loadData();
