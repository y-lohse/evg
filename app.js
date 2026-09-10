import { buildLeaderboard, buildRankTrends } from './lib/scoring.js';
import { buildMatchRows, buildAchievements } from './lib/view.js';

const app = document.querySelector('#app');
const routes = new Set(['programme', 'classement', 'achievements']);
let store = null;

const escapeHtml = value => String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const avatar = (player, { small = false, state = '' } = {}) => {
  const status = state === 'unlocked' ? `Débloqué par ${player.name}` : state === 'locked' ? `Verrouillé pour ${player.name}` : player.name;
  return `<span class="avatar${small ? ' small' : ''}${state ? ` ${state}` : ''}" style="--avatar:${escapeHtml(player.color)}" title="${escapeHtml(status)}" aria-label="${escapeHtml(status)}">${escapeHtml(player.initials)}</span>`;
};
const formatDate = date => new Intl.DateTimeFormat('fr-FR', { weekday:'short', hour:'2-digit', minute:'2-digit' }).format(new Date(date)).replace('.', '');

function normalizeFormat(format) {
  const key = String(format).toLowerCase();
  if (key === 'ffa') return { type:'ffa', label:'FFA' };
  if (key === '2v2v2v2' || key === '4 équipes') return { type:'duos', label:'2v2' };
  if (key === '4v4' || key === '2 équipes') return { type:'teams', label:'4v4' };
  return { type:'free', label:'LIBRE' };
}

function formatGroups(type, groups) {
  if (groups?.length) return groups.map(group => {
    const members = group.members ?? group.players ?? [];
    return members.map(member => {
      const player = typeof member === 'string' ? store.event.players.find(item => item.id === member) : member.player ?? member;
      return player?.color;
    }).filter(Boolean);
  });
  const colors = store.event.players.map(player => player.color);
  if (type === 'duos') return [colors.slice(0,2), colors.slice(2,4), colors.slice(4,6), colors.slice(6,8)];
  if (type === 'teams') return [colors.slice(0,4), colors.slice(4,8)];
  return colors.map(color => [color]);
}

function formatMark(format, groups) {
  const { type, label } = normalizeFormat(format);
  if (type === 'free') return `<span class="format-chip">${label}</span>`;
  const swatches = formatGroups(type, groups).map(colors => {
    const stops = colors.map((color, index) => `${color} ${index * 100 / colors.length}% ${(index + 1) * 100 / colors.length}%`).join(',');
    return `<i style="background:linear-gradient(135deg,${stops})"></i>`;
  }).join('');
  return `<span class="format-mark format-${type}" role="img" aria-label="Format ${label}"><span>${swatches}</span><b>${label}</b></span>`;
}

