import { Track } from "../types";

const TrackCard = ({ track }: { track: Track }) => {
  return (
    <div style={{ border: "1px solid #ccc", padding: "1rem", borderRadius: "8px" }}>
      <h3>{track.title}</h3>
      <p>{track.artist}</p>
      <p>{track.album}</p>
      <div>
        {track.genres.map((g) => (
          <span key={g} style={{ marginRight: "0.5rem" }}>#{g}</span>
        ))}
      </div>
      {track.coverUrl ? (
        <img src={track.coverUrl} alt="cover" width={100} />
      ) : (
        <div style={{ width: 100, height: 100, background: "#eee" }}>No cover</div>
      )}
    </div>
  );
};

export default TrackCard;
