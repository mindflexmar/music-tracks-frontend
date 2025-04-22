import React, { useEffect, useState } from "react";
import { Track } from "../types";
import CreateTrackModal from "../modals/CreateTrack";
import EditTrackModal from "../modals/EditTrack";
import { Button } from "../components/ui/button";
import {
  getTracks,
  createTrack,
  updateTrack,
  uploadTrackFile,
  deleteTrackFile,
  deleteTrack,
} from "../api/tracks";

const TracksPage: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [uploadFiles, setUploadFiles] = useState<Record<string, File | null>>({});

  useEffect(() => {
    getTracks()
      .then((data) => setTracks(data))
      .catch((error) => {
        console.error("Failed to fetch tracks:", error);
      });
  }, []);

  const handleOpenCreateModal = () => setCreateModalOpen(true);
  const handleCloseCreateModal = () => setCreateModalOpen(false);

  const handleOpenEditModal = (track: Track) => {
    setCurrentTrack(track);
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setCurrentTrack(null);
  };

  const handleCreated = (newTrack: Track) => {
    setTracks((prev) => [...prev, newTrack]);
    handleCloseCreateModal();
  };

  const handleUpdated = (updatedTrack: Track) => {
    setTracks((prev) =>
      prev.map((track) => (track.id === updatedTrack.id ? updatedTrack : track))
    );
    handleCloseEditModal();
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
      alert(err.message || "The file could not be downloaded.");
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Tracks</h1>
        <Button onClick={handleOpenCreateModal}>Create a track</Button>
      </div>

      <ul className="space-y-4">
        {tracks.map((track) => (
          <li key={track.id} className="p-4 rounded shadow bg-white space-y-2">
            <div className="font-semibold">{track.title}</div>
            <div className="text-sm text-gray-600">{track.artist}</div>

            {track.audioFile ? (
              <div className="space-y-2">
                <audio controls src={`${import.meta.env.VITE_API_URL}/${track.audioFile}`} className="w-full" />
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
                <Button onClick={() => handleUpload(track.id)}>Download the file</Button>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={() => handleOpenEditModal(track)}>Edit</Button>
              <Button variant="destructive" onClick={() => handleDeleteTrack(track.id)}>
                🗑 Delete track
              </Button>
            </div>
          </li>
        ))}
      </ul>


      {isCreateModalOpen && (
        <CreateTrackModal
          onClose={handleCloseCreateModal}
          onCreated={handleCreated}
        />
      )}

      {currentTrack && isEditModalOpen && (
        <EditTrackModal
          onClose={handleCloseEditModal}
          track={currentTrack}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
};

export default TracksPage;
