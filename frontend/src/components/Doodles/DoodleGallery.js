import React, { useEffect, useState, useContext } from 'react';
import api from '../../api';
import { AuthContext } from '../../context/AuthContext';
import { useDeleteMode } from '../../context/DeleteModeContext';
import SocialActions from '../SocialActions';
import CommentModal from '../CommentModal';
import FullscreenMediaModal from '../FullscreenMediaModal';

const DoodleGallery = () => {
  const { user } = useContext(AuthContext);
  const { deleteMode } = useDeleteMode();
  const [doodles, setDoodles] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [selectedDoodle, setSelectedDoodle] = useState(null);

  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [commentContent, setCommentContent] = useState(null);
  const [commentContentType, setCommentContentType] = useState('');

  const fetchDoodles = async () => {
    try {
      const res = await api.get('/doodles', { params: { search, sort } });
      setDoodles(res.data);
    } catch (err) {
      console.error('Failed to fetch doodles:', err);
    }
  };

  useEffect(() => {
    fetchDoodles();
  }, [search, sort]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this doodle?')) return;
    try {
      await api.delete(`/doodles/${id}`);
      fetchDoodles();
    } catch (err) {
      alert('Failed to delete doodle');
    }
  };

  const handleComment = async (contentId, text) => {
    try {
      await api.post(`/doodles/${contentId}/comment`, { text });
      fetchDoodles();
      setCommentModalOpen(false);
    } catch (err) {
      alert('Error posting comment');
    }
  };

  const openCommentModal = (item) => {
    setCommentContent(item);
    setCommentContentType('doodle');
    setCommentModalOpen(true);
  };

  return (
    <div className="panel active">
      <div className="section-header" style={{ background: 'linear-gradient(135deg, #00cc66, #00ff99)' }}>
        <span className="section-icon">🎨</span>
        <h2>DOODLE GALLERY</h2>
        <p>Where art meets condiments</p>
      </div>

      {/* ─── Search & Sort ─── */}
      <div className="flex justify-between align-center mb-20" style={{ flexWrap: 'wrap', gap: '10px' }}>
        <input
          type="text"
          placeholder="Search doodles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-control"
          style={{ width: '200px' }}
        />
        <div className="flex gap-10">
          <button className="btn btn-secondary" onClick={() => setSort('likes')}>MOST LIKED</button>
          <button className="btn btn-secondary" onClick={() => setSort('newest')}>NEWEST</button>
          <button className="btn btn-secondary" onClick={() => setSort('oldest')}>OLDEST</button>
        </div>
      </div>

      <div className="grid-3">
        {doodles.map(d => (
          <div className="doodle-card" key={d.id}>
            {d.image_url && d.image_url.startsWith('http') ? (
              <img
                src={d.image_url}
                alt={d.title}
                style={{ maxWidth: '100%', maxHeight: '150px', objectFit: 'contain', cursor: 'pointer' }}
                onClick={() => setSelectedDoodle(d)}
              />
            ) : (
              <span className="doodle-art" style={{ fontSize: 60, cursor: 'pointer' }} onClick={() => setSelectedDoodle(d)}>
                {d.image_url || '🎨'}
              </span>
            )}
            <div className="card-title">{d.title}</div>
            {deleteMode && (
              <button className="btn btn-danger btn-sm mt-20" onClick={() => handleDelete(d.id)}>
                <i className="fas fa-trash"></i> DELETE
              </button>
            )}
            <button className="btn btn-primary btn-sm" onClick={() => setSelectedDoodle(d)}>
              <i className="fas fa-expand"></i> Expand
            </button>
            <SocialActions
              contentType="doodle"
              contentId={d.id}
              likes={d.likes || 0}
              shares={d.shares || 0}
              commentCount={d.comments ? d.comments.length : 0}
              currentUser={user}
              onUpdate={fetchDoodles}
              onOpenCommentModal={() => openCommentModal(d)}
            />
          </div>
        ))}
        {doodles.length === 0 && <p>No doodles yet.</p>}
      </div>

      {selectedDoodle && (
        <FullscreenMediaModal
          isOpen={!!selectedDoodle}
          onClose={() => setSelectedDoodle(null)}
          title={selectedDoodle.title}
          imageUrl={selectedDoodle.image_url && selectedDoodle.image_url.startsWith('http') ? selectedDoodle.image_url : null}
          type="image"
        />
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

export default DoodleGallery;