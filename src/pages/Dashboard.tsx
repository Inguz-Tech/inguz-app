import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MessageSquare, Send, Inbox, Calendar as CalendarIcon } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useGraphData } from '@/hooks/useGraphData';

const Dashboard = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 7),
    to: new Date(),
  });

  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics(dateRange.from, dateRange.to);
  const { data: graphData, isLoading: graphLoading } = useGraphData(dateRange.from, dateRange.to);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('justify-start text-left font-normal')}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })} -{' '}
                {format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={dateRange.from}
                onSelect={(date) => date && setDateRange({ ...dateRange, from: date })}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Conversas</CardTitle>
              <MessageSquare className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metricsLoading ? '...' : metrics?.totalConversations || 0}
              </div>
              <p className="text-xs text-muted-foreground">Total no período selecionado</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mensagens Enviadas</CardTitle>
              <Send className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metricsLoading ? '...' : metrics?.messagesSent || 0}
              </div>
              <p className="text-xs text-muted-foreground">Total no período selecionado</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mensagens Recebidas</CardTitle>
              <Inbox className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metricsLoading ? '...' : metrics?.messagesReceived || 0}
              </div>
              <p className="text-xs text-muted-foreground">Total no período selecionado</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Mensagens ao Longo do Tempo</CardTitle>
          </CardHeader>
          <CardContent>
            {graphLoading ? (
              <div className="flex h-[300px] items-center justify-center">Carregando...</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={graphData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="sent" stroke="hsl(var(--primary))" name="Enviadas" />
                  <Line type="monotone" dataKey="received" stroke="hsl(var(--muted-foreground))" name="Recebidas" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <Button size="lg" onClick={() => navigate('/conversations')}>
            Ver Conversas
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
