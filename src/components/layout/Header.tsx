import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, Lightbulb, X } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

interface HeaderProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (valor: string) => void;
  searchSlot?: ReactNode;
  extraActions?: ReactNode;
  esconderBusca?: boolean;
}

export function Header({
  searchPlaceholder = 'Buscar no sistema...',
  searchValue,
  onSearchChange,
  searchSlot,
  extraActions,
  esconderBusca = false,
}: HeaderProps) {
  const navigate = useNavigate();
  const {
    currentUser,
    isAdmin,
    isMobile,
    toggleSidebar,
    toggleTheme,
    temNotificacaoNaoLida,
    getAvatarUrl,
    abrirUserPopup,
    abrirNotificacoes,
    abrirReivindicar,
    abrirLogin,
  } = useAppContext();

  const [buscaMobileAberta, setBuscaMobileAberta] = useState(false);

  const avatarUrl = getAvatarUrl(currentUser?.imagem);

  const campoBusca = (
    <div
      className="search-bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flex: isMobile ? 1 : undefined,
        width: isMobile ? undefined : '280px',
        maxWidth: isMobile ? undefined : '280px',
        minWidth: 0,
      }}
    >
      <Search size={20} style={{ flexShrink: 0 }} />
      <input
        type="text"
        placeholder={searchPlaceholder}
        value={searchValue ?? ''}
        onChange={(e) => onSearchChange?.(e.target.value)}
        autoFocus={isMobile}
        style={{
          flex: 1,
          minWidth: 0,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          color: 'var(--text-dark)',
          fontSize: isMobile ? '0.9rem' : undefined,
        }}
      />
    </div>
  );

  return (
    <header
      className="top-header compact"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        className="left-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flex: isMobile ? 1 : undefined,
          minWidth: 0,
        }}
      >
        {!(isMobile && buscaMobileAberta) && (
          <button className="toggle-btn menu-toggle" onClick={toggleSidebar} title="Alternar Menu">
            <Menu size={24} />
          </button>
        )}

        {!esconderBusca && (
          searchSlot ?? (
            isMobile ? (
              buscaMobileAberta ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                  {campoBusca}
                  <button
                    className="icon-btn"
                    onClick={() => {
                      setBuscaMobileAberta(false);
                      onSearchChange?.('');
                    }}
                    title="Fechar busca"
                  >
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <button
                  className="icon-btn"
                  onClick={() => setBuscaMobileAberta(true)}
                  title="Buscar"
                >
                  <Search size={20} />
                </button>
              )
            ) : (
              campoBusca
            )
          )
        )}
      </div>

      {!(isMobile && buscaMobileAberta) && (
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {extraActions}

          {isAdmin && (
            <button
              className="btn-admin-header"
              onClick={() => navigate('/admin')}
              title="Painel do Adm"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'white',
                border: 'none',
                padding: isMobile ? '8px 12px' : '8px 16px',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
                marginRight: isMobile ? 0 : '4px',
                fontSize: '0.9rem',
                whiteSpace: 'nowrap',
              }}
            >
              {isMobile ? 'Adm' : 'Painel do Adm'}
            </button>
          )}

          <button className="icon-btn theme-toggle-btn" onClick={toggleTheme} title="Alternar Tema">
            <Lightbulb size={20} />
          </button>

          {currentUser && (
            <button className="icon-btn" onClick={abrirNotificacoes} style={{ position: 'relative' }}>
              <Bell size={20} />
              {temNotificacaoNaoLida && (
                <span
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#ff4757',
                    borderRadius: '50%',
                    border: '1px solid var(--header-bg, #fff)',
                  }}
                ></span>
              )}
            </button>
          )}

          {currentUser ? (
            <div
              className="user-avatar-mini"
              onClick={abrirUserPopup}
              style={{
                backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: avatarUrl ? 'transparent' : 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              {!avatarUrl && currentUser.nome.charAt(0)}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button
                onClick={abrirReivindicar}
                className="reivindicar-btn-header"
                style={{
                  background: 'transparent',
                  color: 'var(--text-dark)',
                  border: '1px solid var(--border-color)',
                  padding: isMobile ? '8px 10px' : '8px 16px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginLeft: '10px',
                  fontSize: isMobile ? '0.8rem' : undefined,
                  whiteSpace: 'nowrap',
                }}
              >
                {isMobile ? 'Reivindicar' : 'Reivindicar Conta'}
              </button>
              <button
                className="login-btn-header"
                onClick={abrirLogin}
                style={{
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginLeft: '10px',
                }}
              >
                Login
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}