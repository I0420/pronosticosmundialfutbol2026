/* ============================================================
   2026 FIFA World Cup Prediction Game - app.js
   ============================================================ */

const LEADERBOARD_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSDbPhOej3DnN_bdvrCQ5R0T6HZg6bBaxKdH17J_Pc3oGOkKkd9V83BUDYlBSCevOrqYK2XQuA7ZMCx/pub?gid=1633860364&single=true&output=csv';
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdiF0qsK65DcaadNKRzDbue8xtkzAIIev-7yqUqAH3srhEAQg/formResponse';

const SCORING_SYSTEM = {
  group_exact: 3,
  group_outcome: 1,
  knockout_exact: 3,
  knockout_outcome: 1
};

let currentTab = 'predict';
let state = {
  user: '',
  groupMatches: {},
  knockout: { userScores: {} }
};

let userGroupMatches = {};
let userKnockout = { userScores: {} };

// ── SISTEMA DE PUNTOS FIFA ──────────────────────────────────
// Devuelve la tabla de un grupo basada en los pronósticos del usuario
function calcGroupTable(groupId) {
  const teams = RESULTS.groups[groupId];
  const table = {};
  teams.forEach(t => {
    table[t] = { team: t, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0, pts: 0 };
  });

  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const t1 = teams[i];
      const t2 = teams[j];
      const matchKey = `${t1}__${t2}`;
      const score = userGroupMatches[matchKey];
      if (score == null || score.home === null || score.home === '' ||
          score.away === null || score.away === '') continue;

      const h = parseInt(score.home, 10);
      const a = parseInt(score.away, 10);

      table[t1].pj++; table[t2].pj++;
      table[t1].gf += h; table[t1].gc += a;
      table[t2].gf += a; table[t2].gc += h;
      table[t1].dg = table[t1].gf - table[t1].gc;
      table[t2].dg = table[t2].gf - table[t2].gc;

      if (h > a) {
        table[t1].pg++; table[t1].pts += 3;
        table[t2].pp++;
      } else if (h < a) {
        table[t2].pg++; table[t2].pts += 3;
        table[t1].pp++;
      } else {
        table[t1].pe++; table[t1].pts++;
        table[t2].pe++; table[t2].pts++;
      }
    }
  }

  return Object.values(table).sort((a, b) =>
    b.pts - a.pts || b.dg - a.dg || b.gf - a.gf || a.team.localeCompare(b.team)
  );
}

// Devuelve clasificados: { firsts, seconds, thirds }
function getQualified() {
  const firsts = [], seconds = [], thirds = [];
  Object.keys(RESULTS.groups).forEach(groupId => {
    const t = calcGroupTable(groupId);
    firsts.push({ ...t[0], group: groupId });
    seconds.push({ ...t[1], group: groupId });
    thirds.push({ ...t[2], group: groupId });
  });

  // 8 mejores terceros por pts → dg → gf
  const best8Thirds = thirds
    .sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf)
    .slice(0, 8);

  return { firsts, seconds, thirds: best8Thirds };
}

// ── RENDER GRUPOS CON TABLA ────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initToolbar();
  renderGroups();
  renderBracket();
  restoreLocalPrediction();
});

function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const tabId = `tab-${btn.getAttribute('data-tab')}`;
      document.getElementById(tabId).classList.add('active');
      currentTab = btn.getAttribute('data-tab');
    });
  });
}

function initToolbar() {
  const btnReset = document.getElementById('btnReset');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (confirm('¿Seguro que quieres borrar todas tus predicciones? No hay vuelta atrás.')) {
        localStorage.removeItem('worldCup2026_myPrediction');
        userGroupMatches = {};
        userKnockout = { userScores: {} };
        state.knockout.userScores = {};
        renderGroups();
        renderBracket();
        showToast('Todo limpio. Vuelve a empezar.');
      }
    });
  }

  const btnScoringHelp = document.getElementById('btnScoringHelp');
  if (btnScoringHelp) {
    btnScoringHelp.addEventListener('click', () => {
      alert('Sistema de Puntos:\n\n- Marcador exacto (Grupos y Knockouts): 3 puntos\n- Acertar ganador o empate: 1 punto');
    });
  }

  document.getElementById('btnSubmit').addEventListener('click', () => {
    document.getElementById('nameModal').style.display = 'block';
  });

  document.getElementById('cancelNameSubmit').addEventListener('click', () => {
    document.getElementById('nameModal').style.display = 'none';
  });

  document.getElementById('confirmNameSubmit').addEventListener('click', () => {
    const name = document.getElementById('playerNameInput').value.trim();
    if (!name) { showToast('Por favor, introduce tu nombre', true); return; }
    submitPrediction(name);
  });
}

