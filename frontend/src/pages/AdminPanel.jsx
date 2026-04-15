import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  RiUserSettingsLine, RiSearchLine, RiShieldLine,
  RiUserLine, RiAdminLine, RiCheckLine, RiProhibitedLine, 
  RiRefreshLine, RiFileListLine, RiTeamLine, RiBarChartLine,
  RiArrowRightSLine, RiFilterLine, RiUserSearchLine, RiDeleteBinLine,
  RiAlertLine, RiCloseLine
} from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';

const ROLE_STYLES = {
  admin:     'bg-rose-500/15 text-rose-400 border-rose-500/30',
  moderator: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  user:      'bg-brand-500/15 text-brand-400 border-brand-500/30'
};

export default function AdminPanel() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'logs'
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  
  // Audit Logs State
  const [logs, setLogs] = useState([]);
  const [logPage, setLogPage] = useState(1);
  const [logPages, setLogPages] = useState(1);
  const [logLoading, setLogLoading] = useState(false);
  const [logFilters, setLogFilters] = useState({ action: '', moderatorId: '' });
  const [appliedFilters, setAppliedFilters] = useState({ action: '', moderatorId: '' });
  const [staffList, setStaffList] = useState([]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch {
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await api.get('/admin/staff');
      setStaffList(res.data);
    } catch {
      toast.error('Failed to load staff list.');
    }
  };

  const fetchLogs = useCallback(async () => {
    setLogLoading(true);
    try {
      const params = {
        page: logPage,
        limit: 15,
        ...Object.fromEntries(Object.entries(appliedFilters).filter(([, v]) => v !== ''))
      };
      const res = await api.get('/moderation/audit-logs', { params });
      setLogs(res.data.logs);
      setLogPages(res.data.pages);
    } catch {
      toast.error('Failed to load audit logs.');
    } finally {
      setLogLoading(false);
    }
  }, [logPage, appliedFilters]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else {
      fetchStaff();
      fetchLogs();
    }
  }, [activeTab, fetchLogs]);

  const handleRoleChange = async (userId, newRole) => {
    setActionLoading(userId + '-role');
    try {
      const res = await api.put(`/admin/users/${userId}/role`, { role: newRole });
      setUsers(prev => prev.map(u => u._id === userId ? res.data.user : u));
      toast.success(`Role updated to ${newRole}.`);
      if (['admin', 'moderator'].includes(newRole)) fetchStaff();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (userId) => {
    setActionLoading(userId + '-status');
    try {
      const res = await api.put(`/admin/users/${userId}/toggle-status`);
      setUsers(prev => prev.map(u => u._id === userId ? res.data.user : u));
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = (userId) => {
    setDeleteModal(userId);
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;
    const userId = deleteModal;

    setActionLoading(userId + '-delete');
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(prev => prev.filter(u => u._id !== userId));
      toast.success('User and data purged successfully.');
      setDeleteModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Purge failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    moderators: users.filter(u => u.role === 'moderator').length,
    users: users.filter(u => u.role === 'user').length,
    active: users.filter(u => u.isActive).length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <RiUserSettingsLine className="text-brand-500" />
            <span className="gradient-text">System Administration</span>
          </h1>
          <p className="text-slate-400 mt-1">Manage infrastructure, access protocols, and oversight records</p>
        </div>
        <div className="flex bg-surface-800 p-1.5 rounded-2xl border border-surface-700 shadow-xl">
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <RiTeamLine />
            Staff Directory
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'logs' ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <RiFileListLine />
            Audit Protocol
          </button>
        </div>
      </div>

      {activeTab === 'users' ? (
        <>
          {/* Dashboard Intelligence Section */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { label: 'Total Entities',  value: stats.total,      color: 'text-white',       bg: 'bg-surface-800', icon: RiUserLine },
              { label: 'System Admins',   value: stats.admins,     color: 'text-rose-400',    bg: 'bg-rose-500/10', icon: RiAdminLine },
              { label: 'Active Mods',     value: stats.moderators, color: 'text-amber-400',   bg: 'bg-amber-500/10', icon: RiShieldLine },
              { label: 'Healthy Nodes',   value: stats.active,     color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: RiCheckLine },
              { label: 'Platform Load',   value: 'Optimal',        color: 'text-brand-400',   bg: 'bg-brand-500/10', icon: RiBarChartLine },
            ].map(({ label, value, color, bg, icon: Icon }) => (
              <div key={label} className={`card ${bg} border border-surface-700 p-5 rounded-2xl relative overflow-hidden group`}>
                <Icon className="absolute -right-2 -bottom-2 text-7xl opacity-[0.03] group-hover:scale-110 transition-transform" />
                <p className={`text-2xl font-black ${color} tracking-tight`}>{value}</p>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Directory Controls */}
          <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:max-w-md">
              <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search global directory (name, email, role)..."
                className="w-full bg-surface-800 border border-surface-700 rounded-2xl pl-11 pr-4 py-3 text-sm text-white focus:border-brand-500 outline-none transition-all shadow-inner"
              />
            </div>
            <button onClick={fetchUsers} className="flex items-center gap-2 px-5 py-3 bg-surface-800 border border-surface-700 rounded-2xl text-slate-300 font-bold hover:text-white hover:border-brand-500 transition-all shadow-xl">
              <RiRefreshLine className={loading ? 'animate-spin' : ''} />
              Re-Sync Directory
            </button>
          </div>

          {/* User Record Table */}
          <div className="bg-surface-800 rounded-3xl border border-surface-700 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-900/50 border-b border-surface-700">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest">Identification</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest text-center">Protocol Level</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest text-center">Terminal Status</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right">Administrative Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-700">
                  {loading ? (
                    <tr><td colSpan={4} className="py-24"><LoadingSpinner /></td></tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr><td colSpan={4} className="py-24 text-center text-slate-500 font-bold uppercase text-xs tracking-widest">Empty Data Matrix</td></tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u._id} className="hover:bg-surface-700/20 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600/20 to-indigo-600/20 border border-brand-500/20 flex items-center justify-center text-brand-400 font-black text-xl shadow-lg">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-black text-white text-base flex items-center gap-2">
                                {u.name}
                                {u._id === currentUser.id && <span className="text-[9px] px-2 py-0.5 bg-brand-500/20 text-brand-400 border border-brand-500/20 rounded-full font-black uppercase tracking-tighter">Authorized Self</span>}
                              </p>
                              <p className="text-xs text-slate-500 font-medium">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                          {u._id === currentUser.id ? (
                            <span className={`px-4 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest pointer-events-none ${ROLE_STYLES[u.role]}`}>
                              {u.role}
                            </span>
                          ) : (
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u._id, e.target.value)}
                              disabled={!!actionLoading}
                              className={`bg-surface-900 border border-surface-700 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-300 outline-none focus:border-brand-500 cursor-pointer transition-all ${ROLE_STYLES[u.role]}`}
                            >
                              <option value="user">Standard User</option>
                              <option value="moderator">Moderator Node</option>
                              <option value="admin">System Admin</option>
                            </select>
                          )}
                        </td>
                        <td className="px-8 py-5 text-center">
                          <div className={`inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${u.isActive ? 'text-emerald-400' : 'text-slate-600'}`}>
                            <span className={`w-2 h-2 rounded-full ${u.isActive ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`} />
                            {u.isActive ? 'Online' : 'Restricted'}
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          {u._id !== currentUser.id && (
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => handleToggleStatus(u._id)}
                                disabled={!!actionLoading}
                                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${
                                  u.isActive
                                    ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30 hover:bg-rose-500 hover:text-white'
                                    : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white'
                                }`}
                              >
                                {actionLoading === u._id + '-status' ? '...' : u.isActive ? 'Revoke Access' : 'Restore Access'}
                              </button>
                              
                              <button
                                onClick={() => handleDeleteUser(u._id)}
                                disabled={!!actionLoading}
                                title="Permanently Purge Entity"
                                className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/30 hover:bg-rose-600 hover:text-white transition-all shadow-lg group relative"
                              >
                                {actionLoading === u._id + '-delete' ? (
                                  <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <RiDeleteBinLine size={16} />
                                )}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Enhanced Audit Filter Interface */}
          <div className="card bg-surface-800 p-8 rounded-3xl border border-surface-700 shadow-[0_20px_50px_rgba(0,0,0,0.5)] mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div className="md:col-span-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-3 block">Action Pattern</label>
                <select 
                  value={logFilters.action}
                  onChange={(e) => setLogFilters({...logFilters, action: e.target.value})}
                  className="w-full bg-surface-900 border border-surface-700 rounded-2xl p-3 text-sm text-white font-medium outline-none focus:border-brand-500 transition-all shadow-inner"
                >
                  <option value="">Global Decisions</option>
                  <option value="approved">Success Approvals</option>
                  <option value="rejected">Policy Rejections</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-3 block">Targeted Staff Member</label>
                <div className="relative group">
                  <RiUserSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-500 transition-colors" />
                  <select 
                    value={logFilters.moderatorId}
                    onChange={(e) => setLogFilters({...logFilters, moderatorId: e.target.value})}
                    className="w-full bg-surface-900 border border-surface-700 rounded-2xl pl-12 p-3 text-sm text-white font-medium outline-none focus:border-brand-500 transition-all shadow-inner appearance-none cursor-pointer"
                  >
                    <option value="">Filter by Specific Human...</option>
                    {staffList.map(staff => (
                      <option key={staff._id} value={staff._id}>
                        {staff.name} ({staff.role.toUpperCase()})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">
                    <RiArrowRightSLine className="rotate-90" />
                  </div>
                </div>
              </div>
              <button 
                onClick={() => {setLogPage(1); setAppliedFilters(logFilters);}} 
                disabled={logLoading}
                className="w-full py-3 bg-brand-600 rounded-2xl text-white text-sm font-black uppercase tracking-widest hover:bg-brand-500 transition-all shadow-xl shadow-brand-500/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {logLoading ? (
                  <>
                    <RiRefreshLine className="animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <RiFilterLine size={18} />
                    Run Diagnostics
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-surface-800 rounded-3xl border border-surface-700 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-900/50 border-b border-surface-700">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest">Originator</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest">Protocol Action</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest">Subject Payload</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest">Time Index</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest">Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-700">
                  {logLoading ? (
                    <tr><td colSpan={5} className="py-24"><LoadingSpinner /></td></tr>
                  ) : logs.length === 0 ? (
                    <tr><td colSpan={5} className="py-24 text-center text-slate-500 font-bold uppercase text-xs tracking-widest italic">Zero Logs in Matrix</td></tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log._id} className="hover:bg-surface-700/20 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${log.moderatorId?.role === 'admin' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                            <div>
                              <p className="font-black text-white text-sm">{log.moderatorId?.name}</p>
                              <p className="text-[10px] text-slate-600 font-bold uppercase">{log.moderatorId?.role}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                            log.action === 'approved' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-white font-bold text-sm max-w-[200px] truncate flex items-center gap-2">
                            {log.reviewId?.productName || 'Corrupted Payload'}
                            {log.reviewId?.isDeleted && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-slate-500/20 text-slate-400 border border-slate-500/30 rounded uppercase font-black">Deleted</span>
                            )}
                          </p>
                        </td>
                        <td className="px-8 py-5 text-[10px] text-slate-500 font-medium">
                          {new Date(log.createdAt).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </td>
                        <td className="px-8 py-5 italic text-slate-400 text-xs font-medium max-w-[300px] truncate group relative">
                          {log.reason || 'Manual override'}
                          {log.reason && (
                            <div className="absolute bottom-full left-0 mb-2 p-3 bg-surface-900 border border-surface-600 rounded-xl text-xs w-64 hidden group-hover:block z-50 shadow-2xl">
                              "{log.reason}"
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {logPages > 1 && (
              <div className="p-6 bg-surface-900/50 border-t border-surface-700 flex justify-center items-center gap-6">
                <button onClick={() => setLogPage(p => Math.max(1, p - 1))} disabled={logPage === 1} className="w-10 h-10 rounded-xl bg-surface-800 border border-surface-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-brand-500 disabled:opacity-20 transition-all">
                  <RiArrowRightSLine className="rotate-180 text-xl" />
                </button>
                <div className="bg-surface-800 px-6 py-2 rounded-full border border-surface-700 text-xs font-black text-slate-500 uppercase tracking-widest">
                  Cycle <span className="text-brand-400">{logPage}</span> / {logPages}
                </div>
                <button onClick={() => setLogPage(p => Math.min(logPages, p + 1))} disabled={logPage === logPages} className="w-10 h-10 rounded-xl bg-surface-800 border border-surface-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-brand-500 disabled:opacity-20 transition-all">
                  <RiArrowRightSLine className="text-xl" />
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Custom Deletion Modal - Premium UI */}
      {deleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-surface-800 w-full max-w-lg rounded-[40px] border border-surface-700 shadow-[0_0_100px_rgba(0,0,0,0.8)] p-10 animate-scale-up relative overflow-hidden">
            {/* Critical Warning Strip */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]"></div>
            
            <div className="flex items-center gap-6 mb-8">
              <div className="w-16 h-16 rounded-[24px] bg-rose-500/20 flex items-center justify-center shrink-0">
                <RiAlertLine className="text-rose-500 text-3xl" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">Purge Entity</h3>
                <p className="text-slate-400 font-medium mt-1">Permanent infrastructure removal requested.</p>
              </div>
            </div>
            
            <div className="bg-surface-900/50 border border-surface-700 rounded-3xl p-6 mb-8">
              <p className="text-slate-300 leading-relaxed font-medium text-sm">
                CRITICAL ACTION: You are about to permanently remove <span className="text-white font-black">{users.find(u => u._id === deleteModal)?.name}</span>. 
                All associated data, including reviews and protocol history, will be purged. 
                <span className="text-rose-400 font-bold block mt-3 underline decoration-rose-500/30 underline-offset-4">This operation is non-reversible.</span>
              </p>
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={() => setDeleteModal(null)} 
                disabled={!!actionLoading}
                className="flex-1 px-8 py-4 rounded-2xl bg-surface-700 text-slate-300 text-xs font-black uppercase tracking-widest hover:bg-surface-600 transition-all border border-surface-600 active:scale-95 disabled:opacity-50"
              >
                Maintain Access
              </button>
              <button
                onClick={confirmDelete}
                disabled={!!actionLoading}
                className="flex-1 px-8 py-4 rounded-2xl bg-rose-600 text-white text-xs font-black uppercase tracking-widest shadow-2xl shadow-rose-500/30 hover:bg-rose-500 transition-all border border-rose-400/30 active:scale-95 disabled:opacity-50 flex items-center justify-center"
              >
                {actionLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Confirm Purge'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
