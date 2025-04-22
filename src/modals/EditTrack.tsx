import React, { useEffect, useRef, useState } from "react";
import Modal from "../modals/Modal";
import { Track, Genre } from "../types";
import { getGenres } from "../api/tracks";

interface EditTrackModalProps {
  onClose: () => void;
  track: Track;
  onUpdated: (updatedTrack: Track) => void;
}

const EditTrackModal: React.FC<EditTrackModalProps> = ({
  onClose,
  track,
  onUpdated,
}) => {
  const titleRef = useRef<HTMLInputElement>(null);
  const artistRef = useRef<HTMLInputElement>(null);
  const albumRef = useRef<HTMLInputElement>(null);
  const coverUrlRef = useRef<HTMLInputElement>(null);

  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    setSelectedGenres(track.genres.map((name: string) => ({ name })));

    getGenres()
      .then((names: string[]) => setGenres(names.map((name) => ({ name }))))
      .catch(() => setGenres([]));

    if (titleRef.current) titleRef.current.value = track.title;
    if (artistRef.current) artistRef.current.value = track.artist;
    if (albumRef.current) albumRef.current.value = track.album || "";
    if (coverUrlRef.current) coverUrlRef.current.value = track.coverUrl || "";
  }, [track]);

  const handleAddGenre = (genre: Genre) => {
    if (!selectedGenres.find((g) => g.name === genre.name)) {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handleRemoveGenre = (genre: Genre) => {
    setSelectedGenres(selectedGenres.filter((g) => g.name !== genre.name));
  };

  const handleUpdate = async () => {
    const title = titleRef.current?.value.trim() || "";
    const artist = artistRef.current?.value.trim() || "";
    const album = albumRef.current?.value || "";
    const coverUrl = coverUrlRef.current?.value || "";

    if (!title || !artist) {
      setError("Title and artist are required fields.");
      return;
    }

    try {
      const res = await fetch(`http://localhost:8000/api/tracks/${track.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          artist,
          album,
          coverUrl,
          genres: selectedGenres.map((g) => g.name),
        }),
      });

      if (!res.ok) throw new Error("Failed to update track.");

      const updatedTrack = await res.json();
      onUpdated(updatedTrack);
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    }
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="text-xl font-bold mb-4">Edit track</h2>

      {error && <p className="text-red-600 mb-2">{error}</p>}

      <div className="space-y-3">
        <input ref={titleRef} className="w-full border p-2 rounded" placeholder="Track name" />
        <input ref={artistRef} className="w-full border p-2 rounded" placeholder="Artist" />
        <input ref={albumRef} className="w-full border p-2 rounded" placeholder="Album" />
        <input ref={coverUrlRef} className="w-full border p-2 rounded" placeholder="Cover link (URL)" />

        <div>
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedGenres.map((genre) => (
              <span
                key={genre.name}
                className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center gap-1"
              >
                {genre.name}
                <button onClick={() => handleRemoveGenre(genre)} className="text-red-500 font-bold">
                  ×
                </button>
              </span>
            ))}
          </div>

          <details className="mb-2">
            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 mb-1">
              + Add genre
            </summary>
            <div className="mt-1 flex flex-wrap gap-2">
              {genres
                .filter((g) => !selectedGenres.some((s) => s.name === g.name))
                .map((genre) => (
                  <button
                    key={genre.name}
                    onClick={() => handleAddGenre(genre)}
                    className="border border-gray-300 px-3 py-1 rounded-full text-sm hover:bg-gray-100"
                  >
                    {genre.name}
                  </button>
                ))}
            </div>
          </details>
        </div>

        <button
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          onClick={handleUpdate}
        >
          Update
        </button>
      </div>
    </Modal>
  );
};

export default EditTrackModal;
