import React, { useEffect, useState } from "react";
import Modal from "../modals/Modal";
import { Track, Genre } from "../types";
import { getGenres } from "../api/tracks";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface EditTrackModalProps {
  onClose: () => void;
  track: Track;
  onUpdated: (updatedTrack: Track) => void;
}

const trackSchema = z.object({
  title: z.string().min(1, "Title is required"),
  artist: z.string().min(1, "Artist is required"),
  album: z.string().optional(),
  coverImage: z.string().url("Invalid URL").optional().or(z.literal("")),
  genres: z.array(z.string()).optional(),
});

type TrackFormData = z.infer<typeof trackSchema>;

const EditTrackModal: React.FC<EditTrackModalProps> = ({ onClose, track, onUpdated }) => {
  const [genres, setGenres] = useState<Genre[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TrackFormData>({
    resolver: zodResolver(trackSchema),
    defaultValues: {
      title: track.title,
      artist: track.artist,
      album: track.album || "",
      coverImage: track.coverImage || "",
      genres: track.genres || [],
    },
  });

  const selectedGenres = watch("genres") ?? [];

  useEffect(() => {
    getGenres()
      .then((names) => setGenres(names.map((name) => ({ name }))))
      .catch(() => setGenres([]));
  }, []);

  const handleAddGenre = (genre: Genre) => {
    if (!selectedGenres.includes(genre.name)) {
      setValue("genres", [...selectedGenres, genre.name]);
    }
  };

  const handleRemoveGenre = (genre: Genre) => {
    setValue("genres", selectedGenres.filter((name) => name !== genre.name));
  };

  const onSubmit = async (data: TrackFormData) => {
    try {
      const res = await fetch(`http://localhost:8000/api/tracks/${track.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to update track");

      const updatedTrack = await res.json();
      onUpdated(updatedTrack);
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An error occurred. Please try again.");
    }
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="text-xl font-bold mb-4">Edit track</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <input
            {...register("title")}
            placeholder="Track name"
            className="w-full border p-2 rounded"
          />
          {errors.title && <p className="text-red-600">{errors.title.message}</p>}
        </div>

        <div>
          <input
            {...register("artist")}
            placeholder="Artist"
            className="w-full border p-2 rounded"
          />
          {errors.artist && <p className="text-red-600">{errors.artist.message}</p>}
        </div>

        <input {...register("album")} placeholder="Album" className="w-full border p-2 rounded" />
        <input
          {...register("coverImage")}
          placeholder="Cover link (URL)"
          className="w-full border p-2 rounded"
        />
        {errors.coverImage && <p className="text-red-600">{errors.coverImage.message}</p>}

        <div>
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedGenres.map((name) => (
              <span
                key={name}
                className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center gap-1"
              >
                {name}
                <button
                  type="button"
                  onClick={() => handleRemoveGenre({ name })}
                  className="text-red-500 font-bold"
                >
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
                .filter((g) => !selectedGenres.includes(g.name))
                .map((genre) => (
                  <button
                    type="button"
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
          type="submit"
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Update
        </button>
      </form>
    </Modal>
  );
};

export default EditTrackModal;
