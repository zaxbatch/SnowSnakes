import React, { useEffect, useState, useContext } from 'react';
import api from '../../api';
import { AuthContext } from '../../context/AuthContext';
import { useDeleteMode } from '../../context/DeleteModeContext';
import SocialActions from '../SocialActions';
import CommentModal from '../CommentModal';
import FullscreenMediaModal from '../FullscreenMediaModal';

const ComicList = () => {
  const { user } = useContext(AuthContext);
  const { deleteMode } = useDeleteMode();
  const [comics, setComics] = useState([]);
  const [selectedComic, setSelectedComic] = useState(null);

  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [commentContent, setCommentContent] = useState(null);
  const [commentContentType, setCommentContentType] = useState('');

  const fetchComics = async () => {
    try {
      const res = await api.get('/comics');
      setComics(res.data);
    } catch (err) {
      console.error('Failed to fetch comics:', err);
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

  const handleComment = async (contentId, text) => {
    try {
      await api.post(`/comics/${contentId}/comment`, { text });
      fetchComics();
      setCommentModalOpen(false);
    } catch (err) {
      alert('Error posting comment');
    }
  };

  const openCommentModal = (item) => {
    setCommentContent(item);
    setCommentContentType('comic');
    setCommentModalOpen(true);
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
            <SocialActions
              contentType="comic"
              contentId={c.id}
              likes={c.likes || 0}
              shares={c.shares || 0}
              commentCount={c.comments ? c.comments.length : 0}
              currentUser={user}
              onUpdate={fetchComics}
              onOpenCommentModal={() => openCommentModal(c)}
            />
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

      <CommentModal
        isOpen={commentModalOpen}
        onClose={() => setCommentModalOpen(false)}
        content={commentContent}
        contentType={commentContentType}
        currentUser={user}
        onComment={handleComment}
      />
    </div>
  );
};

export default ComicList;