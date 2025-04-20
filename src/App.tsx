import { Routes, Route, Navigate } from "react-router-dom";
import TracksPage from "./pages/TracksPage";

function App() {
  return (
    <Routes>
      <Route path="/tracks" element={<TracksPage />} />
      <Route path="*" element={<Navigate to="/tracks" replace />} />
    </Routes>
  );
}

export default App;
