import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Boxes } from '@/components/ui/background-boxes';

const Landing = () => {
  return (
    <div className="min-h-screen">
      <div className="h-screen relative w-full overflow-hidden bg-slate-900 flex flex-col items-center justify-center">
        <div className="absolute inset-0 w-full h-full bg-slate-900 z-20 [mask-image:radial-gradient(transparent,white)] pointer-events-none" />
        <Boxes />
        
        <div className="container mx-auto px-4 relative z-20">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-6 text-5xl font-bold text-white md:text-6xl">
              Bem-vindo à sua plataforma de gestão de{' '}
              <span className="text-primary">Agentes de I.A.</span> 🤖
            </h1>
            <div className="flex flex-wrap justify-center gap-4 mt-12">
              <Link to="/signup">
                <Button size="lg" className="text-lg">
                  Contratar Agora
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="text-lg bg-white/10 text-white border-white/20 hover:bg-white/20">
                  Fazer Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
