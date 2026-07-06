import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Layout.css';

const navItems = [
  { to: '/dashboard', icon: '📊', label: 'Tableau de bord' },
  { to: '/dashboard/tests', icon: '📝', label: 'Tests' },
  { to: '/dashboard/candidates', icon: '👥', label: 'Candidats' },
  { to: '/dashboard/users', icon: '⚙️', label: 'Utilisateurs', adminOnly: true },
  { to: '/dashboard/profile', icon: '👤', label: 'Mon profil' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const visibleItems = navItems.filter(item => !item.adminOnly || user?.role === 'admin');

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="layout">
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <img src="/image/logo.jpg" alt="Délice" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
            {!collapsed && <span className="logo-text">Délice RH</span>}
          </div>
          <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? '→' : '←'}
          </button>
        </div>
        <nav className="sidebar-nav">
          {visibleItems.map(item => (
            <NavLink key={item.to} to={item.to} className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="avatar">{user?.name?.[0]?.toUpperCase()}</div>
            {!collapsed && (
              <div className="user-details">
                <div className="user-name">{user?.name}</div>
                <div className="user-role">{user?.role}</div>
              </div>
            )}
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Déconnexion">🚪</button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
