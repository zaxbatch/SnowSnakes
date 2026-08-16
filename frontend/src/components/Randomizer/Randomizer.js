import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import api from '../../api';

const Randomizer = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchRandom = async () => {
    setLoading(true);
    try {
      const res = await api.get('/random');
      setResult(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch random items');
    } finally {
      setLoading(false);
    }
  };

  const openItemModal = (type, item) => {
    if (!item) return;
    setSelectedItem({ type, item });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedItem(null);
  };

  // Render detailed view for each content type
  const renderItemDetails = (type, item) => {
    if (!item) return <div>No details available</div>;
    switch (type) {
      case 'joke':
        return (
          <div>
            <h3>😂 Joke</h3>
            <p><strong>Content:</strong> {item.content}</p>
            {item.punchline && <p><strong>Punchline:</strong> {item.punchline}</p>}
            {item.tags?.length > 0 && <p><strong>Tags:</strong> {item.tags.join(', ')}</p>}
            {item.series && <p><strong>Series:</strong> {item.series}</p>}
            <p><strong>Likes:</strong> {item.likes || 0} | <strong>Shares:</strong> {item.shares || 0} | <strong>Kills:</strong> {item.kill_count || 0}</p>
            {item.author_name && <p><strong>Author:</strong> {item.author_name}</p>}
          </div>
        );
      case 'doodle':
        return (
          <div>
            <h3>🎨 Doodle</h3>
            <p><strong>Title:</strong> {item.title}</p>
            {item.image_url && <img src={item.image_url} alt={item.title} style={{ maxWidth: '100%', maxHeight: '300px' }} />}
            {item.joke_id && <p><strong>Joke ID:</strong> {item.joke_id}</p>}
            {item.character_id && <p><strong>Character ID:</strong> {item.character_id}</p>}
            <p><strong>Likes:</strong> {item.likes || 0} | <strong>Shares:</strong> {item.shares || 0}</p>
          </div>
        );
      case 'comic':
        return (
          <div>
            <h3>📢 Comic</h3>
            <p><strong>Title:</strong> {item.title}</p>
            {item.scene && <p><strong>Scene:</strong> {item.scene}</p>}
            {item.dialogue && <p><strong>Dialogue:</strong> {item.dialogue}</p>}
            {item.caption && <p><strong>Caption:</strong> {item.caption}</p>}
            {item.characters?.length > 0 && <p><strong>Characters:</strong> {item.characters.join(', ')}</p>}
            {item.image_url && <img src={item.image_url} alt={item.title} style={{ maxWidth: '100%', maxHeight: '300px' }} />}
            <p><strong>Likes:</strong> {item.likes || 0} | <strong>Shares:</strong> {item.shares || 0}</p>
            {item.author_name && <p><strong>Author:</strong> {item.author_name}</p>}
          </div>
        );
      case 'episode':
        return (
          <div>
            <h3>🎬 Episode</h3>
            <p><strong>Title:</strong> {item.title}</p>
            {item.youtube_id && <p><strong>YouTube ID:</strong> {item.youtube_id}</p>}
            {item.description && <p><strong>Description:</strong> {item.description}</p>}
            {item.thumbnail_url && <img src={item.thumbnail_url} alt={item.title} style={{ maxWidth: '100%', maxHeight: '200px' }} />}
            {item.episode_number && <p><strong>Episode #:</strong> {item.episode_number}</p>}
            {item.air_date && <p><strong>Air Date:</strong> {new Date(item.air_date).toLocaleDateString()}</p>}
            <p><strong>Featured:</strong> {item.featured ? 'Yes' : 'No'}</p>
            <p><strong>Likes:</strong> {item.likes || 0} | <strong>Shares:</strong> {item.shares || 0}</p>
          </div>
        );
      case 'game':
        return (
          <div>
            <h3>🎮 Game</h3>
            <p><strong>Title:</strong> {item.title}</p>
            {item.description && <p><strong>Description:</strong> {item.description}</p>}
            {item.icon && <span style={{ fontSize: 40 }}>{item.icon}</span>}
            {item.tags?.length > 0 && <p><strong>Tags:</strong> {item.tags.join(', ')}</p>}
            {item.type && <p><strong>Type:</strong> {item.type}</p>}
            {item.code && <p><strong>Code:</strong> <code>{item.code}</code></p>}
            <p><strong>Votes:</strong> {item.votes || 0} | <strong>Plays:</strong> {item.plays || 0}</p>
            <p><strong>Likes:</strong> {item.likes || 0} | <strong>Shares:</strong> {item.shares || 0}</p>
            {item.author_name && <p><strong>Author:</strong> {item.author_name}</p>}
          </div>
        );
      case 'character':
        return (
          <div>
            <h3>🌭 Character</h3>
            <p><strong>Name:</strong> {item.name}</p>
            {item.description && <p><strong>Description:</strong> {item.description}</p>}
            {item.avatar && <img src={item.avatar} alt={item.name} style={{ maxWidth: '100%', maxHeight: '200px' }} />}
          </div>
        );
      default:
        return <div>Unknown type</div>;
    }
  };

  // Modal component using portal
  const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return ReactDOM.createPortal(
      <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div className="modal-box" style={{ background: '#fff', borderRadius: 10, maxWidth: 600, width: '90%', maxHeight: '80vh', overflow: 'auto', padding: 20, position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 10, right: 10, background: 'red', color: '#fff', border: 'none', borderRadius: 5, padding: '5px 10px', cursor: 'pointer' }}>
            <i className="fas fa-times"></i> Close
          </button>
          {children}
        </div>
      </div>,
      document.getElementById('modal-root')
    );
  };

  return (
    <div className="panel active">
      <div className="randomizer-display" style={{ background: '#ffffcc', border: '4px dashed #ff00ff', borderRadius: 30, padding: 40 }}>
        <span className="big-emoji" style={{ fontSize: 100, display: 'block', marginBottom: 15 }}>🐍</span>
        <h1 style={{ color: '#ff00ff', fontFamily: "'Comic Sans MS', cursive" }}>RANDOM SNOW SNAKE</h1>
        <p style={{ color: '#003399', fontWeight: 'bold' }}>CLICK THE BUTTON AND LET THE SNOW SNAKE CHOOSE YOUR FATE!</p>
        <button className="btn btn-primary mt-20" onClick={fetchRandom} style={{ fontSize: 24, padding: '15px 40px' }}>
          <i className="fas fa-dice"></i> {loading ? 'SUMMONING...' : 'SUMMON!'}
        </button>
        {result && (
          <div style={{ marginTop: 30 }}>
            <div className="card" style={{ background: '#fff', border: '4px solid #ff00ff', textAlign: 'left', padding: 20 }}>
              <div><strong>😂 Joke:</strong> <span className="clickable-link" onClick={() => openItemModal('joke', result.joke)} style={{ cursor: 'pointer', color: '#0066cc', textDecoration: 'underline' }}>{result.joke?.content || 'N/A'}</span></div>
              <div><strong>🎨 Doodle:</strong> <span className="clickable-link" onClick={() => openItemModal('doodle', result.doodle)} style={{ cursor: 'pointer', color: '#0066cc', textDecoration: 'underline' }}>{result.doodle?.title || 'N/A'}</span></div>
              <div><strong>📢 Comic:</strong> <span className="clickable-link" onClick={() => openItemModal('comic', result.comic)} style={{ cursor: 'pointer', color: '#0066cc', textDecoration: 'underline' }}>{result.comic?.title || 'N/A'}</span></div>
              <div><strong>🎬 Episode:</strong> <span className="clickable-link" onClick={() => openItemModal('episode', result.episode)} style={{ cursor: 'pointer', color: '#0066cc', textDecoration: 'underline' }}>{result.episode?.title || 'N/A'}</span></div>
              <div><strong>🎮 Game:</strong> <span className="clickable-link" onClick={() => openItemModal('game', result.game)} style={{ cursor: 'pointer', color: '#0066cc', textDecoration: 'underline' }}>{result.game?.title || 'N/A'}</span></div>
              <div><strong>🌭 Character:</strong> <span className="clickable-link" onClick={() => openItemModal('character', result.character)} style={{ cursor: 'pointer', color: '#0066cc', textDecoration: 'underline' }}>{result.character?.name || 'N/A'}</span></div>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={closeModal}>
        {selectedItem && renderItemDetails(selectedItem.type, selectedItem.item)}
      </Modal>
    </div>
  );
};

export default Randomizer;