function renderGroups() {
  const grid = document.getElementById('groupsGrid');
  if (!grid || typeof RESULTS === 'undefined') return;
  grid.innerHTML = '';

  Object.keys(RESULTS.groups).forEach(groupId => {
    const groupCard = document.createElement('div');
    groupCard.className = 'group-card';

    // Tabla de clasificación del grupo
    const table = calcGroupTable(groupId);
    const tableHTML = `
      <div class="group-table-wrapper">
        <table class="group-table">
          <thead>
            <tr>
              <th>#</th><th class="team-col">Equipo</th>
              <th title="Partidos Jugados">PJ</th>
              <th title="Ganados">G</th>
              <th title="Empates">E</th>
              <th title="Perdidos">P</th>
              <th title="Goles a Favor">GF</th>
              <th title="Goles en Contra">GC</th>
              <th title="Diferencia de Goles">DG</th>
              <th title="Puntos">Pts</th>
            </tr>
          </thead>
          <tbody>
            ${table.map((row, idx) => `
              <tr class="${idx < 2 ? 'qualified-first-second' : idx === 2 ? 'qualified-third' : ''}">
                <td class="pos-cell">${idx + 1}</td>
                <td class="team-col">${row.team}</td>
                <td>${row.pj}</td>
                <td>${row.pg}</td>
                <td>${row.pe}</td>
                <td>${row.pp}</td>
                <td>${row.gf}</td>
                <td>${row.gc}</td>
                <td>${row.dg >= 0 ? '+' : ''}${row.dg}</td>
                <td class="pts-cell">${row.pts}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="group-legend">
          <span class="legend-dot dot-q12"></span> Clasifica (1º/2º)
          <span class="legend-dot dot-q3" style="margin-left:10px;"></span> Posible 3º clasificado
        </div>
      </div>
    `;

    // Partidos del grupo
    const teams = RESULTS.groups[groupId];
    let matchRowsHTML = '';
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const t1 = teams[i], t2 = teams[j];
        const matchKey = `${t1}__${t2}`;
        const currentHome = userGroupMatches[matchKey]?.home ?? '';
        const currentAway = userGroupMatches[matchKey]?.away ?? '';
        matchRowsHTML += `
          <div class="match-row">
            <div class="team-lbl"><span>${t1}</span></div>
            <input type="number" class="score-input" min="0" value="${currentHome}"
              oninput="handleGroupScoreChange('${matchKey}', 'home', this.value)">
            <span class="vs">vs</span>
            <input type="number" class="score-input" min="0" value="${currentAway}"
              oninput="handleGroupScoreChange('${matchKey}', 'away', this.value)">
            <div class="team-lbl" style="text-align:right"><span>${t2}</span></div>
          </div>
        `;
      }
    }

    groupCard.innerHTML = `<h3>Grupo ${groupId}</h3>${tableHTML}<div class="group-matches">${matchRowsHTML}</div>`;
    grid.appendChild(groupCard);
  });
}

function handleGroupScoreChange(matchKey, side, value) {
  if (!userGroupMatches[matchKey]) userGroupMatches[matchKey] = { home: null, away: null };
  userGroupMatches[matchKey][side] = value !== '' ? parseInt(value, 10) : null;
  saveLocalPredictionSoon();
  refreshGroupTables();      // recalcula tablas en tiempo real
  refreshBracketTeams();     // actualiza bracket automáticamente
}

// Recalcula solo las tablas sin re-renderizar los inputs (evita perder foco)
function refreshGroupTables() {
  Object.keys(RESULTS.groups).forEach(groupId => {
    const table = calcGroupTable(groupId);
    const groupCards = document.querySelectorAll('.group-card');
    groupCards.forEach(card => {
      if (card.querySelector('h3')?.textContent?.includes(`Grupo ${groupId}`)) {
        const tbody = card.querySelector('.group-table tbody');
        if (!tbody) return;
        tbody.innerHTML = table.map((row, idx) => `
          <tr class="${idx < 2 ? 'qualified-first-second' : idx === 2 ? 'qualified-third' : ''}">
            <td class="pos-cell">${idx + 1}</td>
            <td class="team-col">${row.team}</td>
            <td>${row.pj}</td>
            <td>${row.pg}</td>
            <td>${row.pe}</td>
            <td>${row.pp}</td>
            <td>${row.gf}</td>
            <td>${row.gc}</td>
            <td>${row.dg >= 0 ? '+' : ''}${row.dg}</td>
            <td class="pts-cell">${row.pts}</td>
          </tr>
        `).join('');
      }
    });
  });
}

// ── BRACKET ────────────────────────────────────────────────
// Genera las llaves de Round of 32 usando clasificados automáticos
// Emparejamiento FIFA 2026 oficial (simplificado para 12 grupos A-L)
// Los empates en la tabla se desempatan por criterios FIFA, aquí usamos
// pts → dg → gf → orden alfabético (suficiente para pronósticos).
function buildRound32FromStandings() {
  const { firsts, seconds, thirds } = getQualified();

  // Mapa rápido por grupo
  const f = {};  // primeros por grupo
  const s = {};  // segundos por grupo
  firsts.forEach(t => f[t.group] = t.team);
  seconds.forEach(t => s[t.group] = t.team);

  // Los 8 mejores terceros en orden de puntos
  const t3 = thirds.map(t => t.team);

  // Emparejamiento oficial FIFA 2026 para los 32avos de final
  // (basado en el sorteo/cuadro publicado por FIFA)
  // Grupos y sus posiciones en el bracket (puede ajustarse cuando salga el cuadro definitivo):
  const pairs = [
    [f['A'], s['B']],   // Match 73
    [f['C'], s['D']],   // Match 74
    [f['E'], s['F']],   // Match 75
    [f['G'], s['H']],   // Match 76
    [f['I'], s['J']],   // Match 77
    [f['K'], s['L']],   // Match 78
    [f['B'], s['A']],   // Match 79
    [f['D'], s['C']],   // Match 80
    [f['F'], s['E']],   // Match 81
    [f['H'], s['G']],   // Match 82
    [f['J'], s['I']],   // Match 83
    [f['L'], s['K']],   // Match 84
    [t3[0] || '3º Mejor', t3[1] || '3º Mejor'],   // Match 85
    [t3[2] || '3º Mejor', t3[3] || '3º Mejor'],   // Match 86
    [t3[4] || '3º Mejor', t3[5] || '3º Mejor'],   // Match 87
    [t3[6] || '3º Mejor', t3[7] || '3º Mejor'],   // Match 88
  ];

  return pairs;
}

function renderBracket() {
  const container = document.getElementById('bracketContainer');
  if (!container || typeof RESULTS === 'undefined') return;
  container.innerHTML = '';

  const rounds = [
    { key: 'round32',       name: 'Dieciseisavos' },
    { key: 'round16',       name: 'Octavos'        },
    { key: 'quarterfinals', name: 'Cuartos'        },
    { key: 'semifinals',    name: 'Semifinales'    },
    { key: 'thirdPlace',    name: '3º Puesto'      },
    { key: 'final',         name: 'Final'          }
  ];

  // Generamos equipos del round32 desde la tabla de clasificación
  const round32Pairs = buildRound32FromStandings();

  rounds.forEach(round => {
    const roundDiv = document.createElement('div');
    roundDiv.className = 'bracket-round';

    const title = document.createElement('h3');
    title.innerText = round.name;
    roundDiv.appendChild(title);

    const matchesInRound = RESULTS.knockout.matches[round.key] || [];

    matchesInRound.forEach((m, idx) => {
      const matchBox = document.createElement('div');
      matchBox.className = 'matchup-box';

      // Para round32, usamos los clasificados automáticos
      let t1Name, t2Name;
      if (round.key === 'round32' && round32Pairs[idx]) {
        t1Name = round32Pairs[idx][0] || m.team1 || `Prov. ${m.match}A`;
        t2Name = round32Pairs[idx][1] || m.team2 || `Prov. ${m.match}B`;
      } else {
        t1Name = m.team1 || `Prov. ${m.match}A`;
        t2Name = m.team2 || `Prov. ${m.match}B`;
      }

      const currentHomeScore = state.knockout.userScores?.[m.match]?.home ?? '';
      const currentAwayScore = state.knockout.userScores?.[m.match]?.away ?? '';

      // Badge de clasificado automático para round32
      const autoBadge = round.key === 'round32' ? '<span class="auto-badge">Auto</span>' : '';

      matchBox.innerHTML = `
        <div class="match-number">Partido ${m.match} ${autoBadge}</div>
        <div class="team-input-row">
          <span class="team-name-bracket" title="${t1Name}">${t1Name}</span>
          <input type="number" class="match-score-input" min="0" placeholder="0" value="${currentHomeScore}"
            oninput="handleKnockoutScoreChange(${m.match}, 'home', this.value)">
        </div>
        <div class="team-input-row">
          <span class="team-name-bracket" title="${t2Name}">${t2Name}</span>
          <input type="number" class="match-score-input" min="0" placeholder="0" value="${currentAwayScore}"
            oninput="handleKnockoutScoreChange(${m.match}, 'away', this.value)">
        </div>
      `;
      roundDiv.appendChild(matchBox);
    });
    container.appendChild(roundDiv);
  });
}

// Actualiza solo los nombres de equipos en el bracket round32 sin re-renderizar todo
function refreshBracketTeams() {
  const round32Pairs = buildRound32FromStandings();
  const round32Boxes = document.querySelectorAll('.bracket-round')[0]?.querySelectorAll('.matchup-box');
  if (!round32Boxes) return;

  round32Boxes.forEach((box, idx) => {
    if (!round32Pairs[idx]) return;
    const spans = box.querySelectorAll('.team-name-bracket');
    const [t1, t2] = round32Pairs[idx];
    if (spans[0]) { spans[0].textContent = t1 || '?'; spans[0].title = t1 || '?'; }
    if (spans[1]) { spans[1].textContent = t2 || '?'; spans[1].title = t2 || '?'; }
  });
}

function handleKnockoutScoreChange(matchId, side, value) {
  if (!state.knockout.userScores) state.knockout.userScores = {};
  if (!state.knockout.userScores[matchId]) state.knockout.userScores[matchId] = { home: null, away: null };
  state.knockout.userScores[matchId][side] = value !== '' ? parseInt(value, 10) : null;
  userKnockout.userScores = state.knockout.userScores;
  saveLocalPredictionSoon();
}

// ── ENVÍO ──────────────────────────────────────────────────
function submitPrediction(playerName) {
  showLoading(true, "Sentando cátedra en el sistema...");

  const tieneGrupos = Object.keys(userGroupMatches).length > 0;
  const tieneKnockouts = Object.keys(state.knockout.userScores).length > 0;
  const faseActiva = tieneKnockouts && !tieneGrupos ? 'FASE_ELIMINATORIA' : 'FASE_DE_GRUPOS';

  const payload = {
    user: playerName,
    fase: faseActiva,
    groupMatches: userGroupMatches,
    knockout: state.knockout.userScores
  };

  const formData = new FormData();
  formData.append("entry.496944209", playerName);
  formData.append("entry.111222333", faseActiva);
  formData.append("entry.987654321", JSON.stringify(payload.groupMatches));
  formData.append("entry.444555666", JSON.stringify(payload.knockout));

  fetch(FORM_URL, {
    method: "POST",
    mode: "no-cors",
    body: formData
  })
  .then(() => {
    showLoading(false);
    document.getElementById('nameModal').style.display = 'none';
    localStorage.setItem('worldCup2026_myPrediction', JSON.stringify(payload));
    showToast(`¡Pronóstico de ${faseActiva} enviado con éxito!`);
    triggerConfetti();
  })
  .catch(err => {
    showLoading(false);
    console.error(err);
    showToast("Error al enviar el pronóstico. Inténtalo de nuevo.", true);
  });
}

function saveLocalPredictionSoon() {
  const payload = {
    user: state.user,
    groupMatches: userGroupMatches,
    knockout: state.knockout.userScores
  };
  localStorage.setItem('worldCup2026_myPrediction', JSON.stringify(payload));
}

function restoreLocalPrediction() {
  const saved = localStorage.getItem('worldCup2026_myPrediction');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      userGroupMatches = parsed.groupMatches || {};
      state.knockout.userScores = parsed.knockout || {};
      userKnockout.userScores = state.knockout.userScores;
      // Re-render con datos restaurados
      renderGroups();
      renderBracket();
    } catch(e) { console.error(e); }
  }
}

function showLoading(show, text = 'Cargando...') {
  const overlay = document.getElementById('loadingOverlay');
  if (!overlay) return;
  document.getElementById('loadingText').innerText = text;
  overlay.style.display = show ? 'flex' : 'none';
}

function showToast(msg, isError = false) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${isError ? 'error' : ''}`;
  toast.innerText = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function triggerConfetti() {
  const container = document.getElementById('confettiContainer');
  if (!container) return;
  container.innerHTML = '🎉⚽🎉⚽🎉 ¡CÁTEDRA SENTADA! ⚽🎉⚽🎉⚽';
  setTimeout(() => container.innerHTML = '', 5000);
}
