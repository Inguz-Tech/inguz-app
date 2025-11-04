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
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-primary">INGUZ.TECH</span>
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
