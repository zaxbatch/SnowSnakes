import React, { useEffect, useState } from 'react';
import api from '../../api';
import { useDeleteMode } from '../../context/DeleteModeContext';
import FullscreenMediaModal from '../FullscreenMediaModal';

const ComicList = () => {
  const [comics, setComics] = useState([]);
  const [selectedComic, setSelectedComic] = useState(null);
  const { deleteMode } = useDeleteMode();

  const fetchComics = async () => {
    try {
      const res = await api.get('/comics');
      setComics(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchComics();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this comic?')) return;
    try {
      await api.delete(`/comics/${id}`);
      fetchComics();
    } catch (err) {
      alert('Failed to delete comic');
    }
  };

  return (
    <div className="panel active">
      <div className="section-header" style={{ background: 'linear-gradient(135deg, #9b59b6, #8e44ad)' }}>
        <span className="section-icon">📢</span>
        <h2>COMICS</h2>
        <p>User-submitted comics from the condiment universe</p>
      </div>
      <div className="grid-comics">
        {comics.map(c => (
          <div className="comic-card" key={c.id}>
            {c.image_url && c.image_url.startsWith('http') ? (
              <img
                src={c.image_url}
                alt={c.title}
                style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', marginBottom: '10px', cursor: 'pointer' }}
                onClick={() => setSelectedComic(c)}
              />
            ) : (
              <div className="comic-panel" onClick={() => setSelectedComic(c)}>
                <span className="scene">{c.scene}</span>
                <div className="dialogue">"{c.dialogue}"</div>
                <div className="caption">{c.caption}</div>
              </div>
            )}
            <h3 style={{ fontFamily: "'Comic Sans MS', cursive", color: '#660099' }}>{c.title}</h3>
            <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>✏️ By {c.author_name || 'anonymous'}</div>
            {deleteMode && (
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>
                <i className="fas fa-trash"></i> DELETE
              </button>
            )}
            <button className="btn btn-primary btn-sm" onClick={() => setSelectedComic(c)}>
              <i className="fas fa-expand"></i> Expand
            </button>
          </div>
        ))}
        {comics.length === 0 && <p>No comics yet.</p>}
      </div>

      {selectedComic && (
        <FullscreenMediaModal
          isOpen={!!selectedComic}
          onClose={() => setSelectedComic(null)}
          title={selectedComic.title}
          type="comic"
        >
          {selectedComic.image_url && selectedComic.image_url.startsWith('http') ? (
            <img src={selectedComic.image_url} alt={selectedComic.title} style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }} />
          ) : (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: 60 }}>{selectedComic.scene}</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', margin: '10px 0' }}>"{selectedComic.dialogue}"</div>
              <div style={{ fontStyle: 'italic', color: '#666' }}>{selectedComic.caption}</div>
            </div>
          )}
        </FullscreenMediaModal>
      )}
    </div>
  );
};

export default ComicList;