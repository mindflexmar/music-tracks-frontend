import React, { useEffect, useState } from "react";
import { Track } from "../types";
import CreateTrackModal from "../modals/CreateTrack";
import EditTrackModal from "../modals/EditTrack";
import { Button } from "../components/ui/button";

const TracksPage: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/tracks")
      .then((res) => res.json())
      .then((data) => setTracks(data.data))
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Tracks</h1>
        <Button onClick={handleOpenCreateModal}>Create a track</Button>
      </div>

      <ul className="space-y-2">
        {tracks.map((track) => (
          <li key={track.id} className="p-4 rounded shadow bg-white">
            <div className="font-semibold">{track.title}</div>
            <div className="text-sm text-gray-600">{track.artist}</div>
            <Button onClick={() => handleOpenEditModal(track)} className="mt-2">
              Edit
            </Button>
          </li>
        ))}
      </ul>

      <CreateTrackModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onCreated={handleCreated}
      />

      {currentTrack && (
        <EditTrackModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          track={currentTrack}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
};

export default TracksPage;
