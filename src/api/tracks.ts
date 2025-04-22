import { Track } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function getTracks(): Promise<Track[]> {
  const res = await fetch(`${API_URL}/api/tracks`);
  const data = await res.json();
  return data.data;
}

export async function createTrack(payload: Partial<Track>): Promise<Track> {
  const res = await fetch(`${API_URL}/api/tracks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return await res.json();
}

export async function updateTrack(id: string, payload: Partial<Track>): Promise<Track> {
  const res = await fetch(`${API_URL}/api/tracks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return await res.json();
}

export async function uploadTrackFile(trackId: string, file: File): Promise<Track> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/tracks/${trackId}/upload`, {
    method: "POST",
    body: formData,
  });
  return await res.json();
}

export async function deleteTrackFile(trackId: string): Promise<Track> {
  const res = await fetch(`${API_URL}/api/tracks/${trackId}/file`, {
    method: "DELETE" });
  return await res.json();
}

export async function getGenres(): Promise<string[]> {
  const res = await fetch(`${API_URL}/api/genres`);
  const data = await res.json();
  return data;
}
