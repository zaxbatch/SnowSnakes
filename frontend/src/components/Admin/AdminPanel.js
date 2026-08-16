import React, { useEffect, useState, useContext } from 'react';
import api from '../../api';
import { AuthContext } from '../../context/AuthContext';
import { useDeleteMode } from '../../context/DeleteModeContext';

const AdminPanel = () => {
  const { user } = useContext(AuthContext);
  const { deleteMode } = useDeleteMode();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [episodes, setEpisodes] = useState([]);
  const [episodeLoading, setEpisodeLoading] = useState(false);

  // ─── Episode form state ───
  const [editingEpisode, setEditingEpisode] = useState(null);
  const [episodeForm, setEpisodeForm] = useState({
    title: '',
    youtube_id: '',
    description: '',
    thumbnail_url: '',
    episode_number: '',
    air_date: '',
    featured: false,
  });
  const [showEpisodeForm, setShowEpisodeForm] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEpisodes = async () => {
    setEpisodeLoading(true);
    try {
      const res = await api.get('/episodes');
      setEpisodes(res.data);
    } catch (err) {
      console.error('Failed to fetch episodes:', err);
    } finally {
      setEpisodeLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchEpisodes();
  }, []);

  // ─── User actions ──────────────────────────────────────
  const promote = async (id) => {
    if (!window.confirm('Promote this user to admin?')) return;
    try {
      await api.post(`/admin/users/${id}/promote`);
      fetchUsers();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  const demote = async (id) => {
    if (!window.confirm('Demote this user from admin?')) return;
    try {
      await api.post(`/admin/users/${id}/demote`);
      fetchUsers();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user permanently? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      fetchUsers();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  // ─── Episode CRUD ──────────────────────────────────────
  const resetEpisodeForm = () => {
    setEpisodeForm({
      title: '',
      youtube_id: '',
      description: '',
      thumbnail_url: '',
      episode_number: '',
      air_date: '',
      featured: false,
    });
    setEditingEpisode(null);
  };

  const handleEpisodeSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEpisode) {
        await api.put(`/episodes/${editingEpisode.id}`, episodeForm);
        alert('✅ Episode updated!');
      } else {
        await api.post('/episodes', episodeForm);
        alert('✅ Episode created!');
      }
      setShowEpisodeForm(false);
      resetEpisodeForm();
      fetchEpisodes();
    } catch (err) {
      alert('Error saving episode: ' + (err.response?.data?.error || err.message));
    }
  };

  const deleteEpisode = async (id) => {
    if (!window.confirm('Delete this episode?')) return;
    try {
      await api.delete(`/episodes/${id}`);
      fetchEpisodes();
    } catch (err) {
      alert('Error deleting episode: ' + (err.response?.data?.error || err.message));
    }
  };

  const editEpisode = (ep) => {
    setEditingEpisode(ep);
    setEpisodeForm({
      title: ep.title || '',
      youtube_id: ep.youtube_id || '',
      description: ep.description || '',
      thumbnail_url: ep.thumbnail_url || '',
      episode_number: ep.episode_number || '',
      air_date: ep.air_date || '',
      featured: ep.featured || false,
    });
    setShowEpisodeForm(true);
  };

  // ─── If not admin ──────────────────────────────────────
  if (!user || !user.is_admin) {
    return (
      <div className="panel active">
        <div className="section-header" style={{ background: 'linear-gradient(135deg, #e74c3c, #c0392b)' }}>
          <span className="section-icon">🚫</span>
          <h2>ACCESS DENIED</h2>
          <p>You must be an admin to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel active">
      <div className="section-header" style={{ background: 'linear-gradient(135deg, #8e44ad, #3498db)' }}>
        <span className="section-icon">🛡️</span>
        <h2>ADMIN PANEL</h2>
        <p>Manage users, content, and episodes</p>
        {deleteMode && (
          <div style={{ marginTop: '8px', background: '#ff0000', color: '#fff', padding: '4px 12px', borderRadius: '20px', display: 'inline-block', fontSize: '14px' }}>
            ⚠️ DELETE MODE ACTIVE – deletions are permanent!
          </div>
        )}
      </div>

      {/* ─── User Management ─── */}
      <h3 style={{ marginTop: '20px' }}>👤 User Management</h3>
      {loading ? (
        <p style={{ textAlign: 'center', padding: '20px' }}>Loading users...</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ background: '#f0f0f0' }}>
                <th style={{ padding: '8px', border: '1px solid #ccc' }}>ID</th>
                <th style={{ padding: '8px', border: '1px solid #ccc' }}>Username</th>
                <th style={{ padding: '8px', border: '1px solid #ccc' }}>Admin</th>
                <th style={{ padding: '8px', border: '1px solid #ccc' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ padding: '8px', border: '1px solid #ccc' }}>{u.id}</td>
                  <td style={{ padding: '8px', border: '1px solid #ccc' }}>{u.username}</td>
                  <td style={{ padding: '8px', border: '1px solid #ccc' }}>{u.is_admin ? '✅' : '❌'}</td>
                  <td style={{ padding: '8px', border: '1px solid #ccc' }}>
                    {u.id !== user?.id ? (
                      <>
                        {u.is_admin ? (
                          <button className="btn btn-warning btn-sm" onClick={() => demote(u.id)}>Demote</button>
                        ) : (
                          <button className="btn btn-success btn-sm" onClick={() => promote(u.id)}>Promote</button>
                        )}
                        {deleteMode && (
                          <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u.id)}>Delete</button>
                        )}
                      </>
                    ) : (
                      <span style={{ color: '#888' }}> (you)</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Spread da Word Management ─── */}
      <h3 style={{ marginTop: '30px' }}>🎬 Spread da Word – Episodes</h3>

      <div style={{ marginTop: '15px' }}>
        <button
          className="btn btn-success"
          onClick={() => {
            resetEpisodeForm();
            setShowEpisodeForm(true);
          }}
        >
          <i className="fas fa-plus"></i> Add New Episode
        </button>
      </div>

      {showEpisodeForm && (
        <div style={{ marginTop: '20px', background: '#f8f9fa', padding: '20px', borderRadius: '12px', border: '2px solid #003399' }}>
          <h4>{editingEpisode ? '✏️ Edit Episode' : '📝 New Episode'}</h4>
          <form onSubmit={handleEpisodeSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Title <span style={{ color: '#ff0000' }}>*</span></label>
                <input
                  className="form-control"
                  value={episodeForm.title}
                  onChange={(e) => setEpisodeForm({ ...episodeForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>YouTube ID <span style={{ color: '#ff0000' }}>*</span></label>
                <input
                  className="form-control"
                  value={episodeForm.youtube_id}
                  onChange={(e) => setEpisodeForm({ ...episodeForm, youtube_id: e.target.value })}
                  placeholder="e.g. dQw4w9WgXcQ (or full URL)"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                className="form-control"
                value={episodeForm.description}
                onChange={(e) => setEpisodeForm({ ...episodeForm, description: e.target.value })}
                rows="3"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Thumbnail URL</label>
                <input
                  className="form-control"
                  value={episodeForm.thumbnail_url}
                  onChange={(e) => setEpisodeForm({ ...episodeForm, thumbnail_url: e.target.value })}
                  placeholder="https://img.youtube.com/vi/ID/hqdefault.jpg (auto-fetched if empty)"
                />
                <div style={{ fontSize: '11px', color: '#7f8c8d', marginTop: '4px' }}>
                  Leave blank to auto‑fetch from YouTube.
                </div>
              </div>
              <div className="form-group">
                <label>Episode Number</label>
                <input
                  className="form-control"
                  value={episodeForm.episode_number}
                  onChange={(e) => setEpisodeForm({ ...episodeForm, episode_number: e.target.value })}
                  placeholder="S1E01"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Air Date</label>
                <input
                  className="form-control"
                  value={episodeForm.air_date}
                  onChange={(e) => setEpisodeForm({ ...episodeForm, air_date: e.target.value })}
                  placeholder="January 15, 2026"
                />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ margin: 0 }}>Featured</label>
                <input
                  type="checkbox"
                  checked={episodeForm.featured}
                  onChange={(e) => setEpisodeForm({ ...episodeForm, featured: e.target.checked })}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="submit" className="btn btn-primary">
                {editingEpisode ? 'Update Episode' : 'Create Episode'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowEpisodeForm(false);
                  resetEpisodeForm();
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {episodeLoading ? (
        <p style={{ marginTop: '15px' }}>Loading episodes...</p>
      ) : (
        <div style={{ marginTop: '15px', overflowX: 'auto' }}>
          {episodes.length === 0 ? (
            <p>No episodes yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f0f0f0' }}>
                  <th style={{ padding: '8px', border: '1px solid #ccc' }}>ID</th>
                  <th style={{ padding: '8px', border: '1px solid #ccc' }}>Title</th>
                  <th style={{ padding: '8px', border: '1px solid #ccc' }}>YouTube ID</th>
                  <th style={{ padding: '8px', border: '1px solid #ccc' }}>Episode</th>
                  <th style={{ padding: '8px', border: '1px solid #ccc' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {episodes.map(ep => (
                  <tr key={ep.id}>
                    <td style={{ padding: '8px', border: '1px solid #ccc' }}>{ep.id}</td>
                    <td style={{ padding: '8px', border: '1px solid #ccc' }}>{ep.title}</td>
                    <td style={{ padding: '8px', border: '1px solid #ccc' }}>{ep.youtube_id}</td>
                    <td style={{ padding: '8px', border: '1px solid #ccc' }}>{ep.episode_number || '—'}</td>
                    <td style={{ padding: '8px', border: '1px solid #ccc' }}>
                      <button className="btn btn-primary btn-sm" onClick={() => editEpisode(ep)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteEpisode(ep.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;