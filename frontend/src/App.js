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

// Global SUBMIT + REFRESH buttons shown on content pages. The label and the
// modal that opens match the current page's content type (joke / comic /
// doodle / game). Pages with their own submit UI (/games, /spread) or that
// need no submission (/randomizer, /admin) skip the bar. Refresh remounts
// the current route so the page's own useEffect data fetch runs again.
function GlobalActionBar({
  setShowGameModal, setShowJokeModal, setShowDoodleModal, setShowComicModal, refreshPage,
}) {
  const location = useLocation();
  const path = location.pathname;
  if (path === '/spread' || path === '/games' || path === '/randomizer' || path === '/admin') return null;

  const actions = {
    '/jokes':   { label: 'SUBMIT JOKE',   open: () => setShowJokeModal(true) },
    '/comics':  { label: 'SUBMIT COMIC',  open: () => setShowComicModal(true) },
    '/doodles': { label: 'SUBMIT DOODLE', open: () => setShowDoodleModal(true) },
    '/':        { label: 'SUBMIT GAME',   open: () => setShowGameModal(true) },
  };
  const action = actions[path] || actions['/'];

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
      <button className="btn btn-success" onClick={action.open}>
        <i className="fas fa-upload"></i> {action.label}
      </button>
      <button className="btn btn-secondary" onClick={refreshPage}>
        <i className="fas fa-sync"></i> REFRESH
      </button>
    </div>
  );
}

function App() {
  const [showGameModal, setShowGameModal] = useState(false);
  const [showJokeModal, setShowJokeModal] = useState(false);
  const [showDoodleModal, setShowDoodleModal] = useState(false);
  const [showComicModal, setShowComicModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <AuthProvider>
      <DeleteModeProvider>
        <KillerModeProvider>
          <BrowserRouter>
            {/* ✅ Banner OUTSIDE the .app container */}
            <MarqueeBanner />
            <div className="app">
              <Header
                showGameModal={showGameModal}
                setShowGameModal={setShowGameModal}
                showJokeModal={showJokeModal}
                setShowJokeModal={setShowJokeModal}
                showDoodleModal={showDoodleModal}
                setShowDoodleModal={setShowDoodleModal}
                showComicModal={showComicModal}
                setShowComicModal={setShowComicModal}
              />
              <Nav />
              <GlobalActionBar
                setShowGameModal={setShowGameModal}
                setShowJokeModal={setShowJokeModal}
                setShowDoodleModal={setShowDoodleModal}
                setShowComicModal={setShowComicModal}
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