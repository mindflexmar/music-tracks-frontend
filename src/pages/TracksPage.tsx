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

const TracksPage: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [uploadFiles, setUploadFiles] = useState<Record<string, File | null>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedGenre, setSelectedGenre] = useState("");
  const [searchArtist, setSearchArtist] = useState("");
  const [searchTrack, setSearchTrack] = useState("");
  const [searchAlbum, setSearchAlbum] = useState("");
  const [selectedArtist, setSelectedArtist] = useState("");

  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  const debouncedSearchArtist = useMemo(() => debounce((value: string) => setSearchArtist(value), 300), []);
  const debouncedSearchTrack = useMemo(() => debounce((value: string) => setSearchTrack(value), 300), []);
  const debouncedSearchAlbum = useMemo(() => debounce((value: string) => setSearchAlbum(value), 300), []);

  useEffect(() => {
    getTracks()
      .then((data) => setTracks(data))
      .catch((error) => {
        console.error("Failed to fetch tracks:", error);
      });

    return () => {
      debouncedSearchArtist.cancel();
      debouncedSearchTrack.cancel();
      debouncedSearchAlbum.cancel();
    };
  }, [debouncedSearchArtist, debouncedSearchTrack, debouncedSearchAlbum]);

  const handleSearchChange = (value: string) => {
    debouncedSearchArtist(value);
    setSelectedArtist(value);
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

    try {
      const updatedTrack = await uploadTrackFile(trackId, file);
      setTracks((prev) =>
        prev.map((track) => (track.id === updatedTrack.id ? updatedTrack : track))
      );
      setUploadFiles((prev) => ({ ...prev, [trackId]: null }));
    } catch (err: any) {
      alert(err.message || "The file could not be uploaded.");
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
    try {
      await deleteTrack(trackId);
      setTracks((prev) => prev.filter((track) => track.id !== trackId));
    } catch (err: any) {
      alert(err.message || "The track could not be deleted.");
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
      const matchesGenre = selectedGenre ? track.genres?.includes(selectedGenre) : true;
      const matchesArtist = searchArtist
        ? track.artist.toLowerCase().includes(searchArtist.toLowerCase())
        : true;
      const matchesTrack = searchTrack
        ? track.title.toLowerCase().includes(searchTrack.toLowerCase())
        : true;
      const matchesAlbum = searchAlbum
        ? (track.album && track.album.toLowerCase().includes(searchAlbum.toLowerCase())) || false
        : true;
      
      return matchesGenre && matchesArtist && matchesTrack && matchesAlbum;
    });
  }, [tracks, selectedGenre, searchArtist, searchTrack, searchAlbum]);

  const paginatedTracks = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTracks.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTracks, currentPage]);

  const totalPages = Math.ceil(filteredTracks.length / ITEMS_PER_PAGE);

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tracks</h1>
        <Button onClick={() => setCreateModalOpen(true)}>Create a track</Button>
      </div>

      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Filter by artist"
          defaultValue={searchArtist}
          onChange={(e) => {
            handleSearchChange(e.target.value);
          }}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Filter by track name"
          defaultValue={searchTrack}
          onChange={(e) => debouncedSearchTrack(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Filter by album name"
          defaultValue={searchAlbum}
          onChange={(e) => debouncedSearchAlbum(e.target.value)}
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
                  ref={(el: HTMLAudioElement | null) => {
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
