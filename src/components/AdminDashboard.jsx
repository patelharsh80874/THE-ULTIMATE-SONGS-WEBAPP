import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import API_BASE_URL from '../config/api';

const AdminDashboard = () => {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [stats, setStats] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [passwordModal, setPasswordModal] = useState({ open: false, userId: null, username: '' });
  const [newPassword, setNewPassword] = useState('');
  
  // New state
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [sortBy, setSortBy] = useState('newest');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [announceModal, setAnnounceModal] = useState(false);
  const [emailModal, setEmailModal] = useState({ open: false, userId: null, username: '' });
  const [announceData, setAnnounceData] = useState({ subject: '', message: '' });
  const [emailData, setEmailData] = useState({ subject: '', message: '' });

  const BASE_URL = `${API_BASE_URL}/api`;


  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'admin') {
        toast.error('Not authorized as Admin');
        navigate('/');
      } else {
        fetchAllData();
      }
    }
  }, [user, loading, navigate]);

  const fetchAllData = async () => {
    setFetching(true);
    try {
      const [usersRes, playlistsRes, statsRes] = await Promise.all([
        axios.get(`${BASE_URL}/users`, { withCredentials: true }),
        axios.get(`${BASE_URL}/admin/playlists`, { withCredentials: true }),
        axios.get(`${BASE_URL}/admin/stats`, { withCredentials: true })
      ]);
      setUsers(usersRes.data);
      setPlaylists(playlistsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error('Failed to load system data');
      console.error(error);
    } finally {
      setFetching(false);
    }
  };

  // Handlers
  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user permanently?')) return;
    try {
      await axios.delete(`${BASE_URL}/users/${id}`, { withCredentials: true });
      setUsers(users.filter(u => u._id !== id));
      toast.success('User deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting user');
    }
  };

  const handleMakeAdmin = async (id, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await axios.put(`${BASE_URL}/users/${id}/role`, { role: newRole }, { withCredentials: true });
      setUsers(users.map(u => u._id === id ? { ...u, role: newRole } : u));
      toast.success(`Role changed to ${newRole}`);
    } catch (error) {
      toast.error('Error changing role');
    }
  };

  const handleDeletePlaylist = async (id) => {
    if (!window.confirm('Delete this playlist system-wide?')) return;
    try {
      await axios.delete(`${BASE_URL}/admin/playlists/${id}`, { withCredentials: true });
      setPlaylists(playlists.filter(p => p._id !== id));
      toast.success('Playlist purged');
    } catch (error) {
      toast.error('Failed to purge playlist');
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      await axios.put(`${BASE_URL}/admin/users/${passwordModal.userId}/password`, { password: newPassword }, { withCredentials: true });
      toast.success(`Password updated for ${passwordModal.username}`);
      setPasswordModal({ open: false, userId: null, username: '' });
      setNewPassword('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    }
  };

  const handleCopyPlaylistLink = (p) => {
    const ownerName = p.owner?.username || 'unknown';
    const link = `${window.location.origin}/${ownerName}/${p._id}`;
    navigator.clipboard.writeText(link);
    toast.success('Playlist link copied!');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // New handlers
  const handleToggleBan = async (id) => {
    try {
      const { data } = await axios.put(`${BASE_URL}/admin/users/${id}/ban`, {}, { withCredentials: true });
      setUsers(users.map(u => u._id === id ? { ...u, isBanned: data.isBanned } : u));
      toast.success(data.message);
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to toggle ban'); }
  };

  const handleToggleVerify = async (id) => {
    try {
      const { data } = await axios.put(`${BASE_URL}/admin/users/${id}/verify`, {}, { withCredentials: true });
      setUsers(users.map(u => u._id === id ? { ...u, isVerified: data.isVerified } : u));
      toast.success(data.message);
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to toggle verify'); }
  };

  const handleBulkAction = async (action) => {
    if (!selectedUsers.length) return toast.error('No users selected');
    const labels = { delete: 'DELETE', ban: 'BAN', unban: 'UNBAN', makeAdmin: 'promote to ADMIN', makeUser: 'demote to USER' };
    if (!window.confirm(`${labels[action]} ${selectedUsers.length} user(s)?`)) return;
    try {
      const { data } = await axios.post(`${BASE_URL}/admin/users/bulk`, { userIds: selectedUsers, action }, { withCredentials: true });
      toast.success(data.message);
      setSelectedUsers([]);
      fetchAllData();
    } catch (error) { toast.error(error.response?.data?.message || 'Bulk action failed'); }
  };

  const handleSendAnnouncement = async () => {
    if (!announceData.subject || !announceData.message) return toast.error('Fill all fields');
    const t = toast.loading('Sending announcement...');
    try {
      const { data } = await axios.post(`${BASE_URL}/admin/announce`, announceData, { withCredentials: true });
      toast.success(data.message, { id: t });
      setAnnounceModal(false);
      setAnnounceData({ subject: '', message: '' });
    } catch (error) { toast.error('Failed to send', { id: t }); }
  };

  const handleSendEmail = async () => {
    if (!emailData.subject || !emailData.message) return toast.error('Fill all fields');
    const t = toast.loading('Sending email...');
    try {
      const { data } = await axios.post(`${BASE_URL}/admin/email-user`, { userId: emailModal.userId, ...emailData }, { withCredentials: true });
      toast.success(data.message, { id: t });
      setEmailModal({ open: false, userId: null, username: '' });
      setEmailData({ subject: '', message: '' });
    } catch (error) { toast.error('Failed to send', { id: t }); }
  };

  const toggleSelectUser = (id) => {
    setSelectedUsers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    const ids = filteredUsers.filter(u => u._id !== user._id).map(u => u._id);
    setSelectedUsers(prev => prev.length === ids.length ? [] : ids);
  };

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin mb-4 mx-auto"></div>
          <h1 className="text-white/40 text-sm font-black tracking-[0.3em] uppercase">Initializing Command Center...</h1>
        </div>
      </div>
    );
  }

  // Sort & Filter
  let filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  if (filterRole !== 'all') filteredUsers = filteredUsers.filter(u => u.role === filterRole);
  if (filterStatus === 'verified') filteredUsers = filteredUsers.filter(u => u.isVerified);
  if (filterStatus === 'unverified') filteredUsers = filteredUsers.filter(u => !u.isVerified);
  if (filterStatus === 'banned') filteredUsers = filteredUsers.filter(u => u.isBanned);
  
  if (sortBy === 'newest') filteredUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (sortBy === 'oldest') filteredUsers.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  if (sortBy === 'name') filteredUsers.sort((a, b) => a.username.localeCompare(b.username));

  const filteredPlaylists = playlists.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.owner?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white pt-6 pb-32 px-4 sm:px-8 overflow-x-hidden">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 sm:mb-12">
        {/* Top row: Back + Title + Refresh */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 border border-white/5 text-white/40 hover:text-white hover:border-white/20 transition-all flex items-center justify-center" title="Go Back">
              <i className="ri-arrow-left-s-line text-lg"></i>
            </button>
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-2xl bg-green-500 flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.3)]">
              <i className="ri-shield-user-fill text-black text-lg sm:text-2xl"></i>
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-black italic tracking-tighter uppercase leading-tight">Command Center</h1>
              <p className="text-[8px] sm:text-[10px] text-white/30 font-bold tracking-[0.15em] sm:tracking-[0.2em] uppercase">System Override Active</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setAnnounceModal(true)} className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500 hover:text-black transition-all flex items-center justify-center" title="Send Announcement">
              <i className="ri-megaphone-line text-lg"></i>
            </button>
            <button onClick={fetchAllData} className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-white/5 border border-white/5 text-white/30 hover:text-green-500 hover:border-green-500/30 transition-all flex items-center justify-center" title="Refresh Data">
              <i className="ri-refresh-line text-lg"></i>
            </button>
          </div>
        </div>

        {/* Tab row: always full width */}
        <div className="flex p-1 bg-white/5 border border-white/5 rounded-2xl backdrop-blur-xl">
          {[
            { key: 'overview', icon: 'ri-dashboard-line', label: 'Overview' },
            { key: 'users', icon: 'ri-group-line', label: 'Users' },
            { key: 'playlists', icon: 'ri-play-list-2-line', label: 'Playlists' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSearchQuery(''); }}
              className={`flex-1 py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                activeTab === tab.key ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'text-white/40 hover:text-white'
              }`}
            >
              <i className={`${tab.icon} text-sm sm:text-base`}></i>
              <span className="hidden xs:inline sm:inline">{tab.label}</span>
              <span className="xs:hidden sm:hidden">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {/* ===== OVERVIEW TAB ===== */}
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6"
            >
              <StatCard icon="ri-group-line" label="Total Users" value={stats?.totalUsers || 0} sub="Registered" color="bg-blue-500" />
              <StatCard icon="ri-play-list-2-line" label="Playlists" value={stats?.totalPlaylists || 0} sub="Global" color="bg-green-500" />
              <StatCard icon="ri-music-2-line" label="Tracks" value={stats?.totalTracks || 0} sub="Unique" color="bg-purple-500" />
              <StatCard icon="ri-flashlight-line" label="System" value="Online" sub="Health OK" color="bg-orange-500" />

              <div className="col-span-2 lg:col-span-4 mt-3 sm:mt-6 p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] bg-white/5 border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 blur-[100px] rounded-full group-hover:bg-green-500/10 transition-all duration-700"></div>
                <h3 className="text-sm sm:text-lg font-black uppercase tracking-widest mb-4 sm:mb-6 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  System Summary
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">
                  <QuickInfo label="Database" status="Stable" />
                  <QuickInfo label="API Response" status="Optimal" />
                  <QuickInfo label="Workers" status="Active" />
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== USERS TAB ===== */}
          {activeTab === 'users' && (
            <motion.div key="users" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 sm:space-y-6">
              {/* Search + Sort/Filter Toolbar */}
              <div className="space-y-3">
                <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="SEARCH USERS..." />
                <div className="flex flex-wrap items-center gap-2">
                  <FilterPill label="Role" value={filterRole} onChange={setFilterRole} options={[['all','All'],['admin','Admin'],['user','User']]} />
                  <FilterPill label="Status" value={filterStatus} onChange={setFilterStatus} options={[['all','All'],['verified','Verified'],['unverified','Unverified'],['banned','Banned']]} />
                  <FilterPill label="Sort" value={sortBy} onChange={setSortBy} options={[['newest','Newest'],['oldest','Oldest'],['name','A-Z']]} />
                  <span className="text-[10px] text-white/20 font-bold ml-auto">{filteredUsers.length} users</span>
                </div>
              </div>

              {/* Bulk Actions Bar */}
              {selectedUsers.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-2 p-3 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider mr-2">{selectedUsers.length} Selected</span>
                  {[
                    { action: 'ban', icon: 'ri-forbid-2-line', label: 'Ban', color: 'red' },
                    { action: 'unban', icon: 'ri-checkbox-circle-line', label: 'Unban', color: 'green' },
                    { action: 'delete', icon: 'ri-delete-bin-7-line', label: 'Delete', color: 'red' },
                    { action: 'makeAdmin', icon: 'ri-shield-flash-line', label: 'Admin', color: 'blue' },
                    { action: 'makeUser', icon: 'ri-user-3-line', label: 'User', color: 'orange' },
                  ].map(b => (
                    <button key={b.action} onClick={() => handleBulkAction(b.action)} className={`px-3 py-1.5 rounded-xl bg-${b.color}-500/10 text-${b.color}-400 text-[10px] font-black uppercase tracking-wider hover:bg-${b.color}-500 hover:text-black transition-all flex items-center gap-1.5 border border-${b.color}-500/20`}>
                      <i className={`${b.icon} text-sm`}></i>{b.label}
                    </button>
                  ))}
                  <button onClick={() => setSelectedUsers([])} className="ml-auto text-[10px] text-white/30 hover:text-white font-bold">Clear</button>
                </motion.div>
              )}

              {/* Desktop Table */}
              <div className="hidden md:block bg-white/5 border border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/2">
                        <th className="px-4 py-6 w-10">
                          <input type="checkbox" onChange={toggleSelectAll} checked={selectedUsers.length > 0 && selectedUsers.length === filteredUsers.filter(u => u._id !== user._id).length} className="accent-green-500 w-4 h-4 rounded cursor-pointer" />
                        </th>
                        <th className="px-4 py-6 text-[10px] font-black uppercase tracking-widest text-white/40">Identity</th>
                        <th className="px-4 py-6 text-[10px] font-black uppercase tracking-widest text-white/40">Email</th>
                        <th className="px-4 py-6 text-[10px] font-black uppercase tracking-widest text-white/40">Joined</th>
                        <th className="px-4 py-6 text-[10px] font-black uppercase tracking-widest text-white/40">Authority</th>
                        <th className="px-4 py-6 text-[10px] font-black uppercase tracking-widest text-white/40">Status</th>
                        <th className="px-4 py-6 text-[10px] font-black uppercase tracking-widest text-right text-white/40">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredUsers.map(u => (
                        <tr key={u._id} className={`hover:bg-white/2 transition-all group ${u.isBanned ? 'opacity-50' : ''}`}>
                          <td className="px-4 py-5">
                            {u._id !== user._id && (
                              <input type="checkbox" checked={selectedUsers.includes(u._id)} onChange={() => toggleSelectUser(u._id)} className="accent-green-500 w-4 h-4 rounded cursor-pointer" />
                            )}
                          </td>
                          <td className="px-4 py-5">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${u.isBanned ? 'bg-red-500/10 text-red-500' : u.role === 'admin' ? 'bg-green-500/10 text-green-500' : 'bg-white/5 text-white/20'}`}>
                                <i className={u.isBanned ? 'ri-forbid-2-line' : u.role === 'admin' ? 'ri-shield-flash-fill' : 'ri-user-3-line'}></i>
                              </div>
                              <div>
                                <span className="text-sm font-black uppercase tracking-tight italic block">{u.username}</span>
                                {u.isBanned && <span className="text-[9px] font-black text-red-500 uppercase tracking-wider">Banned</span>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-5 text-sm text-white/40 font-bold lowercase">{u.email}</td>
                          <td className="px-4 py-5 text-xs text-white/30 font-bold">{formatDate(u.createdAt)}</td>
                          <td className="px-4 py-5">
                            <span className={`px-3 py-1 rounded-full border text-xs font-bold ${u.role === 'admin' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-white/5 border-white/10 text-white/40'}`}>
                              {u.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-5">
                            {u.isVerified ? (
                              <span className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 w-fit">
                                <i className="ri-verified-badge-fill text-sm"></i> Verified
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 w-fit">
                                <i className="ri-error-warning-line text-sm"></i> Unverified
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-5 text-right opacity-0 group-hover:opacity-100 transition-all">
                            {u._id !== user._id && (
                              <div className="flex items-center justify-end gap-1.5 flex-wrap w-max ml-auto max-w-[300px]">
                                <button onClick={() => handleToggleVerify(u._id)} className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all hover:scale-105 ${u.isVerified ? 'bg-orange-500/10 text-orange-400 hover:bg-orange-500 hover:text-black' : 'bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-black'}`}>
                                  <i className={u.isVerified ? 'ri-close-circle-line text-sm' : 'ri-verified-badge-line text-sm'}></i>{u.isVerified ? 'Unverify' : 'Verify'}
                                </button>
                                <button onClick={() => handleToggleBan(u._id)} className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all hover:scale-105 ${u.isBanned ? 'bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-black' : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-black'}`}>
                                  <i className={u.isBanned ? 'ri-checkbox-circle-line text-sm' : 'ri-forbid-2-line text-sm'}></i>{u.isBanned ? 'Unban' : 'Ban'}
                                </button>
                                <button onClick={() => { setEmailModal({ open: true, userId: u._id, username: u.username }); setEmailData({ subject: '', message: '' }); }} className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all hover:scale-105 hover:bg-cyan-500 hover:text-black">
                                  <i className="ri-mail-send-line text-sm"></i>Email
                                </button>
                                <button onClick={() => { setPasswordModal({ open: true, userId: u._id, username: u.username }); setNewPassword(''); }} className="px-2.5 py-1.5 rounded-lg bg-orange-500/10 text-orange-500 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all hover:scale-105 hover:bg-orange-500 hover:text-black">
                                  <i className="ri-lock-password-line text-sm"></i>Pass
                                </button>
                                <button onClick={() => handleMakeAdmin(u._id, u.role)} className="px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-500 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all hover:scale-105 hover:bg-blue-500 hover:text-black">
                                  <i className="ri-key-2-line text-sm"></i>{u.role === 'admin' ? 'Revoke' : 'Admin'}
                                </button>
                                <button onClick={() => handleDeleteUser(u._id)} className="px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all hover:scale-105 hover:bg-red-500 hover:text-black">
                                  <i className="ri-delete-bin-7-line text-sm"></i>Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {filteredUsers.map(u => (
                  <div key={u._id} className={`bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3 ${u.isBanned ? 'opacity-50 border-red-500/10' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {u._id !== user._id && <input type="checkbox" checked={selectedUsers.includes(u._id)} onChange={() => toggleSelectUser(u._id)} className="accent-green-500 w-4 h-4 rounded cursor-pointer shrink-0" />}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${u.isBanned ? 'bg-red-500/10 text-red-500' : u.role === 'admin' ? 'bg-green-500/10 text-green-500' : 'bg-white/5 text-white/20'}`}>
                          <i className={u.isBanned ? 'ri-forbid-2-line' : u.role === 'admin' ? 'ri-shield-flash-fill' : 'ri-user-3-line'}></i>
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-black uppercase tracking-tight italic block truncate">{u.username}</span>
                          <span className="text-[10px] text-white/30 font-bold lowercase truncate block">{u.email}</span>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full border text-[10px] font-black shrink-0 ${u.role === 'admin' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-white/5 border-white/10 text-white/40'}`}>{u.role.toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-white/20 font-bold">Joined {formatDate(u.createdAt)}</span>
                      <span className="text-white/10">•</span>
                      {u.isVerified ? <span className="text-[10px] text-green-500 font-black flex items-center gap-1"><i className="ri-verified-badge-fill"></i> Verified</span> : <span className="text-[10px] text-orange-400 font-black flex items-center gap-1"><i className="ri-error-warning-line"></i> Unverified</span>}
                      {u.isBanned && <><span className="text-white/10">•</span><span className="text-[10px] text-red-500 font-black flex items-center gap-1"><i className="ri-forbid-2-line"></i> Banned</span></>}
                    </div>
                    {u._id !== user._id && (
                      <div className="flex gap-2 pt-1 flex-wrap">
                        <button onClick={() => handleToggleVerify(u._id)} className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${u.isVerified ? 'bg-orange-500/10 text-orange-400' : 'bg-green-500/10 text-green-500'}`}><i className={u.isVerified ? 'ri-close-circle-line' : 'ri-verified-badge-line'}></i>{u.isVerified ? 'Unverify' : 'Verify'}</button>
                        <button onClick={() => handleToggleBan(u._id)} className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${u.isBanned ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}><i className={u.isBanned ? 'ri-checkbox-circle-line' : 'ri-forbid-2-line'}></i>{u.isBanned ? 'Unban' : 'Ban'}</button>
                        <button onClick={() => { setEmailModal({ open: true, userId: u._id, username: u.username }); setEmailData({ subject: '', message: '' }); }} className="py-2 px-3 rounded-xl bg-cyan-500/10 text-cyan-400 text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1"><i className="ri-mail-send-line"></i>Email</button>
                        <button onClick={() => { setPasswordModal({ open: true, userId: u._id, username: u.username }); setNewPassword(''); }} className="py-2 px-3 rounded-xl bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1"><i className="ri-lock-password-line"></i>Pass</button>
                        <button onClick={() => handleMakeAdmin(u._id, u.role)} className="py-2 px-3 rounded-xl bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1"><i className="ri-key-2-line"></i>{u.role === 'admin' ? 'Revoke' : 'Admin'}</button>
                        <button onClick={() => handleDeleteUser(u._id)} className="py-2 px-3 rounded-xl bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center"><i className="ri-delete-bin-7-line"></i></button>
                      </div>
                    )}
                  </div>
                ))}
                {filteredUsers.length === 0 && <p className="text-center text-white/20 text-sm py-8">No users found</p>}
              </div>
            </motion.div>
          )}

          {/* ===== PLAYLISTS TAB ===== */}
          {activeTab === 'playlists' && (
            <motion.div key="playlists" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 sm:space-y-6">
              <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="SEARCH PLAYLISTS..." />
              <div className="hidden md:block bg-white/5 border border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead><tr className="border-b border-white/5 bg-white/2">
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-white/40">Playlist</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-white/40">Owner</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-white/40">Tracks</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-white/40">Created</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-right text-white/40">Actions</th>
                    </tr></thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredPlaylists.map(p => (
                        <tr key={p._id} className="hover:bg-white/2 transition-all group">
                          <td className="px-8 py-5"><div className="flex items-center gap-3"><i className="ri-play-list-2-line text-white/20"></i><span className="text-sm font-black uppercase tracking-tight italic">{p.name}</span></div></td>
                          <td className="px-8 py-5 text-xs font-bold text-white/40 uppercase tracking-widest">{p.owner?.username || 'Unknown'}</td>
                          <td className="px-8 py-5"><span className="text-[10px] bg-white/5 px-2 py-1 rounded-md font-black text-white/40">{p.songs?.length || 0} TRACKS</span></td>
                          <td className="px-8 py-5 text-xs text-white/30 font-bold">{formatDate(p.createdAt)}</td>
                          <td className="px-8 py-5 text-right space-x-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => handleCopyPlaylistLink(p)} className="w-9 h-9 rounded-xl bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-black transition-all" title="Copy Link"><i className="ri-link"></i></button>
                            <button onClick={() => navigate(`/${p.owner?.username}/${p._id}`)} className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-black transition-all" title="View"><i className="ri-eye-line"></i></button>
                            <button onClick={() => handleDeletePlaylist(p._id)} className="w-9 h-9 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-black transition-all" title="Delete"><i className="ri-delete-bin-7-line"></i></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="md:hidden space-y-3">
                {filteredPlaylists.map(p => (
                  <div key={p._id} className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 shrink-0"><i className="ri-play-list-2-line text-lg"></i></div>
                        <div className="min-w-0"><span className="text-sm font-black uppercase tracking-tight italic block truncate">{p.name}</span><span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">by {p.owner?.username || 'Unknown'}</span></div>
                      </div>
                      <span className="text-[10px] bg-white/5 px-2 py-1 rounded-md font-black text-white/40 shrink-0">{p.songs?.length || 0}</span>
                    </div>
                    <div className="text-[10px] text-white/20 font-bold">Created {formatDate(p.createdAt)}</div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => handleCopyPlaylistLink(p)} className="flex-1 py-2.5 rounded-xl bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-wider hover:bg-green-500 hover:text-black transition-all flex items-center justify-center gap-1.5"><i className="ri-link"></i> Link</button>
                      <button onClick={() => navigate(`/${p.owner?.username}/${p._id}`)} className="flex-1 py-2.5 rounded-xl bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-wider hover:bg-blue-500 hover:text-black transition-all flex items-center justify-center gap-1.5"><i className="ri-eye-line"></i> View</button>
                      <button onClick={() => handleDeletePlaylist(p._id)} className="py-2.5 px-4 rounded-xl bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-wider hover:bg-red-500 hover:text-black transition-all flex items-center justify-center"><i className="ri-delete-bin-7-line"></i></button>
                    </div>
                  </div>
                ))}
                {filteredPlaylists.length === 0 && <p className="text-center text-white/20 text-sm py-8">No playlists found</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Password Modal */}
      <AnimatePresence>
        {passwordModal.open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={() => setPasswordModal({ open: false, userId: null, username: '' })}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()} className="bg-[#141416] border border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center"><i className="ri-lock-password-line text-orange-500 text-2xl"></i></div>
                <div><h3 className="text-lg font-black uppercase tracking-tight">Change Password</h3><p className="text-[10px] text-white/30 font-bold tracking-widest uppercase">{passwordModal.username}</p></div>
              </div>
              <input type="password" placeholder="Enter new password (min 6 chars)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()} autoFocus className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-sm font-bold tracking-wider placeholder:text-white/20 focus:outline-none focus:border-orange-500/50 transition-all mb-6" />
              <div className="flex gap-3">
                <button onClick={() => setPasswordModal({ open: false, userId: null, username: '' })} className="flex-1 py-3.5 rounded-2xl bg-white/5 text-white/40 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all">Cancel</button>
                <button onClick={handleChangePassword} className="flex-1 py-3.5 rounded-2xl bg-orange-500 text-black text-xs font-black uppercase tracking-widest hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20">Update</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Announcement Modal */}
      <AnimatePresence>
        {announceModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={() => setAnnounceModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()} className="bg-[#141416] border border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center"><i className="ri-megaphone-line text-purple-400 text-2xl"></i></div>
                <div><h3 className="text-lg font-black uppercase tracking-tight">Announcement</h3><p className="text-[10px] text-white/30 font-bold tracking-widest uppercase">Broadcast to all verified users</p></div>
              </div>
              <input type="text" placeholder="Subject" value={announceData.subject} onChange={(e) => setAnnounceData(p => ({...p, subject: e.target.value}))} autoFocus className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-sm font-bold tracking-wider placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 transition-all mb-3" />
              <textarea placeholder="Message..." value={announceData.message} onChange={(e) => setAnnounceData(p => ({...p, message: e.target.value}))} rows={4} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-sm font-bold tracking-wider placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 transition-all mb-6 resize-none" />
              <div className="flex gap-3">
                <button onClick={() => setAnnounceModal(false)} className="flex-1 py-3.5 rounded-2xl bg-white/5 text-white/40 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all">Cancel</button>
                <button onClick={handleSendAnnouncement} className="flex-1 py-3.5 rounded-2xl bg-purple-500 text-black text-xs font-black uppercase tracking-widest hover:bg-purple-400 transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"><i className="ri-send-plane-fill"></i>Send</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email User Modal */}
      <AnimatePresence>
        {emailModal.open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={() => setEmailModal({ open: false, userId: null, username: '' })}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()} className="bg-[#141416] border border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center"><i className="ri-mail-send-line text-cyan-400 text-2xl"></i></div>
                <div><h3 className="text-lg font-black uppercase tracking-tight">Email User</h3><p className="text-[10px] text-white/30 font-bold tracking-widest uppercase">To: {emailModal.username}</p></div>
              </div>
              <input type="text" placeholder="Subject" value={emailData.subject} onChange={(e) => setEmailData(p => ({...p, subject: e.target.value}))} autoFocus className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-sm font-bold tracking-wider placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 transition-all mb-3" />
              <textarea placeholder="Message..." value={emailData.message} onChange={(e) => setEmailData(p => ({...p, message: e.target.value}))} rows={4} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-sm font-bold tracking-wider placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 transition-all mb-6 resize-none" />
              <div className="flex gap-3">
                <button onClick={() => setEmailModal({ open: false, userId: null, username: '' })} className="flex-1 py-3.5 rounded-2xl bg-white/5 text-white/40 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all">Cancel</button>
                <button onClick={handleSendEmail} className="flex-1 py-3.5 rounded-2xl bg-cyan-500 text-black text-xs font-black uppercase tracking-widest hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"><i className="ri-send-plane-fill"></i>Send</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FilterPill = ({ label, value, onChange, options }) => (
  <div className="relative">
    <select value={value} onChange={(e) => onChange(e.target.value)} className="appearance-none bg-white/5 border border-white/5 rounded-xl py-2 pl-3 pr-8 text-[10px] font-black uppercase tracking-wider text-white/60 focus:outline-none focus:border-green-500/50 cursor-pointer hover:bg-white/10 transition-all">
      {options.map(([val, lbl]) => (<option key={val} value={val} className="bg-[#141416] text-white">{label}: {lbl}</option>))}
    </select>
    <i className="ri-arrow-down-s-line absolute right-2 top-1/2 -translate-y-1/2 text-white/30 text-sm pointer-events-none"></i>
  </div>
);

const SearchBar = ({ value, onChange, placeholder }) => (
  <div className="relative group">
    <i className="ri-search-2-line absolute left-5 sm:left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-green-500 transition-all"></i>
    <input type="text" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-2xl sm:rounded-[2rem] py-4 sm:py-5 px-12 sm:px-14 text-xs sm:text-sm font-black tracking-widest placeholder:text-white/10 focus:outline-none focus:border-green-500/50 transition-all" />
  </div>
);

const StatCard = ({ icon, label, value, sub, color }) => (
  <div className="bg-white/5 border border-white/5 rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 hover:border-white/10 transition-all group relative overflow-hidden">
    <div className={`absolute -right-4 -bottom-4 w-24 h-24 blur-[60px] opacity-20 ${color}`}></div>
    <div className="flex items-center justify-between mb-3 sm:mb-4">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-2xl ${color}/20 ${color.replace('bg-', 'text-')}`}><i className={icon}></i></div>
      <div className="text-right"><span className="text-[9px] sm:text-[10px] text-white/20 font-black uppercase tracking-widest">{label}</span><h4 className="text-2xl sm:text-3xl font-black italic tracking-tighter mt-1">{value}</h4></div>
    </div>
    <p className="text-[9px] sm:text-[10px] text-white/40 font-bold uppercase tracking-[0.2em]">{sub}</p>
  </div>
);

const QuickInfo = ({ label, status }) => (
  <div className="space-y-1">
    <span className="text-[9px] text-white/20 font-black uppercase tracking-widest block">{label}</span>
    <span className="text-xs font-black uppercase tracking-tighter text-green-500">{status}</span>
  </div>
);

export default AdminDashboard;

