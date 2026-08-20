import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DeleteModeProvider } from './context/DeleteModeContext';
import { KillerModeProvider } from './context/KillerModeContext';
import Header from './components/Header';
import Nav from './components/Nav';
import Home from './components/Home';
import JokeList from './components/Jokes/JokeList';
import DoodleGallery from './components/Doodles/DoodleGallery';
import ComicList from './components/Comics/ComicList';
import GameGallery from './components/Games/GameGallery';
import EpisodeList from './components/Spread/EpisodeList';
import Randomizer from './components/Randomizer/Randomizer';
import AdminPanel from './components/Admin/AdminPanel';
import SnowSnakeEasterEgg from './components/SnowSnakeEasterEgg';
import MarqueeBanner from './components/MarqueeBanner';
import './styles/App.css';

// Global SUBMIT GAME + REFRESH buttons shown on every page except
// Spread Da Word (/spread). GameGallery already has its own pair on
// /games, so that page is skipped too. Refresh remounts the current
// route so the page's own useEffect data fetch runs again.
function GlobalActionBar({ showGameModal, refreshPage }) {
  const location = useLocation();
  if (location.pathname === '/spread' || location.pathname === '/games') return null;

  return (
    <div
      className="global-action-bar"
      style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '16px',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}
    >
      <button className="btn btn-success" onClick={() => showGameModal(true)}>
        <i className="fas fa-upload"></i> SUBMIT GAME
      </button>
      <button className="btn btn-secondary" onClick={refreshPage}>
        <i className="fas fa-sync"></i> REFRESH
      </button>
    </div>
  );
}

function App() {
  const [showGameModal, setShowGameModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <AuthProvider>
      <DeleteModeProvider>
        <KillerModeProvider>
          <BrowserRouter>
            {/* ✅ Banner OUTSIDE the .app container */}
            <MarqueeBanner />
            <div className="app">
              <Header showGameModal={showGameModal} setShowGameModal={setShowGameModal} />
              <Nav />
              <GlobalActionBar
                showGameModal={setShowGameModal}
                refreshPage={() => setRefreshKey((k) => k + 1)}
              />
              <Routes key={refreshKey}>
                <Route path="/" element={<Home />} />
                <Route path="/jokes" element={<JokeList />} />
                <Route path="/doodles" element={<DoodleGallery />} />
                <Route path="/comics" element={<ComicList />} />
                <Route path="/games" element={<GameGallery setShowGameModal={setShowGameModal} />} />
                <Route path="/spread" element={<EpisodeList />} />
                <Route path="/randomizer" element={<Randomizer />} />
                <Route path="/admin" element={<AdminPanel />} />
              </Routes>
              <SnowSnakeEasterEgg />
            </div>
          </BrowserRouter>
        </KillerModeProvider>
      </DeleteModeProvider>
    </AuthProvider>
  );
}

export default App;