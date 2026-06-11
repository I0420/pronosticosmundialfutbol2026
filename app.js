/* ============================================================
   2026 FIFA World Cup Prediction Game - app.js
   ============================================================ */

/* ── Datos de equipos: nombre en español + código de bandera ── */
const TEAM_DATA = {
  "Mexico":               { name: "México",           code: "mx" },
  "South Africa":         { name: "Sudáfrica",        code: "za" },
  "Czech Republic":       { name: "Rep. Checa",       code: "cz" },
  "South Korea":          { name: "Corea del Sur",    code: "kr" },
  "Switzerland":          { name: "Suiza",            code: "ch" },
  "Canada":               { name: "Canadá",           code: "ca" },
  "Qatar":                { name: "Catar",            code: "qa" },
  "Bosnia & Herzegovina": { name: "Bosnia",           code: "ba" },
  "Brazil":               { name: "Brasil",           code: "br" },
  "Scotland":             { name: "Escocia",          code: "gb-sct" },
  "Morocco":              { name: "Marruecos",        code: "ma" },
  "Haiti":                { name: "Haití",            code: "ht" },
  "Turkey":               { name: "Turquía",          code: "tr" },
  "Paraguay":             { name: "Paraguay",         code: "py" },
  "USA":                  { name: "EE.UU.",           code: "us" },
  "Australia":            { name: "Australia",        code: "au" },
  "Ivory Coast":          { name: "Costa de Marfil",  code: "ci" },
  "Curaçao":              { name: "Curazao",          code: "cw" },
  "Ecuador":              { name: "Ecuador",          code: "ec" },
  "Germany":              { name: "Alemania",         code: "de" },
  "Netherlands":          { name: "Países Bajos",     code: "nl" },
  "Japan":                { name: "Japón",            code: "jp" },
  "Sweden":               { name: "Suecia",           code: "se" },
  "Tunisia":              { name: "Túnez",            code: "tn" },
  "Egypt":                { name: "Egipto",           code: "eg" },
  "Belgium":              { name: "Bélgica",          code: "be" },
  "New Zealand":          { name: "Nueva Zelanda",    code: "nz" },
  "Iran":                 { name: "Irán",             code: "ir" },
  "Uruguay":              { name: "Uruguay",          code: "uy" },
  "Cape Verde":           { name: "Cabo Verde",       code: "cv" },
  "Spain":                { name: "España",           code: "es" },
  "Saudi Arabia":         { name: "Arabia Saudita",   code: "sa" },
  "Norway":               { name: "Noruega",          code: "no" },
  "France":               { name: "Francia",          code: "fr" },
  "Iraq":                 { name: "Irak",             code: "iq" },
  "Senegal":              { name: "Senegal",          code: "sn" },
  "Jordan":               { name: "Jordania",         code: "jo" },
  "Argentina":            { name: "Argentina",        code: "ar" },
  "Algeria":              { name: "Argelia",          code: "dz" },
  "Austria":              { name: "Austria",          code: "at" },
  "DR Congo":             { name: "R.D. Congo",       code: "cd" },
  "Portugal":             { name: "Portugal",         code: "pt" },
  "Colombia":             { name: "Colombia",         code: "co" },
  "Uzbekistan":           { name: "Uzbekistán",       code: "uz" },
  "Ghana":                { name: "Ghana",            code: "gh" },
  "Panama":               { name: "Panamá",           code: "pa" },
  "Croatia":              { name: "Croacia",          code: "hr" },
  "England":              { name: "Inglaterra",       code: "gb-eng" }
};

function teamLabel(key) {
  const d = TEAM_DATA[key];
  if (!d) return key; // fallback para placeholders como "Prov. 73A"
  return `<span class="fi fi-${d.code}" style="margin-right:5px;vertical-align:middle;"></span>${d.name}`;
}

