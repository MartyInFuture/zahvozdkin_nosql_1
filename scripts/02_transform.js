const spotify = db.getSiblingDB("spotify");

spotify.tracks_raw.aggregate([
  {
    $project: {
      _id: '$_id',
      track_id: '$track_id',
      track_name: '$track_name',
      album_name: '$album_name',
      explicit: '$explicit',
      popularity: '$popularity',
      duration_ms: '$duration_ms',
      duration_sec: {
        $round: [{ $divide: ['$duration_ms', 1000] }, 1]
      },
      track_genre: '$track_genre',
      artists: {
        $map: {
          input: { $split: ["$artists", ";"] },
          in: {
            $trim: { input: "$$this" }
          }
        },
      },
      audio_features: {
        danceability: '$danceability',
        energy: '$energy',
        loudness: '$loudness',
        speechiness: '$speechiness',
        acousticness: '$acousticness',
        instrumentalness: '$instrumentalness',
        liveness: '$liveness',
        valence: '$valence',
        tempo: '$tempo',
        key: '$key',
        mode: '$mode',
        time_signature: '$time_signature',
      },
      popularity_tier: {
        $switch: {
          branches: [
            { case: { $gte: ['$popularity', 70] }, then: 'high' },
            { case: { $gte: ['$popularity', 40] }, then: 'medium' },
          ],
          default: 'low'
        }
      }
    }
  },
  {
    $out: 'tracks'
  }
]);

print(spotify.tracks.countDocuments());
printjson(spotify.tracks.findOne());