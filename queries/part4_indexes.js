const spotify = db.getSiblingDB("spotify");

// --- Завдання 1. Аналіз запиту та індексація ---
const queryFilter = {
  track_genre: "pop",
  "audio_features.danceability": { $gte: 0.7 },
};
const querySort = { popularity: -1 };

function printExplain(label, explainResult) {
  print(`\n=== ${label} ===`);
  print(`stage: ${explainResult.queryPlanner.winningPlan.stage}`);
  print(`totalDocsExamined: ${explainResult.executionStats.totalDocsExamined}`);
  print(`totalKeysExamined: ${explainResult.executionStats.totalKeysExamined}`);
  print(`nReturned: ${explainResult.executionStats.nReturned}`);
  print(`executionTimeMillis: ${explainResult.executionStats.executionTimeMillis}`);
  print("winningPlan:");
  printjson(explainResult.queryPlanner.winningPlan);
}

print("=== Індекси зараз (до) ===");
printjson(spotify.tracks.getIndexes());

printExplain(
  "EXPLAIN до створення індексу",
  spotify.tracks.find(queryFilter).sort(querySort).explain("executionStats")
);

spotify.tracks.createIndex(
  {
    track_genre: 1,
    "audio_features.danceability": 1,
    popularity: -1,
  },
  { name: "genre_danceability_popularity" }
);

print("\n=== Індекси після createIndex ===");
printjson(spotify.tracks.getIndexes());

printExplain(
  "EXPLAIN після створення індексу",
  spotify.tracks.find(queryFilter).sort(querySort).explain("executionStats")
);

// --- Завдання 2. Індекс для інших полів ---
const focusFilter = {
  explicit: false,
  "audio_features.speechiness": { $lt: 0.1 },
  "audio_features.instrumentalness": { $gt: 0.5 },
};

spotify.tracks.createIndex(
  {
    explicit: 1,
    "audio_features.speechiness": 1,
    "audio_features.instrumentalness": 1,
  },
  { name: "explicit_speechiness_instrumentalness" }
);

print("\n=== Завдання 2: індекси ===");
printjson(spotify.tracks.getIndexes());

printExplain(
  "EXPLAIN: пошук музики для роботи (індекс explicit/speechiness/instrumentalness)",
  spotify.tracks.find(focusFilter).explain("executionStats")
);

// --- Завдання 3. Покривний запит? ---
const coveredProbeFilter = {
  track_genre: "pop",
  popularity: { $gte: 70 },
};

printExplain(
  "EXPLAIN завдання 3: genre + popularity",
  spotify.tracks.find(coveredProbeFilter).explain("executionStats")
);
