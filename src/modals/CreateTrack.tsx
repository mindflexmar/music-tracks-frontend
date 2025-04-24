import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import { Track, Genre } from "../types";
import { createTrack, getGenres } from "../api/tracks";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trackSchema } from "../validation/trackSchema";

type CreateTrackFormData = z.infer<typeof trackSchema>;

interface CreateTrackModalProps {
  onClose: () => void;
  onCreated: (newTrack: Track) => void;
}

const CreateTrackModal: React.FC<CreateTrackModalProps> = ({ onClose, onCreated }) => {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateTrackFormData>({
    resolver: zodResolver(trackSchema),
    defaultValues: {
      title: "",
      artist: "",
      album: "",
      coverImage: "",
      genres: [],
    },
  });

  const selectedGenres = watch("genres") ?? [];

  useEffect(() => {
    getGenres()
      .then((names: string[]) => setGenres(names.map((name) => ({ name }))))
      .catch(() => setGenres([]));
  }, []);

  const onSubmit = async (data: CreateTrackFormData) => {
    try {
      const newTrack = await createTrack(data);
      onCreated(newTrack);
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    }
  };

  const handleAddGenre = (genre: Genre) => {
    if (!selectedGenres.includes(genre.name)) {
      setValue("genres", [...selectedGenres, genre.name]);
    }
  };

  const handleRemoveGenre = (genre: Genre) => {
    setValue(
      "genres",
      selectedGenres.filter((g) => g !== genre.name)
    );
  };

  return (
    <Modal onClose={onClose}>
      <h2 data-testid="create-track-modal-header" className="text-xl font-bold mb-4">Create Track</h2>

      {error && <p data-testid="error-message" className="text-red-600 mb-2">{error}</p>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" data-testid="track-form">
        <div>
          <input
            data-testid="input-title"
            className="w-full border p-2 rounded"
            placeholder="Track name"
            {...register("title")}
          />
          {errors.title && <p data-testid="error-title" className="text-red-600 text-sm">{errors.title.message}</p>}
        </div>

        <div>
          <input
            data-testid="input-artist"
            className="w-full border p-2 rounded"
            placeholder="Artist"
            {...register("artist")}
          />
          {errors.artist && <p data-testid="error-artist" className="text-red-600 text-sm">{errors.artist.message}</p>}
        </div>

        <div>
          <input
            data-testid="input-album"
            className="w-full border p-2 rounded"
            placeholder="Album"
            {...register("album")}
          />
        </div>

        <div>
          <input
            data-testid="input-cover-image"
            className="w-full border p-2 rounded"
            placeholder="Cover link (URL)"
            {...register("coverImage")}
          />
          {errors.coverImage && <p data-testid="error-coverImage" className="text-red-600 text-sm">{errors.coverImage.message}</p>}
        </div>

        <div>
          <div className="flex flex-wrap gap-2 mb-2" data-testid="selected-genres">
            {selectedGenres.map((genre) => (
              <span
                key={genre}
                className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center gap-1"
              >
                {genre}
                <button
                  type="button"
                  onClick={() => handleRemoveGenre({ name: genre })}
                  className="text-red-500 font-bold"
                  data-testid={`remove-genre-${genre}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <details className="mb-2" data-testid="genre-dropdown">
            <summary className="cursor-pointer hover:text-gray-800 mb-1">
              + Add genre
            </summary>
            <div className="mt-1 flex flex-wrap gap-2">
              {genres
                .filter((g) => !selectedGenres.includes(g.name))
                .map((genre) => (
                  <button
                    key={genre.name}
                    type="button"
                    onClick={() => handleAddGenre(genre)}
                    className="border border-gray-300 px-3 py-1 rounded-full text-sm hover:bg-gray-100"
                    data-testid={`add-genre-${genre.name}`}
                  >
                    {genre.name}
                  </button>
                ))}
            </div>
          </details>
        </div>

        <button
          data-testid="submit-button"
          type="submit"
          className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
        >
          Create
        </button>
      </form>
    </Modal>
  );
};

export default CreateTrackModal;
