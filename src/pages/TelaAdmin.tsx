import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Key,
  Lock,
  UserPlus,
  UserCheck,
  Megaphone,
  Banknote,
  ShieldPlus,
  Wand2,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import '../styles/TorneiosPage.css';
import LoadingSpinner from '../components/LoadingSpinner';
import PopupAutorizar from '../components/PopupAutorizar';
import PopupCadastrarJogador from '../components/PopupCadastrarJogador';
import PopupRecSenhaAdm from '../components/PopupRecSenhaAdm';
import PopupSaldoConta from '../components/PopupSaldoConta';
import PopupNovoClube from '../components/PopupNovoClube';
import PopupAnuncio from '../components/PopupAnuncio';
import PopupAtualizarJogador from '../components/PopupAtualizarJogador';
import { useAppContext } from '../context/AppContext';
import { DashboardLayout } from '../layouts/DashboardLayout';

export function TelaAdmin() {
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAppContext();
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [showCadastrarJogadorPopup, setShowCadastrarJogadorPopup] = useState(false);
  const [showRecSenhaAdmPopup, setShowRecSenhaAdmPopup] = useState(false);
  const [showSaldoPopup, setShowSaldoPopup] = useState(false);
  const [showNovoClubePopup, setShowNovoClubePopup] = useState(false);
  const [showAnuncioPopup, setShowAnuncioPopup] = useState(false);
  const [showAtualizarJogador, setShowAtualizarJogador] = useState(false);

  // A tela de mercado só é acessível para DIRETOR e PROPRIETARIO (a própria
  // TelaMercadoAdmin também bloqueia o acesso, mas evitamos mostrar o card
  // para quem nem entraria na tela).
  const podeAcessarMercado = currentUser && ['DIRETOR', 'PROPRIETARIO'].includes(currentUser.cargo);

  // A inflação de clubes é exclusiva do PROPRIETARIO (a própria
  // TelaInflacaoClubes também bloqueia o acesso).
  const ehProprietario = currentUser?.cargo === 'PROPRIETARIO';

  if (!isAdmin) {
    return <LoadingSpinner isLoading={true} />;
  }

  return (
    <DashboardLayout esconderBusca>
      <style>{`
        .page-content {
          padding: 2rem 3rem;
        }

        .admin-header-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
        }

        .admin-grid-actions {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 24px;
        }

        .action-card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius);
            padding: 24px;
            cursor: pointer;
            transition: all 0.2s;
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
        }

        .action-card:hover {
            border-color: var(--primary);
            box-shadow: var(--shadow-md);
            transform: translateY(-3px);
        }

        .action-icon {
            margin-bottom: 16px;
            color: var(--primary);
            width: 40px;
            height: 40px;
        }

        .action-title {
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--text-dark);
            margin-bottom: 8px;
        }

        .action-desc {
            font-size: 0.9rem;
            color: var(--text-gray);
            line-height: 1.5;
        }

        @media (max-width: 900px) {
            .page-content { padding: 1rem; }
        }
      `}</style>

      <>
        <div className="admin-header-section">
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Painel Administrativo</h2>
            <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>
              Bem-vindo, {currentUser && currentUser.cargo ? currentUser.cargo.charAt(0) + currentUser.cargo.slice(1).toLowerCase() : 'Admin'}. Gerencie o sistema aqui.
            </p>
          </div>
        </div>

        <div className="admin-grid-actions">

          <div className="action-card" onClick={() => setShowAuthPopup(true)}>
              <div className="action-icon"><Key size={40} /></div>
              <h4 className="action-title">Autorizar jogador</h4>
              <p className="action-desc">Gerar código para conta reivindicada</p>
          </div>

          <div className="action-card" onClick={() => setShowRecSenhaAdmPopup(true)}>
              <div className="action-icon"><Lock size={40} /></div>
              <h4 className="action-title">Recuperar senha</h4>
              <p className="action-desc">Gere e envie o pin para o jogador que esqueceu da sua senha</p>
          </div>

          <div className="action-card" onClick={() => setShowCadastrarJogadorPopup(true)}>
              <div className="action-icon"><UserPlus size={40} /></div>
              <h4 className="action-title">Cadastrar jogador</h4>
              <p className="action-desc">Cadastre os novos jogadores aqui</p>
          </div>

          <div className="action-card" onClick={() => setShowNovoClubePopup(true)}>
              <div className="action-icon"><ShieldPlus size={40} /></div>
              <h4 className="action-title">Cadastrar clube</h4>
              <p className="action-desc">Cadastre novos clubes e times no sistema</p>
          </div>

          <div className="action-card" onClick={() => setShowSaldoPopup(true)}>
              <div className="action-icon"><Banknote size={40} /></div>
              <h4 className="action-title">Realizar Transação</h4>
              <p className="action-desc">Adicionar ou remover saldo de um jogador</p>
          </div>

          <div className="action-card" onClick={() => setShowAtualizarJogador(true)}>
              <div className="action-icon"><UserCheck size={40} /></div>
              <h4 className="action-title">Atualizar jogador</h4>
              <p className="action-desc">Aposentou? Voltou? Atualize o status dos jogadores aqui</p>
          </div>

          <div className="action-card" onClick={() => setShowAnuncioPopup(true)}>
              <div className="action-icon"><Megaphone size={40} /></div>
              <h4 className="action-title">Criar anúncio</h4>
              <p className="action-desc">Visualize, crie e edite os anúncios</p>
          </div>

          <div className="action-card" onClick={() => navigate('/admin/conquistas')}>
              <div className="action-icon"><Wand2 size={40} /></div>
              <h4 className="action-title">Conquistas</h4>
              <p className="action-desc">Gerencie as artes de campeão geradas para cada título</p>
          </div>

          {podeAcessarMercado && (
            <div className="action-card" onClick={() => navigate('/admin/mercado')}>
                <div className="action-icon"><DollarSign size={40} /></div>
                <h4 className="action-title">Mercado Financeiro</h4>
                <p className="action-desc">Status da cotação, IPCA e multiplicação do valor dos clubes</p>
            </div>
          )}

          {ehProprietario && (
            <div className="action-card" onClick={() => navigate('/admin/inflacao')}>
                <div className="action-icon"><TrendingUp size={40} /></div>
                <h4 className="action-title">Inflação de clubes</h4>
                <p className="action-desc">Simule e aplique a inflação de mercado sobre o valor dos clubes</p>
            </div>
          )}

        </div>
      </>

      {showAuthPopup && currentUser && (
        <PopupAutorizar
          adminId={currentUser.id}
          onClose={() => setShowAuthPopup(false)}
        />
      )}

      {showCadastrarJogadorPopup && (
        <PopupCadastrarJogador
          onClose={() => setShowCadastrarJogadorPopup(false)}
        />
      )}

      {showRecSenhaAdmPopup && currentUser && (
        <PopupRecSenhaAdm
          currentUser={currentUser}
          onClose={() => setShowRecSenhaAdmPopup(false)}
        />
      )}

      {showSaldoPopup && (
        <PopupSaldoConta
            jogadorId=""
            onClose={() => setShowSaldoPopup(false)}
            onSuccess={() => {}}
        />
      )}

      {showNovoClubePopup && (
        <PopupNovoClube
            onClose={() => setShowNovoClubePopup(false)}
        />
      )}

      {showAnuncioPopup && (
        <PopupAnuncio
            onClose={() => setShowAnuncioPopup(false)}
        />
      )}

      {showAtualizarJogador && (
        <PopupAtualizarJogador
            onClose={() => setShowAtualizarJogador(false)}
        />
      )}
    </DashboardLayout>
  );
}