const LEADERBOARD_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSVvvNGujGkfjrkQbiedhJVzNl4va6QMYKCMXE2SG14OE0wAf0vczmzVHP_GMASwqBdWHbuRZI10U2x/pub?gid=481878926&single=true&output=csv';
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdmJQA-TDUR_qj4139Ez1rr0PVe87F9iZy08pNFmLjVMgYIxw/formResponse';

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
                <td class="team-col">${teamLabel(row.team)}</td>
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
            <div class="team-lbl">${teamLabel(t1)}</div>
            <input type="number" class="score-input" min="0" value="${currentHome}"
              oninput="handleGroupScoreChange('${matchKey}', 'home', this.value)">
            <span class="vs">vs</span>
            <input type="number" class="score-input" min="0" value="${currentAway}"
              oninput="handleGroupScoreChange('${matchKey}', 'away', this.value)">
            <div class="team-lbl" style="text-align:right">${teamLabel(t2)}</div>
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
            <td class="team-col">${teamLabel(row.team)}</td>
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

  // ── MODO ACTUAL: solo mostramos los 32avos como tarjetas informativas ──
  // Cuando llegue la fase eliminatoria real, el administrador:
  //   1. Edita los nombres en RESULTS.knockout.matches.round32 (results.js)
  //   2. Cambia KNOCKOUT_BETTING_OPEN = true abajo para habilitar inputs
  // ──────────────────────────────────────────────────────────────────────
  const KNOCKOUT_BETTING_OPEN = false; // ← administrador cambia a true cuando toque

  const round32Pairs = buildRound32FromStandings();
  const matchesRound32 = RESULTS.knockout.matches['round32'] || [];

  const roundDiv = document.createElement('div');
  roundDiv.className = 'bracket-round bracket-round--wide';

  const title = document.createElement('h3');
  title.innerText = 'Cruces de Dieciseisavos · Clasificación provisional';
  roundDiv.appendChild(title);

  const grid = document.createElement('div');
  grid.className = 'round32-grid';

  matchesRound32.forEach((m, idx) => {
    const pair = round32Pairs[idx] || [];
    const t1Name = pair[0] || m.team1 || `Prov. ${m.match}A`;
    const t2Name = pair[1] || m.team2 || `Prov. ${m.match}B`;

    const card = document.createElement('div');
    card.className = 'matchup-box matchup-box--info';

    if (KNOCKOUT_BETTING_OPEN) {
      // Con inputs: el usuario puede pronosticar (fase 2)
      const currentHomeScore = state.knockout.userScores?.[m.match]?.home ?? '';
      const currentAwayScore = state.knockout.userScores?.[m.match]?.away ?? '';
      card.innerHTML = `
        <div class="match-number">Partido ${m.match}</div>
        <div class="team-input-row">
          <span class="team-name-bracket" title="${t1Name}">${teamLabel(t1Name)}</span>
          <input type="number" class="match-score-input" min="0" placeholder="0" value="${currentHomeScore}"
            oninput="handleKnockoutScoreChange(${m.match}, 'home', this.value)">
        </div>
        <div class="team-input-row">
          <span class="team-name-bracket" title="${t2Name}">${teamLabel(t2Name)}</span>
          <input type="number" class="match-score-input" min="0" placeholder="0" value="${currentAwayScore}"
            oninput="handleKnockoutScoreChange(${m.match}, 'away', this.value)">
        </div>
      `;
    } else {
      // Sin inputs: solo muestra el cruce (provisional basado en pronósticos de grupos)
      card.innerHTML = `
        <div class="match-number">Partido ${m.match} <span class="auto-badge">Provisional</span></div>
        <div class="matchup-info-row">${teamLabel(t1Name)}</div>
        <div class="matchup-vs-divider">vs</div>
        <div class="matchup-info-row">${teamLabel(t2Name)}</div>
      `;
    }
    grid.appendChild(card);
  });

  roundDiv.appendChild(grid);
  container.appendChild(roundDiv);
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

  // Snapshot de clasificados según los pronósticos del usuario
  const { firsts, seconds, thirds } = getQualified();
  const round32Pairs = buildRound32FromStandings();

  const clasificados = {
    porGrupo: {},
    mejoresTerceros: thirds.map(t => ({ equipo: t.team, grupo: t.group, pts: t.pts, dg: t.dg, gf: t.gf })),
    cruces32avos: round32Pairs.map((par, idx) => ({
      partido: RESULTS.knockout.matches.round32[idx]?.match,
      equipo1: par[0] || '?',
      equipo2: par[1] || '?'
    }))
  };

  // Primero y segundo de cada grupo
  Object.keys(RESULTS.groups).forEach(groupId => {
    const tabla = calcGroupTable(groupId);
    clasificados.porGrupo[groupId] = {
      primero:  { equipo: tabla[0]?.team, pts: tabla[0]?.pts, dg: tabla[0]?.dg },
      segundo:  { equipo: tabla[1]?.team, pts: tabla[1]?.pts, dg: tabla[1]?.dg },
      tercero:  { equipo: tabla[2]?.team, pts: tabla[2]?.pts, dg: tabla[2]?.dg }
    };
  });

  const payload = {
    user: playerName,
    fase: faseActiva,
    groupMatches: userGroupMatches,
    knockout: state.knockout.userScores,
    clasificados  // ← clasificados guardados junto al pronóstico
  };

  const formData = new FormData();
  formData.append("entry.1597300776", playerName);
  formData.append("entry.1633537385", faseActiva);
  formData.append("entry.112664031", JSON.stringify(payload.groupMatches));
  formData.append("entry.634416458", JSON.stringify(payload.knockout));
  // Campo adicional con los clasificados — añade este entry en tu Google Form
  // como pregunta de texto largo y copia el ID que te dé (entry.XXXXXXXXX)
  formData.append("entry.1487290832", JSON.stringify(clasificados));

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
    // Generar y descargar imagen del pronóstico
    setTimeout(() => generatePredictionImage(playerName, payload, clasificados), 600);
  })
  .catch(err => {
    showLoading(false);
    console.error(err);
    showToast("Error al enviar el pronóstico. Inténtalo de nuevo.", true);
  });
}

