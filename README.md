
Implemented Features
1. Bulk Deletion

Description: Users can select multiple tracks on the current page and delete them in a single action.
Implementation Details:
A "Select all on this page" checkbox is provided at the top of the tracks list to toggle the selection of all tracks on the current page (selectAllTracks and clearSelection functions).
Individual track selection is managed via the toggleTrackSelection function, which adds or removes track IDs from the selectedTrackIds state.
When at least one track is selected, a "Delete selected" button appears, showing the number of selected tracks (selectedTrackIds.length).
The deleteSelectedTracks function handles bulk deletion:
A confirmation dialog is shown to prevent accidental deletion.
Selected tracks are optimistically removed from the UI by filtering them out of the tracks state.
The selectedTrackIds state is cleared.
A Promise.all call sends individual DELETE requests for each selected track using the deleteTrack API function.
If any deletion fails, an alert is shown, but the UI does not revert (partial success is allowed).
The feature is scoped to the current page, as paginatedTracks is used to determine selectable tracks.



2. Optimistic Updates

Changes to the track list (single track deletion, bulk deletion, and file uploads) are reflected in the UI immediately before server confirmation.

Single Track Deletion (handleDeleteTrack):
The track is removed from the tracks state immediately.
The previous state is stored in previousTracks for potential rollback.
A DELETE request is sent via the deleteTrack API function.
If the request fails, an alert is shown, and the tracks state is reverted to previousTracks.
Bulk Deletion (deleteSelectedTracks):
Selected tracks are removed from the tracks state, and selectedTrackIds is cleared immediately.
Multiple DELETE requests are sent concurrently using Promise.all.
If any request fails, an alert is shown, but the UI does not revert (no rollback implemented for bulk deletion).
File Upload (handleUpload):
The track’s audioFile is set to "uploading" in the UI to indicate progress.
The previous track state is stored for rollback.
The uploadTrackFile API function is called to upload the file.
On success, the track is updated in the tracks state with the server response.
On failure, an alert is shown, and the track is reverted to its previous state.


