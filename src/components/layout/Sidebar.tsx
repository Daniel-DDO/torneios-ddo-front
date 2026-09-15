import type { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Trophy,
  Shield,
  Wallet,
  Settings,
  Gamepad2,
  Star,
  CalendarSync,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

interface ItemMenu {
  label: string;
  path: string;
  icon: ReactNode;
}

const itensPrincipais: ItemMenu[] = [
  { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
  { label: 'Jogadores', path: '/jogadores', icon: <Users size={20} /> },
  { label: 'Clubes', path: '/clubes', icon: <Shield size={20} /> },
  { label: 'Competições', path: '/competicoes', icon: <Trophy size={20} /> },
  { label: 'Títulos', path: '/titulos', icon: <Star size={20} /> },
  { label: 'Temporadas', path: '/temporadas', icon: <CalendarSync size={20} /> },
];

const itensSecundarios: ItemMenu[] = [
  { label: 'Partidas', path: '/partidas', icon: <Gamepad2 size={20} /> },
  { label: 'Minha conta', path: '/minha-conta', icon: <Wallet size={20} /> },
  { label: 'Suporte', path: '/suporte', icon: <Settings size={20} /> },
];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarOpen, isMobile, fecharSidebarSeMobile } = useAppContext();

  const irPara = (path: string) => {
    navigate(path);
    fecharSidebarSeMobile();
  };

  const estaAtivo = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <aside
        className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}
        style={{
          zIndex: 100,
          position: isMobile ? 'fixed' : undefined,
          top: isMobile ? 0 : undefined,
          left: isMobile ? 0 : undefined,
          bottom: isMobile ? 0 : undefined,
          height: isMobile ? '100vh' : undefined,
          width: isMobile ? '80%' : undefined,
          maxWidth: isMobile ? '300px' : undefined,
          transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : undefined,
          transition: isMobile ? 'transform 0.3s ease' : undefined,
          backgroundColor: isMobile ? 'var(--bg-card)' : undefined,
          overflowY: isMobile ? 'auto' : undefined,
          boxShadow: isMobile ? '2px 0 12px rgba(0,0,0,0.3)' : undefined,
        }}
      >
        <div className="logo-area">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
            </svg>
          </div>
          <span className="logo-text">
            Torneios <span>DDO</span>
          </span>
        </div>

        <nav className="nav-menu">
          {itensPrincipais.map((item) => (
            <a
              key={item.path}
              onClick={() => irPara(item.path)}
              className={`nav-item ${estaAtivo(item.path) ? 'active' : ''}`}
              style={{ cursor: 'pointer' }}
            >
              {item.icon} {item.label}
            </a>
          ))}

          <div className="nav-separator"></div>

          {itensSecundarios.map((item) => (
            <a
              key={item.path}
              onClick={() => irPara(item.path)}
              className={`nav-item ${estaAtivo(item.path) ? 'active' : ''}`}
              style={{ cursor: 'pointer' }}
            >
              {item.icon} {item.label}
            </a>
          ))}
        </nav>
      </aside>

      {isMobile && sidebarOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 99,
          }}
          onClick={fecharSidebarSeMobile}
        />
      )}
    </>
  );
}