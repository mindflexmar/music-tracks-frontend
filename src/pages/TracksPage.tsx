import React, { useEffect, useState } from "react";
import { Track } from "../types";
import CreateTrackModal from "../modals/CreateTrackModal";
import { Button } from "../components/ui/button";

const TracksPage: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8000/tracks")
      .then((res) => res.json())
      .then((data) => setTracks(data))
      .catch((error) => {
        console.error("Failed to fetch tracks:", error);
      });
  }, []);

  const handleOpenModal = () => setModalOpen(true);
  const handleCloseModal = () => setModalOpen(false);

  const handleCreated = (newTrack: Track) => {
    setTracks((prev) => [...prev, newTrack]);
    handleCloseModal();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Tracks</h1>
        <Button onClick={handleOpenModal}>Create a track</Button>
      </div>

      <ul className="space-y-2">
        {tracks.map((track) => (
          <li key={track.id} className="p-4 rounded shadow bg-white">
            <div className="font-semibold">{track.title}</div>
            <div className="text-sm text-gray-600">{track.artist}</div>
          </li>
        ))}
      </ul>

      <CreateTrackModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onCreated={handleCreated}
      />
    </div>
  );
};

export default TracksPage;
