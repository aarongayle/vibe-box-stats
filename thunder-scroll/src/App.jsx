import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TeamSelection from './components/TeamSelection';
import TeamPage from './components/TeamPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TeamSelection />} />
        <Route path="/:teamSlug" element={<TeamPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
