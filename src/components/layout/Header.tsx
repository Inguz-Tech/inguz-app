import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';

export const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="text-2xl font-bold flex items-center">
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg" 
            className="inline-block mr-2 animate-fade-in transition-transform duration-300 ease-in-out hover:rotate-180"
          >
            <path 
              d="M4 4L20 20M4 20L20 4" 
              stroke="currentColor" 
              strokeWidth="2" 
              fill="hsl(var(--burgundy))"
            />
          </svg>
          <span className="text-burgundy">INGUZ</span>
          <span className="text-navy">.TECH</span>
        </Link>

        <nav className="flex items-center gap-6">
          {user ? (
            <>
              <Link to="/dashboard" className="text-sm font-medium text-foreground hover:text-primary">
                Dashboard
              </Link>
              <Link to="/conversations" className="text-sm font-medium text-foreground hover:text-primary">
                Conversas
              </Link>
              <Link to="/agents" className="text-sm font-medium text-foreground hover:text-primary">
                Agentes
              </Link>
              <Link to="/settings" className="text-sm font-medium text-foreground hover:text-primary">
                Configurações
              </Link>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link to="/signup">
                <Button>Cadastre-se</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
