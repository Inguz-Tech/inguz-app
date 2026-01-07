import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/lib/analytics';

const pageTitles: Record<string, string> = {
  '/': 'Landing',
  '/login': 'Login',
  '/signup': 'Cadastro',
  '/dashboard': 'Dashboard',
  '/conversations': 'Conversas',
  '/agents': 'Agentes',
  '/settings': 'Configurações',
};

export const RouteTracker = () => {
  const location = useLocation();

  useEffect(() => {
    const pageTitle = pageTitles[location.pathname] || 'Página';
    trackPageView(location.pathname, pageTitle);
  }, [location.pathname]);

  return null;
};