async function fetchJson(path, bust) {
  const response = await fetch(`${path}?v=${bust}`, { cache:'no-store' });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

async function loadData() {
  app.innerHTML = '<div class="state-panel loading"><span class="spinner" aria-hidden="true"></span><p>Synchronisation des données…</p></div>';
  try {
    const bust = Date.now();
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
  }
}

function viewHead(metadata, title) {
  return `<header class="view-head"><div><span class="eyebrow">${escapeHtml(metadata)}</span><h1>${escapeHtml(title)}</h1></div></header>`;
}

function renderGames(item) {
  if (!item.games) return item.details ? `<p class="schedule-details">${escapeHtml(item.details)}</p>` : '';
  return `<ul class="game-list">${item.games.map(game => `<li><strong>${escapeHtml(game.title)}</strong>${game.formats?.length ? `<span class="format-list">${game.formats.map(format => formatMark(format)).join('')}</span>` : ''}</li>`).join('')}</ul>`;
}

function renderProgramme() {
  const days = store.programme.days.map(day => `<section class="day" aria-labelledby="day-${day.id}">
    <header class="day-header"><h2 class="day-label" id="day-${day.id}">${escapeHtml(day.label)}</h2><span class="day-date">${escapeHtml(day.date)}</span></header>
    <ol class="schedule">${day.items.map(item => `<li class="schedule-item tone-${item.tone}${item.poster ? ' has-poster' : ''}">
      <time class="schedule-time">${escapeHtml(item.time)}</time>
      <div class="schedule-copy">${item.session ? `<span class="session-id">${escapeHtml(item.session)}</span>` : ''}<h3>${escapeHtml(item.title)}</h3>${renderGames(item)}</div>
      ${item.poster ? `<figure class="poster-frame"><img src="${escapeHtml(item.poster)}" alt="Affiche ${escapeHtml(item.title)}" width="1672" height="941" loading="lazy"></figure>` : ''}
    </li>`).join('')}</ol>
  </section>`).join('');
  app.innerHTML = viewHead('SAMEDI + DIMANCHE','Programme') + days;
}

function badgeStrip(playerId) {
  const earned = store.event.unlocks.filter(unlock => unlock.playerId === playerId).map(unlock => store.achievements.find(item => item.id === unlock.achievementId)).filter(Boolean);
  if (!earned.length) return '<span class="locked-text">—</span>';
  return earned.map(item => `<img class="mini-badge" src="${escapeHtml(item.badge)}" alt="" width="38" height="38" aria-label="${escapeHtml(item.name)}" title="${escapeHtml(item.name)}">`).join('');
}

function trendIndicator(trend) {
  const labels = { up:'Gain', down:'Perte', stable:'Rang stable' };
  const symbols = { up:'↑', down:'↓', stable:'—' };
  const title = trend.direction === 'stable' ? 'Rang stable' : `${labels[trend.direction]} de ${trend.magnitude} ${trend.magnitude > 1 ? 'places' : 'place'}`;
  return `<span class="rank-trend ${trend.direction}" title="${title}" aria-label="${title}">${symbols[trend.direction]}${trend.magnitude || ''}</span>`;
}

function renderTeamGroup(group) {
  return `<section class="team-group ${group.outcome || ''}" aria-label="${escapeHtml(`Équipe ${group.index}, ${group.label}`)}"><header><strong>ÉQUIPE ${group.index}</strong><span>${escapeHtml(group.label)}</span></header><div>${group.members.map(member => `<div class="team-member">${avatar(member.player,{small:true})}<span>${escapeHtml(member.player.name)}</span><b>+${member.points}</b></div>`).join('')}</div></section>`;
}

function renderClassement() {
  const board = buildLeaderboard(store.event.players, store.event.matches);
  const trends = buildRankTrends(store.event.players, store.event.matches, 3);
  const rows = buildMatchRows(store.event.matches, store.event.players);
  const leaderboard = board.map((player,index) => `<div class="leader-row">
    <span class="rank" aria-label="Rang ${index+1}">${String(index+1).padStart(2,'0')}</span>${avatar(player)}
    <span class="player-name">${escapeHtml(player.name)}${trendIndicator(trends[player.id])}</span><span class="badge-strip" aria-label="Achievements débloqués">${badgeStrip(player.id)}</span>
    <strong class="score">${player.score}<small class="score-label">PTS</small></strong>
  </div>`).join('');
  const history = rows.map(match => `<article class="match-card">
    <header class="match-head"><div><span class="match-meta">${formatDate(match.date)} · SESSION ${escapeHtml(match.session)}</span><h3>${escapeHtml(match.game)}</h3></div>${formatMark(match.format, match.groups)}</header>
    ${match.format === 'ffa' ? `<div class="match-results">${match.results.map(result => `<div class="result-line">${avatar(result.player,{small:true})}<span><span class="result-summary"><span class="result-player">${escapeHtml(result.player.name)}</span><b class="points">+${result.points}</b></span><span class="result-label">${escapeHtml(result.label)}</span></span></div>`).join('')}</div>` : `<div class="team-groups">${match.groups.map(renderTeamGroup).join('')}</div>`}
  </article>`).join('');
  app.innerHTML = viewHead('8 JOUEURS · CLASSEMENT GÉNÉRAL','Classement') + `<div class="score-layout">
    <section aria-labelledby="ranking-title"><h2 class="section-title" id="ranking-title"><span>●</span> Tableau live</h2><div class="leaderboard">${leaderboard}</div>
      <aside class="rules"><h3>Protocole de score · 12 pts / résultat</h3><dl><dt>FFA · places 1→8</dt><dd>5 / 3 / 2 / 1 / 1 / 0 / 0 / 0</dd><dt>4 équipes · par joueur</dt><dd>3 / 2 / 1 / 0</dd><dt>2 équipes · par joueur</dt><dd>2 victoire / 1 défaite</dd></dl></aside>
    </section><section class="history-column" aria-labelledby="history-title"><div class="history-title-row"><h2 class="section-title" id="history-title">Historique des résultats</h2><span>${rows.length} RÉSULTATS</span></div><div class="history-list">${history}</div></section></div>`;
}

function renderAchievements() {
  const items = buildAchievements(store.achievements, store.event.unlocks, store.event.players);
  const html = `<section class="achievement-catalog" aria-label="Catalogue des achievements"><div class="achievement-grid">${items.map(item => `<article class="achievement"><img src="${escapeHtml(item.badge)}" alt="Badge ${escapeHtml(item.name)}" width="96" height="96" loading="lazy"><div><h2>${escapeHtml(item.name)}</h2><p>${escapeHtml(item.description)}</p><div class="achievement-players" aria-label="État des huit joueurs">${item.players.map(entry => avatar(entry.player,{small:true,state:entry.unlocked ? 'unlocked' : 'locked'})).join('')}</div></div></article>`).join('')}</div></section>`;
  app.innerHTML = viewHead('20 OBJECTIFS · 8 JOUEURS','Achievements') + html;
}

function renderRoute() {
  if (!store) return;
  const route = location.hash.slice(1) || 'programme';
  if (!routes.has(route)) { location.hash = 'programme'; return; }
  document.querySelectorAll('[data-route]').forEach(link => {
    const active = link.dataset.route === route;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current');
  });
  ({ programme:renderProgramme, classement:renderClassement, achievements:renderAchievements })[route]();
  window.scrollTo({ top:0, behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  document.title = `${route[0].toUpperCase()+route.slice(1)} // Clowrid Invitational`;
}

window.addEventListener('hashchange', renderRoute);
loadData();
