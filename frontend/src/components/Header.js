import React, { useContext, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { AuthContext } from '../context/AuthContext';
import { useDeleteMode } from '../context/DeleteModeContext';
import { useKillerMode } from '../context/KillerModeContext';
import api from '../api';

const Header = ({
  showGameModal, setShowGameModal,
  showJokeModal, setShowJokeModal,
  showDoodleModal, setShowDoodleModal,
  showComicModal, setShowComicModal,
}) => {
  const { user, logout, login, register } = useContext(AuthContext);
  const { deleteMode, setDeleteMode } = useDeleteMode();
  const { killerMode, setKillerMode } = useKillerMode();

  // ─── State for Killer Mode info modal ──────────────────
  const [showKillerInfo, setShowKillerInfo] = useState(false);
  const [dontShowKillerInfo, setDontShowKillerInfo] = useState(false);

  // ─── Auth modal state ───
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // ─── Other modals (joke/doodle/comic state lifted to App for the
  //     page-aware SUBMIT buttons on the global action bar) ───

  // ─── Joke form state ───
  const [jokeContent, setJokeContent] = useState('');
  const [jokePunchline, setJokePunchline] = useState('');
  const [jokeTags, setJokeTags] = useState('');
  const [jokeSeries, setJokeSeries] = useState('');

  // ─── Doodle form state ───
  const [doodleTitle, setDoodleTitle] = useState('');
  const [doodleImageUrl, setDoodleImageUrl] = useState('');
  const [doodleImagePreview, setDoodleImagePreview] = useState('');
  const [doodleJokeId, setDoodleJokeId] = useState('');
  const [doodleCharacterId, setDoodleCharacterId] = useState('');

  // ─── Comic form state ───
  const [comicTitle, setComicTitle] = useState('');
  const [comicImageUrl, setComicImageUrl] = useState('');
  const [comicImagePreview, setComicImagePreview] = useState('');
  const [comicScene, setComicScene] = useState('📢');
  const [comicDialogue, setComicDialogue] = useState('');
  const [comicCaption, setComicCaption] = useState('');
  const [comicCharacters, setComicCharacters] = useState('');

  // ─── Game form state ───
  const [gameTitle, setGameTitle] = useState('');
  const [gameDescription, setGameDescription] = useState('');
  const [gameIconEmoji, setGameIconEmoji] = useState('🎮');
  const [gameIconImageUrl, setGameIconImageUrl] = useState('');
  const [gameIconImagePreview, setGameIconImagePreview] = useState('');
  const [gameTags, setGameTags] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [gameFiles, setGameFiles] = useState([]);
  const [gameFilesList, setGameFilesList] = useState([]);
  const [isUploadingGame, setIsUploadingGame] = useState(false);

  // ─── Cloudinary Widget ───
  const openWidget = (setImageUrl, setPreview) => {
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: 'r6natkse',
        uploadPreset: 'snowsnakes_unsigned',
        folder: 'snowsnakes',
        sources: ['local', 'url', 'camera'],
        multiple: false,
        maxFiles: 1,
        resourceType: 'image',
      },
      (error, result) => {
        if (error) {
          console.error('Upload error:', error);
          alert('Upload failed. Please try again.');
          return;
        }
        if (result.event === 'success') {
          const url = result.info.secure_url;
          setImageUrl(url);
          if (setPreview) setPreview(url);
          alert('✅ Image uploaded successfully!');
        }
      }
    );
    widget.open();
  };

  // ─── Auth handler ─────────────────────────────────────
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    try {
      if (authMode === 'login') {
        await login(authUsername, authPassword);
      } else {
        await register(authUsername, authPassword, authEmail);
      }
      setShowAuthModal(false);
      setAuthUsername('');
      setAuthPassword('');
      setAuthEmail('');
      setShowLoginPassword(false);
      setShowRegisterPassword(false);
      alert('✅ Success!');
      window.location.reload();
    } catch (err) {
      alert('Authentication failed: ' + err.message);
    }
  };

  // ─── Killer Mode toggle handler ──────────────────────
  const handleKillerToggle = () => {
    // Check if the info has been shown before
    const infoShown = localStorage.getItem('killerModeInfoShown');
    if (!infoShown) {
      // Show the info modal
      setShowKillerInfo(true);
      // Don't toggle killer mode yet – wait for modal close
    } else {
      // Toggle directly
      setKillerMode(!killerMode);
    }
  };

  const closeKillerInfo = () => {
    if (dontShowKillerInfo) {
      localStorage.setItem('killerModeInfoShown', 'true');
    }
    setShowKillerInfo(false);
    // Now toggle killer mode (activate it)
    setKillerMode(!killerMode);
  };

  // ─── Form Handlers ──────────────────────────────────────

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
      window.location.reload();
    } catch (err) {
      alert('Error adding joke: ' + err.message);
    }
  };

  const handleAddDoodle = async (e) => {
    e.preventDefault();
    if (!doodleImageUrl) {
      alert('Please upload an image first!');
      return;
    }
    try {
      await api.post('/doodles', {
        title: doodleTitle,
        image_url: doodleImageUrl,
        joke_id: doodleJokeId || null,
        character_id: doodleCharacterId || null,
      });
      setShowDoodleModal(false);
      setDoodleTitle('');
      setDoodleImageUrl('');
      setDoodleImagePreview('');
      setDoodleJokeId('');
      setDoodleCharacterId('');
      alert('🎨 Doodle added successfully!');
      window.location.reload();
    } catch (err) {
      alert('Error adding doodle: ' + err.message);
    }
  };

  const handleAddComic = async (e) => {
    e.preventDefault();
    try {
      await api.post('/comics', {
        title: comicTitle,
        image_url: comicImageUrl || null,
        scene: comicScene,
        dialogue: comicDialogue,
        caption: comicCaption,
        characters: comicCharacters.split(',').map(c => c.trim()).filter(Boolean),
      });
      setShowComicModal(false);
      setComicTitle('');
      setComicImageUrl('');
      setComicImagePreview('');
      setComicScene('📢');
      setComicDialogue('');
      setComicCaption('');
      setComicCharacters('');
      alert('📢 Comic published successfully!');
      window.location.reload();
    } catch (err) {
      alert('Error adding comic: ' + err.message);
    }
  };

  // ─── Game ───────────────────────────────────────────────

  const handleGameFileChange = (e) => {
    const files = Array.from(e.target.files);
    setGameFiles(files);
    setGameFilesList(files.map(f => f.name));
  };

  const resetGameForm = () => {
    setGameTitle('');
    setGameDescription('');
    setGameIconEmoji('🎮');
    setGameIconImageUrl('');
    setGameIconImagePreview('');
    setGameTags('');
    setGameCode('');
    setGameFiles([]);
    setGameFilesList([]);
  };

  const handleAddGame = async (e) => {
    e.preventDefault();
    if (!gameTitle || !gameDescription) {
      alert('Title and description are required!');
      return;
    }

    setIsUploadingGame(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600000);

    try {
      const formData = new FormData();
      formData.append('title', gameTitle);
      formData.append('description', gameDescription);
      formData.append('icon', gameIconImageUrl || gameIconEmoji);
      formData.append('tags', gameTags);
      // Encode pasted code as base64 so Hostinger's edge WAF doesn't flag
      // HTML-form-looking content (it blocks raw <input>/<select>/<script>
      // bodies with 403 Forbidden before the request reaches the server).
      formData.append('code', btoa(unescape(encodeURIComponent(gameCode))));
      formData.append('code_encoding', 'base64');

      for (let i = 0; i < gameFiles.length; i++) {
        formData.append('files', gameFiles[i]);
        const path = gameFiles[i].webkitRelativePath || gameFiles[i].name;
        formData.append('paths', path);
      }

      const response = await fetch('/api/games', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMsg = 'Submission failed';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch {
          errorMsg = (await response.text().catch(() => '')) || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      console.log('✅ Game submitted:', data);

      setShowGameModal(false);
      resetGameForm();
      alert('🎮 Game submitted successfully!');
      window.location.reload();
    } catch (err) {
      if (err.name === 'AbortError') {
        alert('Upload timed out after 10 minutes. Try reducing the number of files.');
      } else {
        console.error('❌ Error submitting game:', err);
        alert('Error submitting game: ' + err.message);
      }
    } finally {
      setIsUploadingGame(false);
    }
  };

  // ─── Helper to close modals ─────────────────────────────
  const closeModal = (setter) => setter(false);

  // ─── Render ─────────────────────────────────────────────

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
                <span className="user-name">{user.username}</span>
                <button className="btn btn-danger btn-sm" onClick={logout}>
                  <i className="fas fa-sign-out-alt"></i>
                </button>
              </div>
            ) : (
              <button className="btn btn-secondary" onClick={() => setShowAuthModal(true)}>
                <i className="fas fa-sign-in-alt"></i> LOGIN
              </button>
            )}
          </div>

          {/* KILLER MODE BUTTON */}
          <button
            className={`btn btn-warning ${killerMode ? 'killer-active' : ''}`}
            onClick={handleKillerToggle}
          >
            <i className="fas fa-skull"></i> {killerMode ? 'KILLER ON' : 'KILLER MODE'}
          </button>

          {/* DELETE MODE BUTTON (admin only) */}
          {user && user.is_admin && (
            <button
              className={`btn btn-danger ${deleteMode ? 'active' : ''}`}
              onClick={() => setDeleteMode(!deleteMode)}
              style={{ background: deleteMode ? '#ff0000' : '#ff4444', color: '#fff' }}
            >
              <i className="fas fa-trash"></i> {deleteMode ? 'DELETE MODE ON' : 'DELETE MODE'}
            </button>
          )}

          <button className="btn btn-success" onClick={() => setShowJokeModal(true)}>
            <i className="fas fa-plus"></i> ADD JOKE
          </button>
          <button className="btn btn-pink" onClick={() => setShowDoodleModal(true)}>
            <i className="fas fa-palette"></i> ADD DOODLE
          </button>
          <button className="btn btn-purple" onClick={() => setShowComicModal(true)}>
            <i className="fas fa-bullhorn"></i> NEW COMIC
          </button>
          <button className="btn btn-success" onClick={() => setShowGameModal(true)}>
            <i className="fas fa-upload"></i> SUBMIT GAME
          </button>
        </div>
      </header>

      {/* ─── KILLER MODE INFO MODAL ─── */}
      {showKillerInfo &&
        ReactDOM.createPortal(
          <div className="modal-overlay active" onClick={() => {}}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>💀 Killer Mode</h2>
                <button className="modal-close" onClick={closeKillerInfo}>×</button>
              </div>
              <div style={{ padding: '10px 0' }}>
                <p style={{ marginBottom: '12px', fontSize: '16px' }}>
                  <strong>Killer Mode</strong> adds a <strong>💀 kill count</strong> to every joke.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0' }}>
                  <li style={{ padding: '6px 0', borderBottom: '1px solid #eee' }}>
                    ✅ Jokes with <strong>50+ kills</strong> get a special <span style={{ color: '#ff0000' }}>killer style</span>.
                  </li>
                  <li style={{ padding: '6px 0', borderBottom: '1px solid #eee' }}>
                    💣 Click the <strong>KILL</strong> button on any joke to increase its kill count.
                  </li>
                  <li style={{ padding: '6px 0' }}>
                    🔥 Turn it on/off anytime – the kill counts are permanent.
                  </li>
                </ul>
                <div style={{ marginTop: '15px' }}>
                  <label style={{ cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={dontShowKillerInfo}
                      onChange={(e) => setDontShowKillerInfo(e.target.checked)}
                    />
                    Don't show this again
                  </label>
                </div>
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <button className="btn btn-primary" onClick={closeKillerInfo}>
                    Got it!
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.getElementById('modal-root')
        )}

      {/* ─── AUTH MODAL ─── */}
      {showAuthModal &&
        ReactDOM.createPortal(
          <div className="modal-overlay active" onClick={() => setShowAuthModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{authMode === 'login' ? '🔐 Login' : '📝 Register'}</h2>
                <button className="modal-close" onClick={() => setShowAuthModal(false)}>×</button>
              </div>
              <form onSubmit={handleAuthSubmit}>
                <div className="form-group">
                  <label>Username</label>
                  <input
                    className="form-control"
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    required
                  />
                </div>
                {authMode === 'register' && (
                  <div className="form-group">
                    <label>Email (for HubSpot)</label>
                    <input
                      type="email"
                      className="form-control"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                    />
                  </div>
                )}
                <div className="form-group">
                  <label>Password</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type={authMode === 'login' ? (showLoginPassword ? 'text' : 'password') : (showRegisterPassword ? 'text' : 'password')}
                      className="form-control"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      required
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        if (authMode === 'login') {
                          setShowLoginPassword(!showLoginPassword);
                        } else {
                          setShowRegisterPassword(!showRegisterPassword);
                        }
                      }}
                      style={{ padding: '8px 12px', minWidth: '40px' }}
                    >
                      <i className={`fas fa-${authMode === 'login' ? (showLoginPassword ? 'eye-slash' : 'eye') : (showRegisterPassword ? 'eye-slash' : 'eye')}`}></i>
                    </button>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  {authMode === 'login' ? 'Login' : 'Register'}
                </button>
              </form>
              <p style={{ marginTop: '10px', textAlign: 'center' }}>
                {authMode === 'login' ? (
                  <>
                    Don't have an account?{' '}
                    <a href="#" onClick={() => setAuthMode('register')}>
                      Register
                    </a>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <a href="#" onClick={() => setAuthMode('login')}>
                      Login
                    </a>
                  </>
                )}
              </p>
            </div>
          </div>,
          document.getElementById('modal-root')
        )}

      {/* ─── JOKE MODAL ─── */}
      {showJokeModal &&
        ReactDOM.createPortal(
          <div className="modal-overlay active" onClick={() => closeModal(setShowJokeModal)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>🐍 Add a Joke</h2>
                <button className="modal-close" onClick={() => closeModal(setShowJokeModal)}>×</button>
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
          </div>,
          document.getElementById('modal-root')
        )}

      {/* ─── DOODLE MODAL ─── */}
      {showDoodleModal &&
        ReactDOM.createPortal(
          <div className="modal-overlay active" onClick={() => closeModal(setShowDoodleModal)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>🎨 Add a Doodle</h2>
                <button className="modal-close" onClick={() => closeModal(setShowDoodleModal)}>×</button>
              </div>
              <form onSubmit={handleAddDoodle}>
                <div className="form-group">
                  <label>TITLE <span style={{ color: '#ff0000' }}>*</span></label>
                  <input className="form-control" value={doodleTitle} onChange={(e) => setDoodleTitle(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>📸 UPLOAD IMAGE <span style={{ color: '#ff0000' }}>*</span></label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button type="button" className="btn btn-primary" onClick={() => openWidget(setDoodleImageUrl, setDoodleImagePreview)}>
                      <i className="fas fa-upload"></i> Choose Image
                    </button>
                    {doodleImagePreview && (
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img src={doodleImagePreview} alt="Preview" style={{ maxWidth: '100px', maxHeight: '100px', border: '3px solid #003399' }} />
                        <button type="button" style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ff0000', color: '#fff', border: '2px solid #000', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => { setDoodleImageUrl(''); setDoodleImagePreview(''); }}>×</button>
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: '#7f8c8d', marginTop: '4px' }}>Supported: JPG, PNG, GIF. Max 10MB.</div>
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
                <button className="btn btn-success" type="submit" style={{ width: '100%' }} disabled={!doodleImageUrl}>
                  <i className="fas fa-upload"></i> UPLOAD DOODLE
                </button>
              </form>
            </div>
          </div>,
          document.getElementById('modal-root')
        )}

      {/* ─── COMIC MODAL ─── */}
      {showComicModal &&
        ReactDOM.createPortal(
          <div className="modal-overlay active" onClick={() => closeModal(setShowComicModal)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>📢 Create a Comic</h2>
                <button className="modal-close" onClick={() => closeModal(setShowComicModal)}>×</button>
              </div>
              <form onSubmit={handleAddComic}>
                <div className="form-group">
                  <label>TITLE <span style={{ color: '#ff0000' }}>*</span></label>
                  <input className="form-control" value={comicTitle} onChange={(e) => setComicTitle(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>📸 COMIC IMAGE <span style={{ color: '#7f8c8d' }}>(optional)</span></label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button type="button" className="btn btn-primary" onClick={() => openWidget(setComicImageUrl, setComicImagePreview)}>
                      <i className="fas fa-upload"></i> Choose Image
                    </button>
                    {comicImagePreview && (
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img src={comicImagePreview} alt="Preview" style={{ maxWidth: '100px', maxHeight: '100px', border: '3px solid #660099' }} />
                        <button type="button" style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ff0000', color: '#fff', border: '2px solid #000', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => { setComicImageUrl(''); setComicImagePreview(''); }}>×</button>
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: '#7f8c8d', marginTop: '4px' }}>Supported: JPG, PNG, GIF. Max 10MB.</div>
                </div>
                <div className="form-group">
                  <label>SCENE EMOJI <span style={{ color: '#7f8c8d' }}>(optional)</span></label>
                  <input className="form-control" value={comicScene} onChange={(e) => setComicScene(e.target.value)} maxLength={2} />
                </div>
                <div className="form-group">
                  <label>DIALOGUE <span style={{ color: '#7f8c8d' }}>(optional)</span></label>
                  <textarea className="form-control" value={comicDialogue} onChange={(e) => setComicDialogue(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>CAPTION <span style={{ color: '#7f8c8d' }}>(optional)</span></label>
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
          </div>,
          document.getElementById('modal-root')
        )}

      {/* ─── GAME MODAL ─── */}
      {showGameModal &&
        ReactDOM.createPortal(
          <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) setShowGameModal(false); }}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>🎮 Submit a Game</h2>
                <button className="modal-close" onClick={() => setShowGameModal(false)}>×</button>
              </div>
              <form onSubmit={handleAddGame}>
                <div className="form-group">
                  <label>GAME TITLE <span style={{ color: '#ff0000' }}>*</span></label>
                  <input className="form-control" value={gameTitle} onChange={(e) => setGameTitle(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>DESCRIPTION <span style={{ color: '#ff0000' }}>*</span></label>
                  <textarea className="form-control" value={gameDescription} onChange={(e) => setGameDescription(e.target.value)} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>🎨 GAME ICON</label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input className="form-control" style={{ width: '80px' }} value={gameIconEmoji} onChange={(e) => setGameIconEmoji(e.target.value)} maxLength={2} placeholder="🎮" />
                      <button type="button" className="btn btn-primary" onClick={() => openWidget(setGameIconImageUrl, setGameIconImagePreview)}>
                        <i className="fas fa-upload"></i> Upload Image
                      </button>
                      {gameIconImagePreview && (
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <img src={gameIconImagePreview} alt="Icon" style={{ maxWidth: '50px', maxHeight: '50px', border: '2px solid #003399' }} />
                          <button type="button" style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ff0000', color: '#fff', border: '2px solid #000', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', lineHeight: '20px', textAlign: 'center' }} onClick={() => { setGameIconImageUrl(''); setGameIconImagePreview(''); }}>×</button>
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: '#7f8c8d', marginTop: '4px' }}>Choose an emoji or upload an image (max 10MB). Image will be displayed if uploaded.</div>
                  </div>
                  <div className="form-group">
                    <label>🏷️ TAGS (comma separated)</label>
                    <input className="form-control" value={gameTags} onChange={(e) => setGameTags(e.target.value)} placeholder="arcade, puzzle, adventure" />
                  </div>
                </div>

                <div className="form-group">
                  <label>📁 GAME FILES (click to select)</label>
                  <div
                    className="drop-zone"
                    style={{
                      border: '4px dashed #003399',
                      padding: '20px',
                      textAlign: 'center',
                      background: '#f8f9fa',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      minHeight: '100px',
                      borderRadius: '0px',
                    }}
                    onClick={() => document.getElementById('game-file-input').click()}
                  >
                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>📂</div>
                    <p style={{ color: '#003399', fontWeight: 'bold' }}>
                      Click to select files<br />
                      <span style={{ fontSize: '12px', color: '#7f8c8d' }}>or click to browse</span>
                    </p>
                    <input
                      type="file"
                      id="game-file-input"
                      style={{ display: 'none' }}
                      multiple
                      webkitdirectory="true"
                      onChange={handleGameFileChange}
                    />
                    {gameFilesList.length > 0 && (
                      <div style={{ marginTop: '15px' }}>
                        {gameFilesList.map((name, idx) => (
                          <span
                            key={idx}
                            style={{
                              display: 'inline-block',
                              background: '#e8f4f8',
                              border: '2px solid #003399',
                              padding: '4px 12px',
                              margin: '4px',
                              fontSize: '12px',
                              fontWeight: '700',
                              color: '#003399',
                            }}
                          >
                            📄 {name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: '#7f8c8d', marginTop: '4px' }}>
                    Supported: HTML, JS, CSS, PNG, JPG, GIF, MP3, MP4, and more.
                  </div>
                </div>

                <div className="form-group">
                  <label>💻 GAME CODE <span style={{ color: '#7f8c8d' }}>(optional)</span></label>
                  <textarea className="form-control" value={gameCode} onChange={(e) => setGameCode(e.target.value)} placeholder="Paste HTML or JavaScript code here (or upload files above)" style={{ minHeight: '80px', fontFamily: 'monospace' }} />
                </div>

                <button className="btn btn-success" type="submit" style={{ width: '100%' }} disabled={isUploadingGame}>
                  <i className="fas fa-upload"></i> {isUploadingGame ? 'SUBMITTING...' : 'SUBMIT GAME'}
                </button>
              </form>
            </div>
          </div>,
          document.getElementById('modal-root')
        )}
    </>
  );
};

export default Header;