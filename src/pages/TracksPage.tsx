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
import "../index.css";

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

  const getCoverImageUrl = (coverImage: string) => {
    if (!coverImage) return "default-cover.jpg";
    return coverImage.startsWith("http") ? coverImage : `${import.meta.env.VITE_API_URL}/${coverImage}`;
  };

  return (
    <div className="p-6 space-y-4">
    <div className="flex justify-between items-center">
      <h1 data-testid="tracks-header" className="text-2xl font-bold">Tracks</h1>
      <Button
        data-testid="create-track-button"
        className="create-btn"
        onClick={() => setCreateModalOpen(true)}
      >
        +
      </Button>
    </div>
  
    <div className="flex gap-4 items-center">
      <input
        type="checkbox"
        data-testid="select-all"
        checked={paginatedTracks.every((t) => selectedTrackIds.includes(t.id))}
        onChange={() =>
          paginatedTracks.every((t) => selectedTrackIds.includes(t.id))
            ? clearSelection()
            : selectAllTracks()
        }
      />
      <span>Select all on this page</span>
      {selectedTrackIds.length > 0 && (
        <Button
          data-testid="bulk-delete-button"
          variant="destructive"
          onClick={deleteSelectedTracks}
        >
          Delete selected ({selectedTrackIds.length})
        </Button>
      )}
    </div>
  
    <div className="search-bar flex gap-2 items-center">
      <input
        data-testid="search-input"
        type="text"
        placeholder="Search by artist, track or album"
        value={searchQuery}
        onChange={(e) => handleSearchChange(e.target.value)}
      />
      <select
        data-testid="filter-genre"
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
  
    <ul>
      {paginatedTracks.map((track) => (
        <li key={track.id} className="track-card" data-testid={`track-item-${track.id}`}>
          <div className="track-top">
            <div className="track-info">
              {track.coverImage && (
                <img
                  src={getCoverImageUrl(track.coverImage)}
                  alt={`${track.title} cover`}
                  className="cover-image"
                />
              )}
            </div>
            <div className="track-details">
              <div data-testid={`track-item-${track.id}-title`} className="track-title">
                {track.title}
              </div>
              <div data-testid={`track-item-${track.id}-artist`} className="track-artist">
                {track.artist}
              </div>
              <div className="track-album">{track.album}</div>
  
              {track.audioFile ? (
                <div
                  className="custom-audio-player"
                  data-testid={`audio-player-${track.id}`}
                >
                  <button
                    className="play-pause"
                    data-testid={`play-button-${track.id}`}
                    onClick={() => handlePlay(track.id)}
                  >
                    ▶
                  </button>
                  <div
                    className="progress-bar"
                    data-testid={`audio-progress-${track.id}`}
                  >
                    <div className="progress" />
                  </div>
                  <span className="time">00:00</span>
                  <audio
                    ref={(el) => {
                      audioRefs.current[track.id] = el;
                    }}
                    onPlay={() => handlePlay(track.id)}
                    src={`${import.meta.env.VITE_API_URL}/uploads/${track.audioFile}`}
                  />
                  <button
                    onClick={() => handleDeleteFile(track.id)}
                    title="Delete audio file"
                  >
                    🗑
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    accept=".mp3,.wav"
                    onChange={(e) =>
                      handleFileChange(track.id, e.target.files ? e.target.files[0] : null)
                    }
                  />
                  <button 
                    data-testid={`upload-track-${track.id}`}
                    onClick={() => handleUpload(track.id)}
                  >
                    Upload file
                  </button>
                </>
              )}
            </div>
          </div>
  
          <div className="track-actions">
              <button onClick={() => {
                setCurrentTrack(track);
                setEditModalOpen(true);
              }}>
                Edit
              </button>
              <button onClick={() => handleDeleteTrack(track.id)}>🗑 Delete track</button>
            </div>
          </li>
      ))}
    </ul>
  
    <div className="pagination flex gap-2 items-center" data-testid="pagination">
      <button
        data-testid="pagination-prev"
        disabled={currentPage === 1}
        onClick={() => setCurrentPage((p) => p - 1)}
      >
        ← Prev
      </button>
      <span>Page {currentPage} of {totalPages}</span>
      <button
        data-testid="pagination-next"
        disabled={currentPage === totalPages}
        onClick={() => setCurrentPage((p) => p + 1)}
      >
        Next →
      </button>
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
