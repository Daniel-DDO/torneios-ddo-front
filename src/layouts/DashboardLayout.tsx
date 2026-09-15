import type { ReactNode, CSSProperties } from 'react';
import { useAppContext } from '../context/AppContext';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';
import PopupReivindicar from '../components/PopupReivindicar';
import PopupRecuperarSenha from '../components/PopupRecuperarSenha';
import PopupNotificacao from '../components/PopupNotificacao';

interface DashboardLayoutProps {
  children: ReactNode;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (valor: string) => void;
  searchSlot?: ReactNode;
  headerExtras?: ReactNode;
  esconderBusca?: boolean;
  contentStyle?: CSSProperties;
}

export function DashboardLayout({
  children,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  searchSlot,
  headerExtras,
  esconderBusca,
  contentStyle,
}: DashboardLayoutProps) {
  const {
    sidebarOpen,
    currentUser,
    showLoginPopup,
    showUserPopup,
    showReivindicarPopup,
    showRecuperarSenhaPopup,
    showNotificacaoPopup,
    fecharLogin,
    fecharUserPopup,
    fecharReivindicar,
    fecharRecuperarSenha,
    fecharNotificacoes,
    handleLoginSuccess,
    handleLogout,
    getAvatarUrl,
  } = useAppContext();

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-active' : 'sidebar-hidden'}`}>
      <Sidebar />

            <main className="main-content" style={{ overflowX: 'clip', minWidth: 0 }}>
        <Header
          searchPlaceholder={searchPlaceholder}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          searchSlot={searchSlot}
          extraActions={headerExtras}
          esconderBusca={esconderBusca}
        />

        <div
          className="page-content"
          style={{ animation: 'fadeInUp 0.6s ease-out', padding: '0.1rem 2rem', paddingBottom: '40px', ...contentStyle }}
        >
          {children}
        </div>
      </main>

      {showLoginPopup && <PopupLogin onClose={fecharLogin} onLoginSuccess={handleLoginSuccess} />}

      {showUserPopup && currentUser && (
        <PopupUser
          user={{ ...currentUser, imagem: getAvatarUrl(currentUser.imagem) }}
          onClose={fecharUserPopup}
          onLogout={handleLogout}
        />
      )}

      {showReivindicarPopup && (
        <PopupReivindicar
          onClose={fecharReivindicar}
          onSubmit={(dados) => {
            console.log('Dados para Reivindicar:', dados);
            fecharReivindicar();
          }}
        />
      )}

      {showRecuperarSenhaPopup && (
        <PopupRecuperarSenha
          onClose={fecharRecuperarSenha}
          onSuccess={() => {
            fecharRecuperarSenha();
            alert('Senha redefinida com sucesso!');
          }}
        />
      )}

      {showNotificacaoPopup && <PopupNotificacao onClose={fecharNotificacoes} />}
    </div>
  );
}