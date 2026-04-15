import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  RiShieldCheckLine, RiDashboardLine, RiBarChartLine,
  RiUserSettingsLine, RiLogoutBoxLine, RiMenuLine, RiCloseLine
} from 'react-icons/ri';
import { useState } from 'react';

const ROLE_COLORS = {
  admin: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  moderator: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  user: 'bg-brand-500/20 text-brand-400 border-brand-500/30'
};

const NAV_LINKS = {
  user: [{ to: '/dashboard', label: 'Dashboard', icon: RiDashboardLine }],
  moderator: [
    { to: '/moderator', label: 'Moderation', icon: RiShieldCheckLine },
    { to: '/analytics', label: 'My Performance', icon: RiBarChartLine }
  ],
  admin: [
    { to: '/moderator', label: 'Moderation', icon: RiShieldCheckLine },
    { to: '/analytics', label: 'System Health', icon: RiBarChartLine },
    { to: '/admin', label: 'Admin', icon: RiUserSettingsLine }
  ]
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = NAV_LINKS[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-surface-800/90 backdrop-blur-md border-b border-surface-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center shadow-lg group-hover:shadow-brand-500/30 transition-shadow">
              <RiShieldCheckLine className="text-white text-lg" />
            </div>
            <span className="font-bold text-lg text-white hidden sm:block">
              Review<span className="gradient-text">Guard</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-brand-600/20 text-brand-400 border border-brand-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-surface-600'
                  }`}
                >
                  <Icon className="text-base" />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* User badge */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="text-right">
                <p className="text-sm font-semibold text-white leading-none">{user?.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
              </div>
              <span className={`badge border ${ROLE_COLORS[user?.role]} capitalize`}>
                {user?.role}
              </span>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              id="logout-btn"
              title="Logout"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200 text-sm"
            >
              <RiLogoutBoxLine className="text-base" />
              <span className="hidden sm:inline">Logout</span>
            </button>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-surface-600 transition-all"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <RiCloseLine className="text-xl" /> : <RiMenuLine className="text-xl" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-surface-800 border-t border-surface-500 px-4 py-3 flex flex-col gap-1 animate-slide-up">
          {links.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active ? 'bg-brand-600/20 text-brand-400' : 'text-slate-400 hover:text-white hover:bg-surface-600'
                }`}
              >
                <Icon className="text-base" />
                {label}
              </Link>
            );
          })}
          <div className="pt-2 mt-1 border-t border-surface-500 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">{user?.name}</p>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
            <span className={`badge border ${ROLE_COLORS[user?.role]} capitalize`}>{user?.role}</span>
          </div>
        </div>
      )}
    </nav>
  );
}
