import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStreamers } from '@/hooks/useStreamers';
import { useSnapshots } from '@/hooks/useSnapshots';
import { 
  formatNumber, 
  formatCurrency, 
  calculateHostUsd, 
  calculateAgencyUsd 
} from '@/types/streamer';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  Gem, 
  Users, 
  Crown,
  Percent,
  Calendar,
  Save
} from 'lucide-react';
import { toast } from 'sonner';

const COLORS = ['hsl(330, 100%, 59%)', 'hsl(262, 76%, 57%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(200, 80%, 50%)'];

export default function Dashboard() {
  const { allStreamers, isLoading: streamersLoading } = useStreamers();
  const { snapshots, createSnapshot, isLoading: snapshotsLoading } = useSnapshots();
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [isSaving, setIsSaving] = useState(false);

  // Calculate current stats
  const totalCrystals = allStreamers.reduce((sum, s) => sum + s.host_crystals, 0);
  const totalHostUsd = allStreamers.reduce((sum, s) => sum + calculateHostUsd(s.host_crystals), 0);
  const totalAgencyUsd = allStreamers.reduce((sum, s) => sum + calculateAgencyUsd(s.host_crystals), 0);
  const marginPercent = totalHostUsd > 0 ? (totalAgencyUsd / totalHostUsd) * 100 : 0;

  // Top streamer
  const topStreamer = allStreamers.length > 0 
    ? allStreamers.reduce((max, s) => s.host_crystals > max.host_crystals ? s : max, allStreamers[0])
    : null;

  // Highest cost (most crystals = most cost to pay)
  const highestCost = topStreamer ? calculateHostUsd(topStreamer.host_crystals) : 0;

  // Calculate growth from previous period
  const previousSnapshot = snapshots.find(s => s.period_type === activeTab);
  const growth = previousSnapshot 
    ? ((totalAgencyUsd - previousSnapshot.total_agency_usd) / previousSnapshot.total_agency_usd) * 100 
    : 0;

  // Prepare chart data - top 10 streamers
  const top10Streamers = [...allStreamers]
    .sort((a, b) => b.host_crystals - a.host_crystals)
    .slice(0, 10)
    .map(s => ({
      name: s.name.substring(0, 15),
      crystals: s.host_crystals,
      hostUsd: calculateHostUsd(s.host_crystals),
      agencyUsd: calculateAgencyUsd(s.host_crystals)
    }));

  // Pie chart data
  const pieData = [
    { name: 'Host', value: totalHostUsd },
    { name: 'Agência', value: totalAgencyUsd }
  ];

  // Get period label
  const getPeriodLabel = () => {
    const now = new Date();
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    if (activeTab === 'weekly') {
      const weekNum = Math.ceil((now.getDate()) / 7);
      return `Semana ${weekNum} - ${months[now.getMonth()]} ${now.getFullYear()}`;
    } else if (activeTab === 'monthly') {
      return `${months[now.getMonth()]} ${now.getFullYear()}`;
    } else {
      return `${now.getFullYear()}`;
    }
  };

  const handleSaveSnapshot = async () => {
    if (allStreamers.length === 0) {
      toast.error('Não há streamers para salvar');
      return;
    }

    setIsSaving(true);
    await createSnapshot(activeTab, getPeriodLabel(), allStreamers);
    setIsSaving(false);
  };

  const isLoading = streamersLoading || snapshotsLoading;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-bloom">Dashboard</h1>
            <p className="text-muted-foreground">
              Visão geral do desempenho financeiro
            </p>
          </div>
        </div>

        {/* Period Selector */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'weekly' | 'monthly' | 'yearly')}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="weekly">Controle Semanal</TabsTrigger>
              <TabsTrigger value="monthly">Fechamento Mensal</TabsTrigger>
              <TabsTrigger value="yearly">Visão Anual</TabsTrigger>
            </TabsList>
            <Button onClick={handleSaveSnapshot} disabled={isSaving} className="gradient-primary">
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Salvando...' : `Salvar ${activeTab === 'weekly' ? 'Semana' : activeTab === 'monthly' ? 'Mês' : 'Ano'}`}
            </Button>
          </div>

          <TabsContent value={activeTab} className="mt-6 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="glass card-hover">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Cristais Totais
                  </CardTitle>
                  <Gem className="h-5 w-5 text-secondary" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatNumber(totalCrystals)}</p>
                </CardContent>
              </Card>

              <Card className="glass card-hover">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Receita Total (Host)
                  </CardTitle>
                  <DollarSign className="h-5 w-5 text-success" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-success">{formatCurrency(totalHostUsd)}</p>
                </CardContent>
              </Card>

              <Card className="glass card-hover">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Lucro Agência
                  </CardTitle>
                  <TrendingUp className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(totalAgencyUsd)}</p>
                </CardContent>
              </Card>

              <Card className="glass card-hover">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Margem
                  </CardTitle>
                  <Percent className="h-5 w-5 text-warning" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{marginPercent.toFixed(1)}%</p>
                </CardContent>
              </Card>
            </div>

            {/* Second Row Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="glass card-hover">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Top Streamer
                  </CardTitle>
                  <Crown className="h-5 w-5 text-warning" />
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold truncate">{topStreamer?.name || '-'}</p>
                  <p className="text-sm text-muted-foreground">
                    {topStreamer ? formatNumber(topStreamer.host_crystals) + ' cristais' : ''}
                  </p>
                </CardContent>
              </Card>

              <Card className="glass card-hover">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Maior Custo
                  </CardTitle>
                  <DollarSign className="h-5 w-5 text-destructive" />
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold text-destructive">{formatCurrency(highestCost)}</p>
                  <p className="text-sm text-muted-foreground">{topStreamer?.name || '-'}</p>
                </CardContent>
              </Card>

              <Card className="glass card-hover">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Crescimento
                  </CardTitle>
                  <TrendingUp className={`h-5 w-5 ${growth >= 0 ? 'text-success' : 'text-destructive'}`} />
                </CardHeader>
                <CardContent>
                  <p className={`text-xl font-bold ${growth >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground">vs período anterior</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Streamers Bar Chart */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Ranking de Streamers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={top10Streamers} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                        <YAxis dataKey="name" type="category" width={100} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                          formatter={(value: number) => formatNumber(value)}
                        />
                        <Bar dataKey="crystals" fill="hsl(330, 100%, 59%)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Distribution Pie Chart */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-success" />
                    Distribuição de Receita
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                        >
                          {pieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                          formatter={(value: number) => formatCurrency(value)}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
