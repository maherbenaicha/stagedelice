import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  BrainCircuit,
  Briefcase,
  Users,
  ClipboardList,
  UserCheck,
  Settings,
  UserCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import './Layout.css';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/dashboard/talent', icon: BrainCircuit, label: 'Dashboard IA' },
  { to: '/dashboard/talent/offers', icon: Briefcase, label: 'Offres IA' },
  { to: '/dashboard/talent/candidates', icon: UserCheck, label: 'Talent AI' },
  { to: '/dashboard/tests', icon: ClipboardList, label: 'Tests' },
  { to: '/dashboard/candidates', icon: Users, label: 'Candidats tests' },
  { to: '/dashboard/users', icon: Settings, label: 'Utilisateurs', adminOnly: true },
  { to: '/dashboard/profile', icon: UserCircle, label: 'Mon profil' },
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
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
        <nav className="sidebar-nav">
          {visibleItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
                <span className="nav-icon"><Icon size={18} strokeWidth={1.75} /></span>
                {!collapsed && <span className="nav-label">{item.label}</span>}
              </NavLink>
            );
          })}
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
          <button className="logout-btn" onClick={handleLogout} title="Déconnexion">
            <LogOut size={16} strokeWidth={1.75} />
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
