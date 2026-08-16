import React, { useEffect, useState, useContext } from 'react';
import api from '../../api';
import { AuthContext } from '../../context/AuthContext';

const AdminPanel = () => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [episodes, setEpisodes] = useState([]);
  const [episodeLoading, setEpisodeLoading] = useState(false);

  // ─── Fetch all users ───
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      alert('Error fetching users: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // ─── Fetch episodes (for future management) ───
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

  // ─── Promote user to admin ───
  const promote = async (id) => {
    if (!window.confirm('Promote this user to admin?')) return;
    try {
      await api.post(`/admin/users/${id}/promote`);
      fetchUsers();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  // ─── Demote user from admin ───
  const demote = async (id) => {
    if (!window.confirm('Demote this user from admin?')) return;
    try {
      await api.post(`/admin/users/${id}/demote`);
      fetchUsers();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  // ─── If not admin, show forbidden message ───
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
                <th style={{ padding: '8px', border: '1px solid #ccc' }}>Display Name</th>
                <th style={{ padding: '8px', border: '1px solid #ccc' }}>Admin</th>
                <th style={{ padding: '8px', border: '1px solid #ccc' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ padding: '8px', border: '1px solid #ccc' }}>{u.id}</td>
                  <td style={{ padding: '8px', border: '1px solid #ccc' }}>{u.username}</td>
                  <td style={{ padding: '8px', border: '1px solid #ccc' }}>{u.display_name}</td>
                  <td style={{ padding: '8px', border: '1px solid #ccc' }}>{u.is_admin ? '✅' : '❌'}</td>
                  <td style={{ padding: '8px', border: '1px solid #ccc' }}>
                    {u.id !== user?.id ? (
                      <>
                        {u.is_admin ? (
                          <button className="btn btn-warning btn-sm" onClick={() => demote(u.id)}>Demote</button>
                        ) : (
                          <button className="btn btn-success btn-sm" onClick={() => promote(u.id)}>Promote</button>
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
      <p style={{ color: '#666' }}>Add, edit, or remove episodes (YouTube videos).</p>

      <div style={{ marginTop: '15px' }}>
        <button className="btn btn-success" onClick={() => alert('Add Episode form coming soon!')}>
          <i className="fas fa-plus"></i> Add New Episode
        </button>
      </div>

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
                  <th style={{ padding: '8px', border: '1px solid #ccc' }}>Episode</th>
                  <th style={{ padding: '8px', border: '1px solid #ccc' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {episodes.map(ep => (
                  <tr key={ep.id}>
                    <td style={{ padding: '8px', border: '1px solid #ccc' }}>{ep.id}</td>
                    <td style={{ padding: '8px', border: '1px solid #ccc' }}>{ep.title}</td>
                    <td style={{ padding: '8px', border: '1px solid #ccc' }}>{ep.episode_number || '—'}</td>
                    <td style={{ padding: '8px', border: '1px solid #ccc' }}>
                      <button className="btn btn-primary btn-sm" onClick={() => alert('Edit episode coming soon!')}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => alert('Delete episode coming soon!')}>Delete</button>
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