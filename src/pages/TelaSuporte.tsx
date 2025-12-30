import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Menu,
  LayoutDashboard,
  Users,
  Trophy,
  Shield,
  Wallet,
  Search,
  Bell,
  Gamepad2,
  Star,
  Settings,
  CalendarSync,
  Lightbulb,
  Send,
  Bot,
  AlertTriangle
} from 'lucide-react';
import { API } from '../services/api';
import PopupLogin from '../components/PopupLogin';
import PopupUser from '../components/PopupUser';
import '../styles/TorneiosPage.css';

interface UserData {
  id: string;
  nome: string;
  discord: string;
  imagem: string | null;
  cargo: string;
  saldoVirtual: number;
  titulos: number;
  finais: number;
  partidasJogadas: number;
  golsMarcados: number;
}

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  time: string;
}

export function TelaSuporte() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: avatars = [] } = useQuery({
    queryKey: ['avatares'],
    queryFn: async () => {
      const response = await API.get('/api/avatares');
      return Array.isArray(response.data) ? response.data : [];
    },
    staleTime: 1000 * 60 * 30,
    enabled: !!currentUser
  });

  const avatarMap = useMemo(() => {
    const map: Record<string, string> = {};
    avatars.forEach((a: any) => map[a.id] = a.url);
    return map;
  }, [avatars]);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user_data');
    if (storedUser) setCurrentUser(JSON.parse(storedUser));

    setMessages([{
      id: 1,
      text: "Sou o assistente virtual dos torneios DDO, pode me chamar para resolver qualquer problema. Seja direto ao ponto. Se possível, envie toda a história completa (em uma mensagem), para que eu possa te ajudar melhor.",
      sender: 'bot',
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: Date.now(),
      text: inputText,
      sender: 'user',
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await API.post('/suporte/chat', { novaPergunta: userMsg.text });
      
      const botMsg: Message = {
        id: Date.now() + 1,
        text: response.data.resposta || "Desculpe, não entendi. Pode reformular?",
        sender: 'bot',
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      const errorMsg: Message = {
        id: Date.now() + 1,
        text: "Ocorreu um erro de conexão. Tente novamente mais tarde.",
        sender: 'bot',
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const inputRows = useMemo(() => {
    const lines = inputText.split('\n').length;
    return (lines > 1 || inputText.length > 55) ? 2 : 1;
  }, [inputText]);

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-active' : 'sidebar-hidden'}`}>
      <style>{`
        .chat-layout {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 100px);
          background: var(--bg-card);
          border-radius: var(--radius);
          border: 1px solid var(--border-color);
          overflow: hidden;
          position: relative;
        }

        .chat-header {
          background: var(--bg-body);
          padding: 16px 24px;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .bot-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .chat-info h3 {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-dark);
          margin: 0;
        }

        .chat-info p {
          font-size: 0.8rem;
          color: var(--success);
          margin: 0;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .chat-warning {
          background: rgba(245, 158, 11, 0.1);
          color: #d97706;
          font-size: 0.75rem;
          padding: 8px 16px;
          text-align: center;
          border-bottom: 1px solid rgba(245, 158, 11, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .messages-area {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
          background-image: radial-gradient(var(--border-color) 1px, transparent 1px);
          background-size: 20px 20px;
        }

        .message-row {
          display: flex;
          gap: 8px;
          max-width: 80%;
        }

        .row-bot { align-self: flex-start; }
        .row-user { align-self: flex-end; flex-direction: row-reverse; }

        .msg-bubble {
          padding: 12px 16px;
          border-radius: 12px;
          position: relative;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          font-size: 0.95rem;
          line-height: 1.5;
        }

        .bubble-bot {
          background: var(--bg-body);
          color: var(--text-dark);
          border: 1px solid var(--border-color);
          border-top-left-radius: 0;
        }

        .bubble-user {
          background: #dcf8c6;
          color: #111b21;
          border-top-right-radius: 0;
        }

        body.dark-mode .bubble-user {
          background: var(--primary);
          color: white;
        }

        .msg-time {
          font-size: 0.65rem;
          margin-top: 4px;
          opacity: 0.7;
          text-align: right;
          display: block;
        }

        .input-area {
          padding: 16px;
          background: var(--bg-body);
          border-top: 1px solid var(--border-color);
          display: flex;
          gap: 12px;
          align-items: flex-end;
        }

        .chat-input {
          flex: 1;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          padding: 12px 20px;
          font-size: 0.95rem;
          color: var(--text-dark);
          resize: none;
          max-height: 100px;
          outline: none;
          transition: height 0.2s ease;
        }

        .chat-input:focus { border-color: var(--primary); }

        .send-btn {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: var(--primary);
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .send-btn:hover { background: var(--primary-light); transform: scale(1.05); }
        .send-btn:disabled { background: var(--text-gray); cursor: not-allowed; }

        .typing-indicator {
          display: flex;
          gap: 4px;
          padding: 12px 16px;
          background: var(--bg-body);
          border-radius: 12px;
          border-top-left-radius: 0;
          border: 1px solid var(--border-color);
          width: fit-content;
          margin-bottom: 10px;
        }

        .dot {
          width: 6px;
          height: 6px;
          background: var(--text-gray);
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }

        .dot:nth-child(1) { animation-delay: -0.32s; }
        .dot:nth-child(2) { animation-delay: -0.16s; }

        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>

      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="logo-area">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
            </svg>
          </div>
          <span className="logo-text">Torneios <span>DDO</span></span>
        </div>
        <nav className="nav-menu">
          <a onClick={() => navigate('/')} className="nav-item"><LayoutDashboard size={20} /> Dashboard</a>
          <a onClick={() => navigate('/jogadores')} className="nav-item"><Users size={20} /> Jogadores</a>
          <a onClick={() => navigate('/clubes')} className="nav-item"><Shield size={20} /> Clubes</a>
          <a onClick={() => navigate('/competicoes')} className="nav-item"><Trophy size={20} /> Competições</a>
          <a onClick={() => navigate('/titulos')} className="nav-item"><Star size={20} /> Títulos</a>
          <a onClick={() => navigate('/temporadas')} className="nav-item"><CalendarSync size={20} /> Temporadas</a>
          <div className="nav-separator"></div>
          <a onClick={() => navigate('/partidas')} className="nav-item"><Gamepad2 size={20} /> Partidas</a>
          <a onClick={() => navigate('/minha-conta')} className="nav-item"><Wallet size={20} /> Minha conta</a>
          <a className="nav-item active"><Settings size={20} /> Suporte</a>
        </nav>
      </aside>

      <main className="main-content">
        <header className="top-header">
          <div className="left-header">
            <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}><Menu size={24} /></button>
            <div className="search-bar"><Search size={18} /><input placeholder="Buscar..." /></div>
          </div>
          <div className="header-actions">
            <button className="icon-btn theme-toggle-btn" onClick={() => setIsDarkMode(!isDarkMode)}>
              <Lightbulb size={20} />
            </button>
            <button className="icon-btn"><Bell size={20} /></button>
            {currentUser ? (
              <div 
                className="user-avatar-mini" 
                onClick={() => setShowUserPopup(true)}
                style={{backgroundImage: currentUser.imagem ? `url(${avatarMap[currentUser.imagem] || currentUser.imagem})` : 'none', backgroundSize:'cover', cursor:'pointer'}}
              >
                {!currentUser.imagem && currentUser.nome.charAt(0)}
              </div>
            ) : (
              <button className="login-btn-header" onClick={() => setShowLoginPopup(true)} style={{background:'var(--primary)', color:'white', border:'none', padding:'8px 16px', borderRadius:'8px', fontWeight:600}}>Login</button>
            )}
          </div>
        </header>

        <div className="page-content">
          <div className="chat-layout">
            <div className="chat-header">
              <div className="bot-avatar">
                <Bot size={24} />
              </div>
              <div className="chat-info">
                <h3>Suporte Virtual DDO</h3>
                <p><span style={{width: 8, height: 8, background: 'var(--success)', borderRadius: '50%', display: 'inline-block'}}></span> Online agora</p>
              </div>
            </div>
            
            <div className="chat-warning">
              <AlertTriangle size={14} /> 
              <span>Histórico não salvo. Em caso de dúvidas persistentes, contate a administração.</span>
            </div>

            <div className="messages-area">
              {messages.map((msg) => (
                <div key={msg.id} className={`message-row ${msg.sender === 'user' ? 'row-user' : 'row-bot'}`}>
                  {msg.sender === 'bot' && (
                    <div style={{width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-body)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
                      <Bot size={16} color="var(--primary)"/>
                    </div>
                  )}
                  <div className={`msg-bubble ${msg.sender === 'user' ? 'bubble-user' : 'bubble-bot'}`}>
                    {msg.text}
                    <span className="msg-time">{msg.time}</span>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="message-row row-bot">
                   <div style={{width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-body)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
                      <Bot size={16} color="var(--primary)"/>
                    </div>
                    <div className="typing-indicator">
                      <div className="dot"></div>
                      <div className="dot"></div>
                      <div className="dot"></div>
                    </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="input-area">
              <textarea 
                className="chat-input" 
                placeholder="Digite sua mensagem..." 
                rows={inputRows}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
              />
              <button 
                className="send-btn" 
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isTyping}
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {showLoginPopup && <PopupLogin onClose={() => setShowLoginPopup(false)} onLoginSuccess={setCurrentUser} />}
      {showUserPopup && currentUser && <PopupUser user={{...currentUser, imagem: avatarMap[currentUser.imagem || ''] || currentUser.imagem}} onClose={() => setShowUserPopup(false)} onLogout={() => { localStorage.removeItem('token'); localStorage.removeItem('user_data'); setCurrentUser(null); setShowUserPopup(false); }} />}
    </div>
  );
}