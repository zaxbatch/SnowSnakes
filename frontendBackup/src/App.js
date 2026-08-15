import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Nav from './components/Nav';
import Home from './components/Home';
import JokeList from './components/Jokes/JokeList';
import DoodleGallery from './components/Doodles/DoodleGallery';
import ComicList from './components/Comics/ComicList';
import GameGallery from './components/Games/GameGallery';
import EpisodeList from './components/Spread/EpisodeList';
import FridgeMap from './components/Fridge/FridgeMap';
import CharacterList from './components/Characters/CharacterList';
import Randomizer from './components/Randomizer/Randomizer';
import './styles/App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app">
          <Header />
          <Nav />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/jokes" element={<JokeList />} />
            <Route path="/doodles" element={<DoodleGallery />} />
            <Route path="/comics" element={<ComicList />} />
            <Route path="/games" element={<GameGallery />} />
            <Route path="/spread" element={<EpisodeList />} />
            <Route path="/fridge" element={<FridgeMap />} />
            <Route path="/characters" element={<CharacterList />} />
            <Route path="/randomizer" element={<Randomizer />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;