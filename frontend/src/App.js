import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DeleteModeProvider } from './context/DeleteModeContext'; // ✅ Import
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
import './styles/App.css';

function App() {
  const [showGameModal, setShowGameModal] = useState(false);

  return (
    <AuthProvider>
      <DeleteModeProvider>   {/* ✅ Wrap with DeleteModeProvider */}
        <BrowserRouter>
          <div className="app">
            <Header showGameModal={showGameModal} setShowGameModal={setShowGameModal} />
            <Nav />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/jokes" element={<JokeList />} />
              <Route path="/doodles" element={<DoodleGallery />} />
              <Route path="/comics" element={<ComicList />} />
              <Route path="/games" element={<GameGallery setShowGameModal={setShowGameModal} />} />
              <Route path="/spread" element={<EpisodeList />} />
              <Route path="/randomizer" element={<Randomizer />} />
              <Route path="/admin" element={<AdminPanel />} />
            </Routes>
          </div>
        </BrowserRouter>
      </DeleteModeProvider>
    </AuthProvider>
  );
}

export default App;