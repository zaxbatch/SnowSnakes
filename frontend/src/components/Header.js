import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const [showDoodleModal, setShowDoodleModal] = useState(false);
  const [showComicModal, setShowComicModal] = useState(false);
  const [showJokeModal, setShowJokeModal] = useState(false);

  // Joke form state
  const [jokeContent, setJokeContent] = useState('');
  const [jokePunchline, setJokePunchline] = useState('');
  const [jokeTags, setJokeTags] = useState('');
  const [jokeSeries, setJokeSeries] = useState('');

  // Doodle form state
  const [doodleTitle, setDoodleTitle] = useState('');
  const [doodleImage, setDoodleImage] = useState('🎨');
  const [doodleJokeId, setDoodleJokeId] = useState('');
  const [doodleCharacterId, setDoodleCharacterId] = useState('');

  // Comic form state
  const [comicTitle, setComicTitle] = useState('');
  const [comicScene, setComicScene] = useState('📢');
  const [comicDialogue, setComicDialogue] = useState('');
  const [comicCaption, setComicCaption] = useState('');
  const [comicCharacters, setComicCharacters] = useState('');

  const handleAddJoke = async (e) => {
    e.preventDefault();
    try {
      await api.post('/jokes', {
        content: jokeContent,
        punchline: jokePunchline,
        tags: jokeTags.split(',').map(t => t.trim()).filter(Boolean),
        series: jokeSeries,
      });
      setShowJokeModal(false);
      setJokeContent('');
      setJokePunchline('');
      setJokeTags('');
      setJokeSeries('');
      alert('😂 Joke added successfully!');
    } catch (err) {
      alert('Error adding joke: ' + err.message);
    }
  };

  const handleAddDoodle = async (e) => {
    e.preventDefault();
    try {
      await api.post('/doodles', {
        title: doodleTitle,
        image_url: doodleImage,
        joke_id: doodleJokeId || null,
        character_id: doodleCharacterId || null,
      });
      setShowDoodleModal(false);
      setDoodleTitle('');
      setDoodleImage('🎨');
      setDoodleJokeId('');
      setDoodleCharacterId('');
      alert('🎨 Doodle added successfully!');
    } catch (err) {
      alert('Error adding doodle: ' + err.message);
    }
  };

  const handleAddComic = async (e) => {
    e.preventDefault();
    try {
      await api.post('/comics', {
        title: comicTitle,
        scene: comicScene,
        dialogue: comicDialogue,
        caption: comicCaption,
        characters: comicCharacters.split(',').map(c => c.trim()).filter(Boolean),
      });
      setShowComicModal(false);
      setComicTitle('');
      setComicScene('📢');
      setComicDialogue('');
      setComicCaption('');
      setComicCharacters('');
      alert('📢 Comic published successfully!');
    } catch (err) {
      alert('Error adding comic: ' + err.message);
    }
  };

  return (
    <>
      <header className="header">
        <div className="logo">
          <span className="snow-snake s-first">🐍</span>
          <span className="letter-s">S</span><span>now</span>
          <span className="snow-snake s-second">🐍</span>
          <span className="letter-s">S</span><span>nakes</span>
          <span className="subtitle">— Submit Games!</span>
        </div>
        <div className="header-actions">
          <div className="user-profile">
            {user ? (
              <div className="user-info">
                <span className="user-avatar">{user.avatar}</span>
                <span className="user-name">{user.display_name}</span>
                <button className="btn btn-danger btn-sm" onClick={logout}>
                  <i className="fas fa-sign-out-alt"></i>
                </button>
              </div>
            ) : (
              <button className="btn btn-secondary" onClick={() => alert('Login coming soon!')}>
                <i className="fas fa-sign-in-alt"></i> LOGIN
              </button>
            )}
          </div>
          <button className="btn btn-warning">
            <i className="fas fa-skull"></i> KILLER MODE
          </button>
          <button className="btn btn-success" onClick={() => setShowJokeModal(true)}>
            <i className="fas fa-plus"></i> ADD JOKE
          </button>
          <button className="btn btn-pink" onClick={() => setShowDoodleModal(true)}>
            <i className="fas fa-palette"></i> ADD DOODLE
          </button>
          <button className="btn btn-purple" onClick={() => setShowComicModal(true)}>
            <i className="fas fa-bullhorn"></i> NEW COMIC
          </button>
        </div>
      </header>

      {/* JOKE MODAL */}
      {showJokeModal && (
        <div className="modal-overlay active" onClick={() => setShowJokeModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🐍 Add a Joke</h2>
              <button className="modal-close" onClick={() => setShowJokeModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddJoke}>
              <div className="form-group">
                <label>❓ QUESTION / SETUP <span style={{ color: '#ff0000' }}>*</span></label>
                <textarea className="form-control" value={jokeContent} onChange={(e) => setJokeContent(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>💡 PUNCHLINE / ANSWER <span style={{ color: '#7f8c8d' }}>(optional)</span></label>
                <input className="form-control" value={jokePunchline} onChange={(e) => setJokePunchline(e.target.value)} placeholder="Click to reveal answer" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>🏷️ TAGS (comma separated)</label>
                  <input className="form-control" value={jokeTags} onChange={(e) => setJokeTags(e.target.value)} placeholder="dad-joke, science" />
                </div>
                <div className="form-group">
                  <label>📚 SERIES</label>
                  <input className="form-control" value={jokeSeries} onChange={(e) => setJokeSeries(e.target.value)} placeholder="e.g., Science Jokes" />
                </div>
              </div>
              <button className="btn btn-success" type="submit" style={{ width: '100%' }}>
                <i className="fas fa-save"></i> SAVE JOKE
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DOODLE MODAL (already existing) */}
      {showDoodleModal && (
        <div className="modal-overlay active" onClick={() => setShowDoodleModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🎨 Add a Doodle</h2>
              <button className="modal-close" onClick={() => setShowDoodleModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddDoodle}>
              <div className="form-group">
                <label>TITLE</label>
                <input className="form-control" value={doodleTitle} onChange={(e) => setDoodleTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>DOODLE EMOJI</label>
                <input className="form-control" value={doodleImage} onChange={(e) => setDoodleImage(e.target.value)} maxLength={2} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>JOKE ID (optional)</label>
                  <input className="form-control" type="number" value={doodleJokeId} onChange={(e) => setDoodleJokeId(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>CHARACTER ID (optional)</label>
                  <input className="form-control" type="number" value={doodleCharacterId} onChange={(e) => setDoodleCharacterId(e.target.value)} />
                </div>
              </div>
              <button className="btn btn-success" type="submit" style={{ width: '100%' }}>
                <i className="fas fa-upload"></i> UPLOAD DOODLE
              </button>
            </form>
          </div>
        </div>
      )}

      {/* COMIC MODAL (already existing) */}
      {showComicModal && (
        <div className="modal-overlay active" onClick={() => setShowComicModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📢 Create a Comic</h2>
              <button className="modal-close" onClick={() => setShowComicModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddComic}>
              <div className="form-group">
                <label>TITLE</label>
                <input className="form-control" value={comicTitle} onChange={(e) => setComicTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>SCENE EMOJI</label>
                <input className="form-control" value={comicScene} onChange={(e) => setComicScene(e.target.value)} maxLength={2} />
              </div>
              <div className="form-group">
                <label>DIALOGUE</label>
                <textarea className="form-control" value={comicDialogue} onChange={(e) => setComicDialogue(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>CAPTION</label>
                <input className="form-control" value={comicCaption} onChange={(e) => setComicCaption(e.target.value)} />
              </div>
              <div className="form-group">
                <label>CHARACTERS (comma separated)</label>
                <input className="form-control" value={comicCharacters} onChange={(e) => setComicCharacters(e.target.value)} placeholder="Mayo, Ketchup, Salsa" />
              </div>
              <button className="btn btn-purple" type="submit" style={{ width: '100%' }}>
                <i className="fas fa-save"></i> PUBLISH COMIC
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;