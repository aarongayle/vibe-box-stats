import { Navigate, Route, Routes } from 'react-router-dom';

import TeamDashboard from './pages/TeamDashboard';
import TeamSelect from './pages/TeamSelect';

function App() {
  return (
    <Routes>
      <Route path="/" element={<TeamSelect />} />
      <Route path="/:teamSlug" element={<TeamDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
