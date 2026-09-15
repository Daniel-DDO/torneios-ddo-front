import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Edit,
  Camera,
  Mail,
  Wallet,
} from 'lucide-react';
import PopupAtualizarFoto from '../components/PopupAtualizarFoto';
import PopupAlterarCredenciais from '../components/PopupAlterarCredenciais';
import PopupAtualizarConta from '../components/PopupAtualizarConta';
import PopupGeral from '../components/PopupGeral';
import { useAppContext } from '../context/AppContext';
import { DashboardLayout } from '../layouts/DashboardLayout';

export function TelaMinhaConta() {
  const navigate = useNavigate();
  const { currentUser, atualizarUsuario, getAvatarUrl, abrirLogin } = useAppContext();

  const [showAvatarPopup, setShowAvatarPopup] = useState(false);
  const [showCredenciaisPopup, setShowCredenciaisPopup] = useState(false);
  const [showAtualizarContaPopup, setShowAtualizarContaPopup] = useState(false);

  const handleAvatarUpdate = (novaUrl: string) => {
    atualizarUsuario({ imagem: novaUrl });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatCurrency = (value: number | null) => {
    const val = value ?? 0;
    return 'D$ ' + val.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const avatarUrl = currentUser ? getAvatarUrl(currentUser.imagem) : null;

    if (!currentUser) {
    return (
      <>
        <DashboardLayout esconderBusca>
          <div />
        </DashboardLayout>
        <PopupGeral
          title="Login Necessário"
          message="Faça login para visualizar sua conta."
          type="warning"
          buttonText="Fazer Login"
          onClose={() => navigate('/')}
          onConfirm={() => {
            navigate('/');
            abrirLogin();
          }}
        />
      </>
    );
  }

  return (
    <DashboardLayout esconderBusca contentStyle={{ padding: '1rem 0rem' }}>
      <style>{`
        .page-content {
          padding: 2rem 3rem;
          display: flex;
          justify-content: center;
        }

        .profile-container {
          width: 100%;
          max-width: 900px;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .profile-header-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius);
          padding: 3rem 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          box-shadow: var(--shadow-sm);
          overflow: hidden;
        }

        .profile-bg-detail {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 120px;
          background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
          opacity: 0.1;
          z-index: 0;
        }

        .profile-avatar-large {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          border: 4px solid var(--bg-card);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
          font-weight: 700;
          color: white;
          background-color: var(--primary);
          background-position: center;
          background-size: cover;
          z-index: 1;
          margin-bottom: 1.5rem;
          position: relative;
        }

        .profile-badge {
          position: absolute;
          bottom: 5px;
          right: 5px;
          background: var(--success);
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 3px solid var(--bg-card);
        }

        .profile-info {
          text-align: center;
          z-index: 1;
        }

        .profile-name {
          font-size: 2rem;
          font-weight: 800;
          color: var(--text-dark);
          margin-bottom: 0.5rem;
        }

        .profile-discord {
          color: var(--primary);
          font-weight: 600;
          font-size: 1.1rem;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .profile-role-tag {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          background: rgba(var(--primary-rgb), 0.1);
          color: var(--primary);
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.5px;
          margin-bottom: 2rem;
        }

        .profile-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          width: 100%;
          margin-bottom: 2rem;
        }

        .stat-box {
          background: var(--bg-main);
          padding: 1.5rem;
          border-radius: var(--radius);
          text-align: center;
          border: 1px solid var(--border-color);
          transition: transform 0.2s;
        }

        .stat-box:hover {
          transform: translateY(-2px);
          border-color: var(--primary);
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-dark);
          margin-bottom: 4px;
        }

        .stat-value.money {
          color: var(--success);
        }

        .stat-label {
          font-size: 0.85rem;
          color: var(--text-gray);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .profile-details-list {
          width: 100%;
          border-top: 1px solid var(--border-color);
          padding-top: 2rem;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .detail-item label {
          display: block;
          font-size: 0.8rem;
          color: var(--text-gray);
          margin-bottom: 4px;
        }

        .detail-item span {
          font-size: 1rem;
          color: var(--text-dark);
          font-weight: 500;
        }

        .action-buttons-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
          width: 100%;
        }

        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px 20px;
          border-radius: var(--radius);
          border: 1px solid var(--border-color);
          background: var(--bg-card);
          color: var(--text-dark);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        @media (max-width: 768px) {
          .profile-details-list {
            grid-template-columns: 1fr;
            gap: 1rem;
            text-align: center;
          }
          .action-buttons-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="profile-container">

        <div className="profile-header-card">
          <div className="profile-bg-detail"></div>

          <div
              className="profile-avatar-large"
              style={{
                  backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none'
              }}
          >
              {!avatarUrl && (currentUser.nome?.charAt(0) || '0')}
              <div className="profile-badge"></div>
          </div>

          <div className="profile-info">
              <h1 className="profile-name">{currentUser.nome || '0'}</h1>
              <div className="profile-discord">
                    <span style={{opacity: 0.7}}>#</span> {currentUser.discord || '0'}
              </div>
              <span className="profile-role-tag">
                  {(currentUser.cargo || '0').replace('_', ' ')}
              </span>
          </div>

          <div className="profile-stats-grid">
              <div className="stat-box">
                  <div className="stat-value money">{formatCurrency(currentUser.saldoVirtual)}</div>
                  <div className="stat-label">Saldo Virtual</div>
              </div>

              <div className="stat-box">
                  <div className="stat-value">{currentUser.partidasJogadas ?? 0}</div>
                  <div className="stat-label">Partidas</div>
              </div>

              <div className="stat-box">
                  <div className="stat-value">{currentUser.titulos ?? 0}</div>
                  <div className="stat-label">Títulos</div>
              </div>

              <div className="stat-box">
                  <div className="stat-value">{currentUser.golsMarcados ?? 0}</div>
                  <div className="stat-label">Gols Marcados</div>
              </div>

              <div className="stat-box">
                  <div className="stat-value">{currentUser.golsSofridos ?? 0}</div>
                  <div className="stat-label">Gols Sofridos</div>
              </div>

              <div className="stat-box">
                  <div className="stat-value">
                      {currentUser.partidasJogadas > 0
                          ? (currentUser.golsMarcados / currentUser.partidasJogadas).toFixed(2).replace('.', ',')
                          : '0,00'}
                  </div>
                  <div className="stat-label">Média p/ Jogo</div>
              </div>
          </div>

          <div className="profile-details-list">
              <div className="detail-item">
                  <label>ID do Jogador</label>
                  <span style={{fontFamily: 'monospace', fontSize: '0.9rem'}}>{currentUser.id || '0'}</span>
              </div>
              <div className="detail-item">
                  <label>Membro desde</label>
                  <span>{formatDate(currentUser.criacaoConta || '')}</span>
              </div>
          </div>
        </div>

        <div className="action-buttons-container">
            <button className="action-btn" onClick={() => setShowAvatarPopup(true)}>
              <Camera size={20} />
              Atualizar foto do perfil
            </button>
            <button className="action-btn" onClick={() => navigate('/minha-conta/financeiro')}>
              <Wallet size={20} />
              Minhas finanças
            </button>
            <button className="action-btn" onClick={() => setShowAtualizarContaPopup(true)}>
              <Edit size={20} />
              Atualizar conta
            </button>
            <button className="action-btn" onClick={() => setShowCredenciaisPopup(true)}>
              <Mail size={20} />
              Atualizar email e senha
            </button>
        </div>

      </div>

      {showAvatarPopup && (
        <PopupAtualizarFoto
          onClose={() => setShowAvatarPopup(false)}
          onUpdateSuccess={handleAvatarUpdate}
        />
      )}

      {showCredenciaisPopup && (
        <PopupAlterarCredenciais
          onClose={() => setShowCredenciaisPopup(false)}
          onSuccess={() => {
            setShowCredenciaisPopup(false);
            alert('Credenciais atualizadas com sucesso!');
          }}
        />
      )}

      {showAtualizarContaPopup && currentUser && (
        <PopupAtualizarConta
          currentUser={currentUser}
          onClose={() => setShowAtualizarContaPopup(false)}
          onUpdateSuccess={(updatedData: any) => {
             atualizarUsuario(updatedData);
             setShowAtualizarContaPopup(false);
          }}
        />
      )}
    </DashboardLayout>
  );
}