function saveLocalPredictionSoon() {
  const { firsts, seconds, thirds } = getQualified();
  const round32Pairs = buildRound32FromStandings();

  const clasificados = {
    porGrupo: {},
    mejoresTerceros: thirds.map(t => ({ equipo: t.team, grupo: t.group, pts: t.pts, dg: t.dg, gf: t.gf })),
    cruces32avos: round32Pairs.map((par, idx) => ({
      partido: RESULTS.knockout.matches.round32[idx]?.match,
      equipo1: par[0] || '?',
      equipo2: par[1] || '?'
    }))
  };
  Object.keys(RESULTS.groups).forEach(groupId => {
    const tabla = calcGroupTable(groupId);
    clasificados.porGrupo[groupId] = {
      primero: { equipo: tabla[0]?.team, pts: tabla[0]?.pts, dg: tabla[0]?.dg },
      segundo: { equipo: tabla[1]?.team, pts: tabla[1]?.pts, dg: tabla[1]?.dg },
      tercero: { equipo: tabla[2]?.team, pts: tabla[2]?.pts, dg: tabla[2]?.dg }
    };
  });

  const payload = {
    user: state.user,
    groupMatches: userGroupMatches,
    knockout: state.knockout.userScores,
    clasificados
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

// ── DESCARGA DE IMAGEN DEL PRONÓSTICO ─────────────────────────
function generatePredictionImage(playerName, payload, clasificados) {
  const W = 1200;
  const groupKeys = Object.keys(RESULTS.groups);

  // Cada tarjeta de grupo tiene: título + tabla clasificación (4 filas) + separador + 6 partidos con marcador
  // Altura tarjeta: cabecera(22) + tabla(4*18+cabecera10=82) + sep(10) + 6partidos(6*20=120) + padding = ~260px
  const COLS = 4;
  const ROWS = Math.ceil(groupKeys.length / COLS);   // 3 filas de grupos
  const CARD_W = 268;
  const CARD_H = 278;
  const GAP = 16;
  const HEADER_H = 120;
  const SECTION_H = 48;
  const GRID_W = COLS * CARD_W + (COLS - 1) * GAP;
  const GRID_X = (W - GRID_W) / 2;
  const GROUPS_SECTION_H = ROWS * CARD_H + (ROWS - 1) * GAP + 20;

  const knockoutEntries = Object.entries(payload.knockout || {});
  const KO_COLS = 4;
  const KO_W = 268, KO_H = 78, KO_GAP = 16;
  const KNOCKOUT_H = knockoutEntries.length > 0
    ? Math.ceil(knockoutEntries.length / KO_COLS) * (KO_H + KO_GAP) + 20
    : 0;

  const H = HEADER_H + SECTION_H + GROUPS_SECTION_H + (KNOCKOUT_H > 0 ? SECTION_H + KNOCKOUT_H : 0) + 50;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // ── Fondo ──
  ctx.fillStyle = '#12121e';
  ctx.fillRect(0, 0, W, H);

  // Patrón sutil de puntos
  ctx.fillStyle = 'rgba(255,255,255,0.015)';
  for (let px = 0; px < W; px += 28) {
    for (let py = 0; py < H; py += 28) {
      ctx.beginPath();
      ctx.arc(px, py, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Borde superior degradado ──
  const borderGrad = ctx.createLinearGradient(0, 0, W, 0);
  borderGrad.addColorStop(0,   '#0f4c81');
  borderGrad.addColorStop(0.5, '#e0a96d');
  borderGrad.addColorStop(1,   '#0f4c81');
  ctx.fillStyle = borderGrad;
  ctx.fillRect(0, 0, W, 6);

  // ── HEADER ──
  const headerGrad = ctx.createLinearGradient(0, 6, 0, HEADER_H);
  headerGrad.addColorStop(0, '#0f4c81');
  headerGrad.addColorStop(1, '#071e36');
  ctx.fillStyle = headerGrad;
  ctx.fillRect(0, 6, W, HEADER_H - 6);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px Georgia, serif';
  ctx.fillText('🏆  PRONÓSTICOS  MUNDIAL  FIFA  2026  🏆', W / 2, 58);

  ctx.fillStyle = '#e0a96d';
  ctx.font = '18px Georgia, serif';
  ctx.fillText(
    `${playerName}  ·  ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    W / 2, 92
  );

  // ── Helper: dibujar sección titular ──
  function drawSectionTitle(label, x, y) {
    ctx.fillStyle = '#1d72b8';
    ctx.fillRect(x, y + 3, 5, 26);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, x + 14, y + 24);
  }

  // ═══════════════════════════════════════════════
  // FASE DE GRUPOS
  // ═══════════════════════════════════════════════
  let curY = HEADER_H + 10;
  drawSectionTitle('Fase de Grupos', GRID_X, curY);
  curY += SECTION_H;

  groupKeys.forEach((groupId, gi) => {
    const col = gi % COLS;
    const row = Math.floor(gi / COLS);
    const cx = GRID_X + col * (CARD_W + GAP);
    const cy = curY + row * (CARD_H + GAP);

    // Tarjeta fondo
    ctx.fillStyle = '#1e1e2e';
    roundRect(ctx, cx, cy, CARD_W, CARD_H, 8);
    ctx.fill();

    // Borde izquierdo
    ctx.fillStyle = '#0f4c81';
    ctx.fillRect(cx, cy, 4, CARD_H);

    // ── CABECERA DEL GRUPO ──
    ctx.fillStyle = 'rgba(15,76,129,0.4)';
    ctx.fillRect(cx + 4, cy, CARD_W - 4, 24);
    ctx.fillStyle = '#e0a96d';
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`GRUPO ${groupId}`, cx + 10, cy + 16);

    // ── TABLA CLASIFICACIÓN ──
    const tabla = calcGroupTable(groupId);
    const tblHeaderY = cy + 36;
    const tblCols = { pos: cx+9, name: cx+26, pj: cx+148, g: cx+169, e: cx+190, p: cx+211, pts: cx+236 };

    ctx.fillStyle = '#6a6a8a';
    ctx.font = '8.5px Arial';
    ctx.textAlign = 'center';
    ['#','Equipo','PJ','G','E','P','Pts'].forEach((h, i) => {
      const xc = [tblCols.pos, tblCols.name, tblCols.pj, tblCols.g, tblCols.e, tblCols.p, tblCols.pts][i];
      ctx.textAlign = i === 1 ? 'left' : 'center';
      ctx.fillText(h, xc + (i === 1 ? 0 : 6), tblHeaderY);
    });

    tabla.forEach((trow, ri) => {
      const ry = tblHeaderY + 14 + ri * 19;

      // Fila highlight
      if (ri < 2) {
        ctx.fillStyle = 'rgba(15,76,129,0.4)';
        ctx.fillRect(cx + 5, ry - 12, CARD_W - 10, 17);
      } else if (ri === 2) {
        ctx.fillStyle = 'rgba(224,169,109,0.15)';
        ctx.fillRect(cx + 5, ry - 12, CARD_W - 10, 17);
      }

      const tName = (TEAM_DATA[trow.team]?.name || trow.team).substring(0, 12);
      ctx.font = ri < 2 ? 'bold 9.5px Arial' : '9px Arial';
      ctx.fillStyle = ri < 2 ? '#ffffff' : '#a0a0b8';

      [String(ri+1), tName, String(trow.pj), String(trow.pg), String(trow.pe), String(trow.pp), String(trow.pts)]
        .forEach((val, i) => {
          const xc = [tblCols.pos, tblCols.name, tblCols.pj, tblCols.g, tblCols.e, tblCols.p, tblCols.pts][i];
          ctx.textAlign = i === 1 ? 'left' : 'center';
          ctx.fillText(val, xc + (i === 1 ? 0 : 6), ry);
        });
    });

    // ── SEPARADOR ──
    const sepY = tblHeaderY + 14 + 4 * 19 + 4;
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx + 10, sepY);
    ctx.lineTo(cx + CARD_W - 10, sepY);
    ctx.stroke();

    // ── PARTIDOS CON MARCADOR ──
    const teams = RESULTS.groups[groupId];
    let matchIdx = 0;
    const matchStartY = sepY + 14;
    const ROW_H = 19;

    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const t1 = teams[i], t2 = teams[j];
        const matchKey = `${t1}__${t2}`;
        const score = payload.groupMatches[matchKey];
        const h = (score?.home !== null && score?.home !== undefined && score?.home !== '') ? score.home : null;
        const a = (score?.away !== null && score?.away !== undefined && score?.away !== '') ? score.away : null;
        const hasScore = h !== null && a !== null;

        const my = matchStartY + matchIdx * ROW_H;

        // Alternar fondo sutil
        if (matchIdx % 2 === 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.03)';
          ctx.fillRect(cx + 5, my - 12, CARD_W - 10, ROW_H);
        }

        const n1 = (TEAM_DATA[t1]?.name || t1).substring(0, 11);
        const n2 = (TEAM_DATA[t2]?.name || t2).substring(0, 11);

        // Equipo local (izquierda)
        ctx.fillStyle = '#c0c0d8';
        ctx.font = '9px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(n1, cx + 10, my);

        // Marcador central
        if (hasScore) {
          // Determinar resultado para colorear
          const hNum = parseInt(h), aNum = parseInt(a);
          let scoreColor = '#e0a96d'; // empate: dorado
          if (hNum > aNum) scoreColor = '#5de0a0';   // gana local: verde
          if (hNum < aNum) scoreColor = '#e07a5d';   // gana visitante: coral

          ctx.fillStyle = scoreColor;
          ctx.font = 'bold 10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`${h} – ${a}`, cx + CARD_W / 2, my);
        } else {
          ctx.fillStyle = '#3a3a52';
          ctx.font = '9px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('– : –', cx + CARD_W / 2, my);
        }

        // Equipo visitante (derecha)
        ctx.fillStyle = '#c0c0d8';
        ctx.font = '9px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(n2, cx + CARD_W - 10, my);

        matchIdx++;
      }
    }
  });

  curY += GROUPS_SECTION_H;

  // ═══════════════════════════════════════════════
  // FASE ELIMINATORIA
  // ═══════════════════════════════════════════════
  if (knockoutEntries.length > 0) {
    drawSectionTitle('Fase Eliminatoria', GRID_X, curY);
    curY += SECTION_H;

    const round32 = RESULTS.knockout.matches.round32 || [];

    knockoutEntries.forEach(([matchId, scores], ki) => {
      const col = ki % KO_COLS;
      const row = Math.floor(ki / KO_COLS);
      const kx = GRID_X + col * (KO_W + KO_GAP);
      const ky = curY + row * (KO_H + KO_GAP);

      const matchInfo = round32.find(m => String(m.match) === String(matchId)) || {};
      const t1 = (TEAM_DATA[matchInfo.team1]?.name || matchInfo.team1 || 'Equipo A').substring(0, 17);
      const t2 = (TEAM_DATA[matchInfo.team2]?.name || matchInfo.team2 || 'Equipo B').substring(0, 17);
      const s1 = scores.home !== null && scores.home !== undefined ? scores.home : '?';
      const s2 = scores.away !== null && scores.away !== undefined ? scores.away : '?';

      ctx.fillStyle = '#1e1e2e';
      roundRect(ctx, kx, ky, KO_W, KO_H, 8);
      ctx.fill();

      // Cabecera partido
      ctx.fillStyle = 'rgba(15,76,129,0.45)';
      ctx.fillRect(kx + 4, ky, KO_W - 4, 20);
      ctx.fillStyle = '#0f4c81';
      ctx.fillRect(kx, ky, 4, KO_H);
      ctx.fillStyle = '#8ab8d8';
      ctx.font = '8.5px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Partido ${matchId}`, kx + 10, ky + 14);

      // Fila equipo 1
      const r1y = ky + 38;
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.fillRect(kx + 5, r1y - 13, KO_W - 10, 18);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10.5px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(t1, kx + 10, r1y);

      // Marcador equipo 1
      ctx.fillStyle = '#e0a96d';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(String(s1), kx + KO_W - 12, r1y);

      // Fila equipo 2
      const r2y = ky + 62;
      ctx.fillStyle = '#c0c0d8';
      ctx.font = '10px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(t2, kx + 10, r2y);

      ctx.fillStyle = '#e0a96d';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(String(s2), kx + KO_W - 12, r2y);
    });
  }

  // ── FOOTER ──
  ctx.fillStyle = '#0d0d1a';
  ctx.fillRect(0, H - 36, W, 36);
  ctx.fillStyle = '#5a5a7a';
  ctx.font = '11px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Mundial FIFA 2026  ·  Generado automáticamente  ·  ¡Mucha suerte!', W / 2, H - 13);

  // Borde inferior
  ctx.fillStyle = borderGrad;
  ctx.fillRect(0, H - 5, W, 5);

  // ── Descargar ──
  const link = document.createElement('a');
  link.download = `pronostico_mundial2026_${playerName.replace(/\s+/g, '_')}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast('📥 Imagen descargada con tu pronóstico');
}

// Utilidad: rectángulo con esquinas redondeadas
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();

// ── LEADERBOARD ─────────────────────────────────────────────────
async function loadLeaderboard() {
  const container = document.getElementById('leaderboardContent');
  container.innerHTML = '<p class="note-text" style="margin-top:20px;">Cargando ranking...</p>';

  try {
    const res = await fetch(LEADERBOARD_CSV_URL);
    const text = await res.text();
    const rows = text.trim().split('\n').slice(1); // saltar encabezado

    if (!rows.length || rows[0].trim() === '') {
      container.innerHTML = '<p class="note-text" style="margin-top:20px;">Aún no hay datos.</p>';
      return;
    }

    // Parsear y ordenar por puntos
    const players = rows
      .map(row => {
        const cols = row.split(',');
        return {
          name: (cols[0] || '').replace(/^"|"$/g, '').trim(),
          pts:  parseInt((cols[1] || '0').replace(/^"|"$/g, '').trim(), 10) || 0
        };
      })
      .filter(p => p.name)
      .sort((a, b) => b.pts - a.pts);

    const medals = ['🥇', '🥈', '🥉'];

    container.innerHTML = `
      <div class="leaderboard-table">
        ${players.map((p, i) => `
          <div class="lb-row ${i === 0 ? 'lb-first' : i === 1 ? 'lb-second' : i === 2 ? 'lb-third' : ''}">
            <span class="lb-pos">${medals[i] || (i + 1)}</span>
            <span class="lb-name">${p.name}</span>
            <span class="lb-pts">${p.pts} <small>pts</small></span>
          </div>
        `).join('')}
      </div>
    `;
  } catch (e) {
    container.innerHTML = '<p class="note-text" style="color:var(--error-color)">Error al cargar el ranking. Intenta de nuevo.</p>';
    console.error(e);
  
}
}
