import React, { useEffect, useState } from "react";
import Modal from "../modals/Modal";
import { Track, Genre } from "../types";

interface CreateTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newTrack: Track) => void;
}

const CreateTrackModal: React.FC<CreateTrackModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [album, setAlbum] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetch("http://localhost:8000/genres")
        .then((res) => res.json())
        .then(setGenres)
        .catch(() => setGenres([]));
    }
  }, [isOpen]);

  const handleAddGenre = (genre: Genre) => {
    if (!selectedGenres.find((g) => g.name === genre.name)) {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handleRemoveGenre = (genre: Genre) => {
    setSelectedGenres(selectedGenres.filter((g) => g.name !== genre.name));
  };

  const handleCreate = async () => {
    if (!title.trim() || !artist.trim()) {
      setError("Title and artist are required fields.");
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          artist,
          album,
          coverUrl,
          genres: selectedGenres.map((g) => g.name),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create track.");
      }

      const newTrack = await res.json();
      onCreated(newTrack);
      onClose();

      // Reset state
      setTitle("");
      setArtist("");
      setAlbum("");
      setCoverUrl("");
      setSelectedGenres([]);
      setError("");
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-bold mb-4">Створити трек</h2>

      {error && <p className="text-red-600 mb-2">{error}</p>}

      <div className="space-y-3">
        <input
          className="w-full border p-2 rounded"
          placeholder="Track name"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="w-full border p-2 rounded"
          placeholder="Artist"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
        />
        <input
          className="w-full border p-2 rounded"
          placeholder="Album"
          value={album}
          onChange={(e) => setAlbum(e.target.value)}
        />
        <input
          className="w-full border p-2 rounded"
          placeholder="Cover link (URL)"
          value={coverUrl}
          onChange={(e) => setCoverUrl(e.target.value)}
        />

        <div>
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedGenres.map((genre) => (
              <span
                key={genre.name}
                className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center gap-1"
              >
                {genre.name}
                <button
                  onClick={() => handleRemoveGenre(genre)}
                  className="text-red-500 font-bold"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <details className="mb-2">
            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 mb-1">
              + Додати жанр
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
          className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
          onClick={handleCreate}
        >
          Create
        </button>
      </div>
    </Modal>
  );
};

export default CreateTrackModal;
