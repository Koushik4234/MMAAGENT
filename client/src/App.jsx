import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import EmbedPage from './pages/EmbedPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import VoicePage from './pages/VoicePage.jsx';

export default function App() {
  return (
    <Routes>
      {/* No header/nav so it fits inside the widget iframe */}
      <Route path="/embed" element={<EmbedPage />} />

      <Route element={<Layout />}>
        <Route path="/" element={<VoicePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}
