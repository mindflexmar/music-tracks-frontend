import React, { useEffect, useState, useMemo, useRef } from "react";
import { Track } from "../types";
import CreateTrackModal from "../modals/CreateTrack";
import EditTrackModal from "../modals/EditTrack";
import { Button } from "../components/ui/button";
import {
  getTracks,
  uploadTrackFile,
  deleteTrackFile,
  deleteTrack,
} from "../api/tracks";
import debounce from "lodash.debounce";

const ITEMS_PER_PAGE = 5;
const DEBOUNCE_DELAY = 300;

const TracksPage: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [uploadFiles, setUploadFiles] = useState<Record<string, File | null>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedGenre, setSelectedGenre] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  const debouncedSearch = useMemo(
    () => debounce((value: string) => setDebouncedSearchQuery(value), DEBOUNCE_DELAY),
    []
  );

  useEffect(() => {
    getTracks()
      .then((data) => setTracks(data))
      .catch((error) => console.error("Failed to fetch tracks:", error));

    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    debouncedSearch(value);
    setCurrentPage(1);
  };

  const handleFileChange = (trackId: string, file: File | null) => {
    setUploadFiles((prev) => ({ ...prev, [trackId]: file }));
  };

  const handleUpload = async (trackId: string) => {
    const file = uploadFiles[trackId];
    if (!file) return alert("Select file before uploading");

    if (!["audio/mpeg", "audio/wav"].includes(file.type)) {
      return alert("Only MP3 or WAV files are supported.");
    }

    if (file.size > 10 * 1024 * 1024) {
      return alert("The file is too large (maximum 10 MB).");
    }

    const previousTrack = tracks.find((t) => t.id === trackId);
    if (!previousTrack) return;

    try {
      setTracks((prev) =>
        prev.map((track) =>
          track.id === trackId ? { ...track, audioFile: "uploading" } : track
        )
      );

      const updatedTrack = await uploadTrackFile(trackId, file);

      setTracks((prev) =>
        prev.map((track) => (track.id === updatedTrack.id ? updatedTrack : track))
      );

      setUploadFiles((prev) => ({ ...prev, [trackId]: null }));
    } catch (err: any) {
      alert(err.message || "The file could not be uploaded.");
      setTracks((prev) =>
        prev.map((track) =>
          track.id === previousTrack.id ? previousTrack : track
        )
      );
    }
  };

  const handleDeleteFile = async (trackId: string) => {
    try {
      const updatedTrack = await deleteTrackFile(trackId);
      setTracks((prev) =>
        prev.map((track) => (track.id === updatedTrack.id ? updatedTrack : track))
      );
    } catch (err: any) {
      alert(err.message || "The file could not be deleted.");
    }
  };

  const handleDeleteTrack = async (trackId: string) => {
    if (!confirm("Are you sure you want to delete this track?")) return;

    const previousTracks = [...tracks];
    setTracks((prev) => prev.filter((track) => track.id !== trackId));

    try {
      await deleteTrack(trackId);
    } catch (err: any) {
      alert(err.message || "The track could not be deleted.");
      setTracks(previousTracks);
    }
  };

  const toggleTrackSelection = (id: string) => {
    setSelectedTrackIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const selectAllTracks = () => {
    const allIds = paginatedTracks.map((t) => t.id);
    setSelectedTrackIds(allIds);
  };

  const clearSelection = () => {
    setSelectedTrackIds([]);
  };

  const deleteSelectedTracks = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedTrackIds.length} track(s)?`)) return;

    const toDelete = [...selectedTrackIds];
    setTracks((prev) => prev.filter((t) => !toDelete.includes(t.id)));
    setSelectedTrackIds([]);

    try {
      await Promise.all(toDelete.map((id) => deleteTrack(id)));
    } catch (e: any) {
      alert("Some tracks couldn't be deleted");
      console.error(e);
    }
  };

  const handlePlay = (trackId: string) => {
    if (activeAudioId && activeAudioId !== trackId) {
      const prevAudio = audioRefs.current[activeAudioId];
      if (prevAudio) {
        prevAudio.pause();
        prevAudio.currentTime = 0;
      }
    }
    setActiveAudioId(trackId);
  };

  const filteredTracks = useMemo(() => {
    return tracks.filter((track) => {
      const query = debouncedSearchQuery.toLowerCase();
      const matchesQuery =
        !query ||
        track.artist.toLowerCase().includes(query) ||
        track.title.toLowerCase().includes(query) ||
        (track.album && track.album.toLowerCase().includes(query));
      const matchesGenre = !selectedGenre || (track.genres || []).includes(selectedGenre);
      return matchesQuery && matchesGenre;
    });
  }, [tracks, selectedGenre, debouncedSearchQuery]);

  const paginatedTracks = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTracks.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTracks, currentPage]);

  const totalPages = Math.ceil(filteredTracks.length / ITEMS_PER_PAGE);

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 data-testid="tracks-header" className="text-2xl font-bold">Tracks</h1>
        <Button data-testid="create-track-button" onClick={() => setCreateModalOpen(true)}>Create a track</Button>
      </div>

      <div className="flex gap-4 items-center">
        <input
          type="checkbox"
          checked={paginatedTracks.every((t) => selectedTrackIds.includes(t.id))}
          onChange={() =>
            paginatedTracks.every((t) => selectedTrackIds.includes(t.id))
              ? clearSelection()
              : selectAllTracks()
          }
        />
        <span>Select all on this page</span>
        {selectedTrackIds.length > 0 && (
          <Button variant="destructive" onClick={deleteSelectedTracks}>
            Delete selected ({selectedTrackIds.length})
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <input
          type="text"
          placeholder="Search by artist, track or album"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="border p-2 rounded"
        />
        <select
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">All genres</option>
          {Array.from(new Set(tracks.flatMap((t) => t.genres || []))).map((genre) => (
            <option key={genre}>{genre}</option>
          ))}
        </select>
      </div>

      <ul className="space-y-4">
        {paginatedTracks.map((track) => (
          <li key={track.id} className="p-4 rounded shadow bg-white space-y-2">
            <div className="font-semibold">{track.title}</div>
            <div className="text-sm text-gray-600">{track.artist}</div>
            <div className="text-sm text-gray-500">{track.album}</div>

            {track.audioFile ? (
              <div className="space-y-2">
                <audio
                  controls
                  ref={(el) => {
                    audioRefs.current[track.id] = el;
                  }}
                  onPlay={() => handlePlay(track.id)}
                  src={`${import.meta.env.VITE_API_URL}/${track.audioFile}`}
                  className="w-full"
                />
                <Button variant="destructive" onClick={() => handleDeleteFile(track.id)}>
                  🗑 Delete the file
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="file"
                  accept=".mp3,.wav"
                  onChange={(e) =>
                    handleFileChange(track.id, e.target.files ? e.target.files[0] : null)
                  }
                />
                <Button onClick={() => handleUpload(track.id)}>Upload file</Button>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={() => {
                setCurrentTrack(track);
                setEditModalOpen(true);
              }}>
                Edit
              </Button>
              <Button variant="destructive" onClick={() => handleDeleteTrack(track.id)}>
                🗑 Delete track
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex justify-between items-center">
        <Button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
          ← Prev
        </Button>
        <span>Page {currentPage} of {totalPages}</span>
        <Button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
          Next →
        </Button>
      </div>

      {isCreateModalOpen && (
        <CreateTrackModal
          onClose={() => setCreateModalOpen(false)}
          onCreated={(newTrack) => {
            setTracks((prev) => [...prev, newTrack]);
            setCreateModalOpen(false);
          }}
        />
      )}

      {isEditModalOpen && currentTrack && (
        <EditTrackModal
          onClose={() => {
            setEditModalOpen(false);
            setCurrentTrack(null);
          }}
          track={currentTrack}
          onUpdated={(updated) => {
            setTracks((prev) =>
              prev.map((t) => (t.id === updated.id ? updated : t))
            );
            setEditModalOpen(false);
            setCurrentTrack(null);
          }}
        />
      )}
    </div>
  );
};

export default TracksPage;
