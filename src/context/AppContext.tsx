import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { API } from '../services/api';

export interface UserData {
  id: string;
  nome: string;
  discord: string;
  imagem: string | null;
  cargo: 'PROPRIETARIO' | 'DIRETOR' | 'ADMINISTRADOR' | 'JOGADOR';
  saldoVirtual: number;
  titulos: number;
  finais: number;
  partidasJogadas: number;
  golsMarcados: number;
  golsSofridos?: number;
  cartoesAmarelos?: number;
  cartoesVermelhos?: number;
  descricao?: string | null;
  contaReivindicada?: boolean;
  suspensoAte?: string | null;
  insignias?: unknown[];
  criacaoConta?: string;
  modificacaoConta?: string;
  statusJogador?: string;
}

interface Avatar {
  id: string;
  url: string;
  nome?: string;
}

interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  link: string;
  tipo: string;
  lida: boolean;
  dataCriacao: string;
}

interface AppContextValue {
  currentUser: UserData | null;
  setCurrentUser: (user: UserData | null) => void;
  atualizarUsuario: (dadosParciais: Partial<UserData>) => void;
  isAdmin: boolean;
  avatarMap: Record<string, string>;
  getAvatarUrl: (referencia: string | null | undefined) => string | null;
  isDarkMode: boolean;
  toggleTheme: () => void;
  isMobile: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  fecharSidebarSeMobile: () => void;
  notificacoes: Notificacao[];
  temNotificacaoNaoLida: boolean;
  showLoginPopup: boolean;
  showUserPopup: boolean;
  showReivindicarPopup: boolean;
  showRecuperarSenhaPopup: boolean;
  showNotificacaoPopup: boolean;
  abrirLogin: () => void;
  fecharLogin: () => void;
  abrirUserPopup: () => void;
  fecharUserPopup: () => void;
  abrirReivindicar: () => void;
  fecharReivindicar: () => void;
  abrirRecuperarSenha: () => void;
  fecharRecuperarSenha: () => void;
  abrirNotificacoes: () => void;
  fecharNotificacoes: () => void;
  handleLoginSuccess: (userData: UserData) => void;
  handleLogout: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const fetchAvatarsService = async (): Promise<Avatar[]> => {
  const response = await API.get('/api/avatares');
  if (Array.isArray(response)) return response;
  if (response.data && Array.isArray(response.data)) return response.data;
  return [];
};

const fetchMinhasNotificacoesService = async (): Promise<Notificacao[]> => {
  const response = await API.get('/api/notificacoes/minhas');
  return response.data || [];
};

/**
 * Só consideramos "sessão inválida" quando o backend respondeu 401.
 * Timeout, erro de rede, 5xx, servidor dormindo (Render), CORS etc.
 * NÃO são motivo para deslogar o usuário.
 */
function ehErroDeAuth(error: unknown): boolean {
  const e = error as { status?: number; response?: { status?: number } } | null;
  const status = e?.status ?? e?.response?.status;
  return status === 401;
}

/** Lê o usuário salvo de forma segura (sem quebrar com JSON inválido). */
function lerUsuarioSalvo(): UserData | null {
  try {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('user_data');
    if (!stored) return null;

    // user_data sem token = sessão já encerrada, limpa o resto.
    if (!token) {
      localStorage.removeItem('user_data');
      return null;
    }

    return JSON.parse(stored) as UserData;
  } catch {
    localStorage.removeItem('user_data');
    return null;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  // Restaura a sessão já na primeira renderização (evita "piscar" deslogado
  // e qualquer corrida entre restauração e redirecionamentos).
  const [currentUser, setCurrentUser] = useState<UserData | null>(lerUsuarioSalvo);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [showReivindicarPopup, setShowReivindicarPopup] = useState(false);
  const [showRecuperarSenhaPopup, setShowRecuperarSenhaPopup] = useState(false);
  const [showNotificacaoPopup, setShowNotificacaoPopup] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  const { data: avatars = [] } = useQuery({
    queryKey: ['avatares'],
    queryFn: fetchAvatarsService,
    staleTime: 1000 * 60 * 60,
  });

  const { data: notificacoes = [], error: notificacoesError } = useQuery<Notificacao[]>({
    queryKey: ['notificacoesMinhas'],
    queryFn: fetchMinhasNotificacoesService,
    enabled: !!currentUser,
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 60 * 5,
    // Tenta de novo em falhas transitórias (servidor acordando, 5xx, rede),
    // mas não insiste em 401: token inválido não se resolve tentando de novo.
    retry: (failureCount, error) => !ehErroDeAuth(error) && failureCount < 2,
    retryDelay: (tentativa) => 1000 * (tentativa + 1),
  });

  const avatarMap = useMemo(() => {
    const map: Record<string, string> = {};
    avatars.forEach((avatar: Avatar) => {
      map[avatar.id] = avatar.url;
    });
    return map;
  }, [avatars]);

  const getAvatarUrl = (referencia: string | null | undefined) => {
    if (!referencia) return null;
    return avatarMap[referencia] || referencia;
  };

  const temNotificacaoNaoLida = useMemo(() => {
    return notificacoes.some((n) => !n.lida);
  }, [notificacoes]);

  const isAdmin = useMemo(() => {
    if (!currentUser) return false;
    return ['ADMINISTRADOR', 'DIRETOR', 'PROPRIETARIO'].includes(currentUser.cargo);
  }, [currentUser]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Desloga SOMENTE se o backend confirmou que o token é inválido (401).
  useEffect(() => {
    if (notificacoesError && ehErroDeAuth(notificacoesError)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user_data');
      setCurrentUser(null);
    }
  }, [notificacoesError]);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const fecharSidebarSeMobile = () => {
    if (isMobile) setSidebarOpen(false);
  };

  const atualizarUsuario = (dadosParciais: Partial<UserData>) => {
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const atualizado = { ...prev, ...dadosParciais };
      localStorage.setItem('user_data', JSON.stringify(atualizado));
      return atualizado;
    });
  };

  const handleLoginSuccess = (userData: UserData) => {
    localStorage.setItem('user_data', JSON.stringify(userData));
    setCurrentUser(userData);
    setShowLoginPopup(false);
  };

  const handleLogout = () => {
    if (window.confirm('Deseja realmente sair?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user_data');
      setCurrentUser(null);
      setShowUserPopup(false);
    }
  };

  const value: AppContextValue = {
    currentUser,
    setCurrentUser,
    atualizarUsuario,
    isAdmin,
    avatarMap,
    getAvatarUrl,
    isDarkMode,
    toggleTheme,
    isMobile,
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar,
    fecharSidebarSeMobile,
    notificacoes,
    temNotificacaoNaoLida,
    showLoginPopup,
    showUserPopup,
    showReivindicarPopup,
    showRecuperarSenhaPopup,
    showNotificacaoPopup,
    abrirLogin: () => setShowLoginPopup(true),
    fecharLogin: () => setShowLoginPopup(false),
    abrirUserPopup: () => setShowUserPopup(true),
    fecharUserPopup: () => setShowUserPopup(false),
    abrirReivindicar: () => setShowReivindicarPopup(true),
    fecharReivindicar: () => setShowReivindicarPopup(false),
    abrirRecuperarSenha: () => setShowRecuperarSenhaPopup(true),
    fecharRecuperarSenha: () => setShowRecuperarSenhaPopup(false),
    abrirNotificacoes: () => setShowNotificacaoPopup(true),
    fecharNotificacoes: () => setShowNotificacaoPopup(false),
    handleLoginSuccess,
    handleLogout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext precisa ser usado dentro de um AppProvider');
  }
  return context;
}