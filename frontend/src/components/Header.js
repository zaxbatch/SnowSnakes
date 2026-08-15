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
  const [doodleImageUrl, setDoodleImageUrl] = useState('');
  const [doodleImagePreview, setDoodleImagePreview] = useState('');
  const [doodleJokeId, setDoodleJokeId] = useState('');
  const [doodleCharacterId, setDoodleCharacterId] = useState('');

  // Comic form state
  const [comicTitle, setComicTitle] = useState('');
  const [comicImageUrl, setComicImageUrl] = useState('');
  const [comicImagePreview, setComicImagePreview] = useState('');
  const [comicScene, setComicScene] = useState('📢');
  const [comicDialogue, setComicDialogue] = useState('');
  const [comicCaption, setComicCaption] = useState('');
  const [comicCharacters, setComicCharacters] = useState('');

  // ─── Cloudinary Widget ───

  const openWidget = (setImageUrl, setPreview) => {
    api.post('/upload/signature')
      .then(res => {
        const { signature, timestamp, cloud_name, api_key } = res.data;

        const widget = window.cloudinary.createUploadWidget(
          {
            cloudName: cloud_name,
            apiKey: api_key,
            signature: { signature, timestamp },
            uploadPreset: 'snowsnakes', // optional: create a preset in Cloudinary
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
      })
      .catch(err => {
        console.error('Failed to get signature:', err);
        alert('Failed to initialize upload. Please try again.');
      });
  };

  // ─── Form Handlers ───

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

      {/* ─── JOKE MODAL ─── */}
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

      {/* ─── DOODLE MODAL with Cloudinary ─── */}
      {showDoodleModal && (
        <div className="modal-overlay active" onClick={() => setShowDoodleModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🎨 Add a Doodle</h2>
              <button className="modal-close" onClick={() => setShowDoodleModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddDoodle}>
              <div className="form-group">
                <label>TITLE <span style={{ color: '#ff0000' }}>*</span></label>
                <input className="form-control" value={doodleTitle} onChange={(e) => setDoodleTitle(e.target.value)} required />
              </div>

              <div className="form-group">
                <label>📸 UPLOAD IMAGE <span style={{ color: '#ff0000' }}>*</span></label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => openWidget(setDoodleImageUrl, setDoodleImagePreview)}
                  >
                    <i className="fas fa-upload"></i> Choose Image
                  </button>
                  {doodleImagePreview && (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img
                        src={doodleImagePreview}
                        alt="Preview"
                        style={{ maxWidth: '100px', maxHeight: '100px', border: '3px solid #003399' }}
                      />
                      <button
                        type="button"
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          background: '#ff0000',
                          color: '#fff',
                          border: '2px solid #000',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                        }}
                        onClick={() => { setDoodleImageUrl(''); setDoodleImagePreview(''); }}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: '#7f8c8d', marginTop: '4px' }}>
                  Supported: JPG, PNG, GIF. Max 10MB.
                </div>
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
        </div>
      )}

      {/* ─── COMIC MODAL with Cloudinary ─── */}
      {showComicModal && (
        <div className="modal-overlay active" onClick={() => setShowComicModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📢 Create a Comic</h2>
              <button className="modal-close" onClick={() => setShowComicModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddComic}>
              <div className="form-group">
                <label>TITLE <span style={{ color: '#ff0000' }}>*</span></label>
                <input className="form-control" value={comicTitle} onChange={(e) => setComicTitle(e.target.value)} required />
              </div>

              <div className="form-group">
                <label>📸 COMIC IMAGE <span style={{ color: '#7f8c8d' }}>(optional)</span></label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => openWidget(setComicImageUrl, setComicImagePreview)}
                  >
                    <i className="fas fa-upload"></i> Choose Image
                  </button>
                  {comicImagePreview && (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img
                        src={comicImagePreview}
                        alt="Preview"
                        style={{ maxWidth: '100px', maxHeight: '100px', border: '3px solid #660099' }}
                      />
                      <button
                        type="button"
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          background: '#ff0000',
                          color: '#fff',
                          border: '2px solid #000',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                        }}
                        onClick={() => { setComicImageUrl(''); setComicImagePreview(''); }}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: '#7f8c8d', marginTop: '4px' }}>
                  Supported: JPG, PNG, GIF. Max 10MB.
                </div>
              </div>

              <div className="form-group">
                <label>SCENE EMOJI <span style={{ color: '#7f8c8d' }}>(optional)</span></label>
                <input className="form-control" value={comicScene} onChange={(e) => setComicScene(e.target.value)} maxLength={2} />
              </div>
              <div className="form-group">
                <label>DIALOGUE <span style={{ color: '#ff0000' }}>*</span></label>
                <textarea className="form-control" value={comicDialogue} onChange={(e) => setComicDialogue(e.target.value)} required />
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
        </div>
      )}
    </>
  );
};

export default Header;