/* ============================================================
   2026 FIFA World Cup Prediction Game - results.js
   Base de datos oficial de Grupos, Equipos y Llaves de Eliminación
   ============================================================ */

const RESULTS = {
  // 12 grupos del Mundial 2026 (4 equipos por grupo)
  "groups": {
    "A": ["Mexico", "South Africa", "Czech Republic", "South Korea"],
    "B": ["Switzerland", "Canada", "Qatar", "Bosnia & Herzegovina"],
    "C": ["Brazil", "Scotland", "Morocco", "Haiti"],
    "D": ["Turkey", "Paraguay", "USA", "Australia"],
    "E": ["Ivory Coast", "Curaçao", "Ecuador", "Germany"],
    "F": ["Netherlands", "Japan", "Sweden", "Tunisia"],
    "G": ["Egypt", "Belgium", "New Zealand", "Iran"],
    "H": ["Uruguay", "Cape Verde", "Spain", "Saudi Arabia"],
    "I": ["Norway", "France", "Iraq", "Senegal"],
    "J": ["Jordan", "Argentina", "Algeria", "Austria"],
    "K": ["DR Congo", "Portugal", "Colombia", "Uzbekistan"],
    "L": ["Ghana", "Panama", "Croatia", "England"]
  },

  // Estructura de la Fase Eliminatoria (Knockouts)
  // Los nombres de los equipos en round32 se sobreescriben automáticamente
  // desde calcGroupTable() / buildRound32FromStandings() en app.js.
  // Los rounds posteriores se editan manualmente cuando avance el torneo.
  "knockout": {
    "matches": {
      "round32": [
        { "match": 73,  "team1": "1º A", "team2": "2º B" },
        { "match": 74,  "team1": "1º C", "team2": "2º D" },
        { "match": 75,  "team1": "1º E", "team2": "2º F" },
        { "match": 76,  "team1": "1º G", "team2": "2º H" },
        { "match": 77,  "team1": "1º I", "team2": "2º J" },
        { "match": 78,  "team1": "1º K", "team2": "2º L" },
        { "match": 79,  "team1": "1º B", "team2": "2º A" },
        { "match": 80,  "team1": "1º D", "team2": "2º C" },
        { "match": 81,  "team1": "1º F", "team2": "2º E" },
        { "match": 82,  "team1": "1º H", "team2": "2º G" },
        { "match": 83,  "team1": "1º J", "team2": "2º I" },
        { "match": 84,  "team1": "1º L", "team2": "2º K" },
        { "match": 85,  "team1": "3º Mejor 1", "team2": "3º Mejor 2" },
        { "match": 86,  "team1": "3º Mejor 3", "team2": "3º Mejor 4" },
        { "match": 87,  "team1": "3º Mejor 5", "team2": "3º Mejor 6" },
        { "match": 88,  "team1": "3º Mejor 7", "team2": "3º Mejor 8" }
      ],
      "round16": [
        { "match": 89, "team1": "Ganador 73", "team2": "Ganador 75" },
        { "match": 90, "team1": "Ganador 74", "team2": "Ganador 77" },
        { "match": 91, "team1": "Ganador 76", "team2": "Ganador 85" },
        { "match": 92, "team1": "Ganador 79", "team2": "Ganador 80" },
        { "match": 93, "team1": "Ganador 81", "team2": "Ganador 82" },
        { "match": 94, "team1": "Ganador 83", "team2": "Ganador 86" },
        { "match": 95, "team1": "Ganador 78", "team2": "Ganador 87" },
        { "match": 96, "team1": "Ganador 84", "team2": "Ganador 88" }
      ],
      "quarterfinals": [
        { "match": 97, "team1": "Ganador 89", "team2": "Ganador 90" },
        { "match": 98, "team1": "Ganador 91", "team2": "Ganador 92" },
        { "match": 99, "team1": "Ganador 93", "team2": "Ganador 94" },
        { "match": 100, "team1": "Ganador 95", "team2": "Ganador 96" }
      ],
      "semifinals": [
        { "match": 101, "team1": "Ganador 97", "team2": "Ganador 98" },
        { "match": 102, "team1": "Ganador 99", "team2": "Ganador 100" }
      ],
      "thirdPlace": [
        { "match": 103, "team1": "Perdedor 101", "team2": "Perdedor 102" }
      ],
      "final": [
        { "match": 104, "team1": "Ganador 101", "team2": "Ganador 102" }
      ]
    }
  }
};
