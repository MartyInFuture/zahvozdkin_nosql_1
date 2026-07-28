const spotify = db.getSiblingDB("spotify");

// --- Завдання 1. Треки для вечірки ---
const partyTracksQueries = {
  "audio_features.danceability": { $gt: 0.7 },
  "audio_features.energy": { $gt: 0.7 },
  duration_ms: { $gte: 180000, $lte: 300000 },
};

const partyTracksCount = spotify.tracks.countDocuments(partyTracksQueries);
const partyTracksExamples = spotify.tracks.find(partyTracksQueries).limit(3).toArray();

print("=== Завдання 1: треки для вечірки ===");
print(`Знайдено: ${partyTracksCount}`);
print("Приклади:");
printjson(partyTracksExamples);

// --- Завдання 2. Виконавці, у яких усі треки популярні ---
const popularArtists = spotify.tracks.aggregate([
  { $unwind: "$artists" },
  {
    $group: {
      _id: "$artists",
      track_count: { $sum: 1 },
      min_popularity: { $min: "$popularity" },
      max_popularity: { $max: "$popularity" },
      avg_popularity: { $avg: "$popularity" },
    },
  },
  {
    $match: {
      track_count: { $gte: 3 },
      min_popularity: { $gte: 60 },
    },
  },
  {
    $project: {
      _id: 0,
      artist: "$_id",
      track_count: 1,
      min_popularity: { $round: ["$min_popularity", 1] },
      max_popularity: { $round: ["$max_popularity", 1] },
      avg_popularity: { $round: ["$avg_popularity", 1] },
    },
  },
  { $sort: { avg_popularity: -1 } },
  { $limit: 20 },
]).toArray();

print("=== Завдання 2. Виконавці, у яких усі треки популярні ===");
printjson(popularArtists);

// --- Завдання 3. Нетипові треки ---
const outliersByGenre = spotify.tracks.aggregate([
  {
    $group: {
      _id: "$track_genre",
      avg_tempo: { $avg: "$audio_features.tempo" },
      std_tempo: { $stdDevPop: "$audio_features.tempo" },
      tracks: {
        $push: {
          _id: "$_id",
          track_name: "$track_name",
          popularity: "$popularity",
          artists: "$artists",
          audio_features: { tempo: "$audio_features.tempo" },
        },
      },
    },
  },
  {
    $addFields: {
      outlier_threshold: {
        $add: ["$avg_tempo", { $multiply: [2, "$std_tempo"] }],
      },
    },
  },
  {
    $project: {
      _id: 0,
      genre: "$_id",
      avg_tempo: { $round: ["$avg_tempo", 1] },
      outlier_threshold: { $round: ["$outlier_threshold", 1] },
      outlier_tracks: {
        $filter: {
          input: "$tracks",
          as: "t",
          cond: {
            $gt: ["$$t.audio_features.tempo", "$outlier_threshold"],
          },
        },
      },
    },
  },
]).toArray();

print("=== Завдання 3: нетипові треки ===");
print(`Жанрів у вибірці: ${outliersByGenre.length}`);

const totalOutliers = outliersByGenre.reduce((sum, g) => sum + g.outlier_tracks.length, 0);
print(`Нетипових треків загалом: ${totalOutliers}`);

// --- Завдання 4: Треки для фонової роботи ---
const focusFilterQueries = {
  "audio_features.loudness": { $lt: -10 },
  "audio_features.speechiness": { $lt: 0.1 },
  "audio_features.instrumentalness": { $gt: 0.5 },
  explicit: false,
};

const focusTracksCount = spotify.tracks.countDocuments(focusFilterQueries);
const focusTracksExamples = spotify.tracks.find(focusFilterQueries).limit(3).toArray();

print("=== Завдання 4: треки для фонової роботи ===");
print(`Знайдено: ${focusTracksCount}`);
printjson(focusTracksExamples);
