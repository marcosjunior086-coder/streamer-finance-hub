import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStreamers } from '@/hooks/useStreamers';
import { useSnapshots } from '@/hooks/useSnapshots';
import { formatNumber, formatCurrency, formatMinutesToHours } from '@/types/streamer';
import {
  getRealtimeStats,
  aggregateSnapshots,
  getAvailableMonths,
  getAvailableYears,
  filterSnapshotsByMonth,
  filterSnapshotsByYear,
  getMonthlyGrowthData,
  DashboardStats
} from '@/lib/dashboard-utils';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
  Clock,
  AlertCircle
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

const COLORS = ['hsl(330, 100%, 59%)', 'hsl(262, 76%, 57%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(200, 80%, 50%)'];

type ViewType = 'weekly' | 'monthly' | 'yearly';
type RankingType = 'luck_gifts' | 'exclusive_gifts' | 'host_crystals';
type CrystalsType = 'luck_gifts' | 'exclusive_gifts' | 'host_crystals';

export default function Dashboard() {
  const { allStreamers, isLoading: streamersLoading } = useStreamers();
  const { snapshots, isLoading: snapshotsLoading } = useSnapshots();
  const [activeView, setActiveView] = useState<ViewType>('weekly');
  const [rankingType, setRankingType] = useState<RankingType>('host_crystals');
  const [crystalsType, setCrystalsType] = useState<CrystalsType>('host_crystals');

  // Month/Year selectors
  const availableMonths = useMemo(() => getAvailableMonths(snapshots), [snapshots]);
  const availableYears = useMemo(() => getAvailableYears(snapshots), [snapshots]);
  
  const [selectedMonth, setSelectedMonth] = useState<string>(() => 
    availableMonths[0]?.value || ''
  );
  const [selectedYear, setSelectedYear] = useState<string>(() => 
    availableYears[0]?.value || String(new Date().getFullYear())
  );

  // Get stats based on view
  const stats: DashboardStats = useMemo(() => {
    if (activeView === 'weekly') {
      // Real-time data from current streamers
      return getRealtimeStats(allStreamers);
    } else if (activeView === 'monthly') {
      // Aggregated from closed snapshots for selected month
      const monthSnapshots = filterSnapshotsByMonth(snapshots, selectedMonth);
      return aggregateSnapshots(monthSnapshots);
    } else {
      // Aggregated from closed snapshots for selected year
      const yearSnapshots = filterSnapshotsByYear(snapshots, selectedYear);
      return aggregateSnapshots(yearSnapshots);
    }
  }, [activeView, allStreamers, snapshots, selectedMonth, selectedYear]);

  // Get display values based on crystals type
  const getCrystalsTotal = () => {
    switch (crystalsType) {
      case 'luck_gifts':
        return stats.totalLuckGifts;
      case 'exclusive_gifts':
        return stats.totalExclusiveGifts;
      case 'host_crystals':
      default:
        return stats.totalCrystals;
    }
  };

  const getCrystalsLabel = () => {
    switch (crystalsType) {
      case 'luck_gifts':
        return 'Presente da Sorte';
      case 'exclusive_gifts':
        return 'Exclusivos';
      case 'host_crystals':
      default:
        return 'Cristais Host';
    }
  };

  const marginPercent = stats.totalHostUsd > 0 ? (stats.totalAgencyUsd / stats.totalHostUsd) * 100 : 0;

  // Top streamer by revenue
  const topStreamer = stats.streamers.length > 0 
    ? stats.streamers.reduce((max, s) => s.host_usd > max.host_usd ? s : max, stats.streamers[0])
    : null;

  // Ranking label
  const getRankingLabel = () => {
    switch (rankingType) {
      case 'luck_gifts':
        return 'Presente da Sorte';
      case 'exclusive_gifts':
        return 'Exclusivo';
      case 'host_crystals':
      default:
        return 'Cristais';
    }
  };

  // Top 10 streamers for chart
  const top10Streamers = [...stats.streamers]
    .sort((a, b) => b[rankingType] - a[rankingType])
    .slice(0, 10)
    .map(s => ({
      name: s.name.substring(0, 15),
      value: s[rankingType],
      hostUsd: s.host_usd,
      agencyUsd: s.agency_usd
    }));

  // Pie chart data
  const pieData = [
    { name: 'Host', value: stats.totalHostUsd },
    { name: 'Agência', value: stats.totalAgencyUsd }
  ];

  // Monthly growth for yearly view
  const monthlyGrowth = useMemo(() => 
    activeView === 'yearly' ? getMonthlyGrowthData(snapshots, selectedYear) : [],
  [activeView, snapshots, selectedYear]);

  // Get period label for display
  const getPeriodLabel = () => {
    const now = new Date();
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    if (activeView === 'weekly') {
      const weekNum = Math.ceil(now.getDate() / 7);
      return `Semana ${weekNum} de ${months[now.getMonth()]}`;
    } else if (activeView === 'monthly') {
      const month = availableMonths.find(m => m.value === selectedMonth);
      return month?.label || 'Selecione um mês';
    } else {
      return `Ano ${selectedYear}`;
    }
  };

  // Check if we have data for selected period
  const hasData = activeView === 'weekly' 
    ? allStreamers.length > 0 
    : stats.streamers.length > 0;

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

        {/* View Selector */}
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as ViewType)}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="weekly" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Controle Semanal
              </TabsTrigger>
              <TabsTrigger value="monthly" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Fechamento Mensal
              </TabsTrigger>
              <TabsTrigger value="yearly" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Visão Anual
              </TabsTrigger>
            </TabsList>

            {/* Period Selector */}
            {activeView === 'monthly' && (
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  {availableMonths.length === 0 ? (
                    <SelectItem value="none" disabled>Nenhum histórico</SelectItem>
                  ) : (
                    availableMonths.map(month => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}

            {activeView === 'yearly' && (
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.length === 0 ? (
                    <SelectItem value="none" disabled>Nenhum histórico</SelectItem>
                  ) : (
                    availableYears.map(year => (
                      <SelectItem key={year.value} value={year.value}>
                        {year.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Info banner for each view */}
          <div className="mt-4">
            {activeView === 'weekly' && (
              <Card className="border-blue-500/20 bg-blue-500/5">
                <CardContent className="py-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Tempo Real:</span>
                    <span className="text-muted-foreground">
                      Exibindo dados atuais da área de Streamers — {getPeriodLabel()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeView === 'monthly' && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="py-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="font-medium">Fechamento Mensal:</span>
                    <span className="text-muted-foreground">
                      Consolidado de históricos fechados para {getPeriodLabel()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeView === 'yearly' && (
              <Card className="border-secondary/20 bg-secondary/5">
                <CardContent className="py-3">
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-secondary" />
                    <span className="font-medium">Visão Anual:</span>
                    <span className="text-muted-foreground">
                      Consolidado de todos os históricos de {selectedYear}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <TabsContent value={activeView} className="mt-6 space-y-6">
            {!hasData && activeView !== 'weekly' ? (
              <Card className="glass">
                <CardContent className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg">Nenhum histórico encontrado</p>
                  <p className="text-sm">
                    {activeView === 'monthly' 
                      ? 'Crie históricos na área de Histórico para ver o fechamento mensal'
                      : 'Crie históricos na área de Histórico para ver a visão anual'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="glass card-hover">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <div className="flex flex-col gap-1">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Cristais Totais
                        </CardTitle>
                        <Select value={crystalsType} onValueChange={(v) => setCrystalsType(v as CrystalsType)}>
                          <SelectTrigger className="h-7 w-[140px] text-xs">
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="luck_gifts">Presente da Sorte</SelectItem>
                            <SelectItem value="exclusive_gifts">Exclusivos</SelectItem>
                            <SelectItem value="host_crystals">Cristais Host</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Gem className="h-5 w-5 text-secondary" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{formatNumber(getCrystalsTotal())}</p>
                      <p className="text-xs text-muted-foreground">{getCrystalsLabel()}</p>
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
                      <p className="text-2xl font-bold text-success">{formatCurrency(stats.totalHostUsd)}</p>
                    </CardContent>
                  </Card>

                  <Card className="glass card-hover">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Receita Agência
                      </CardTitle>
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-primary">{formatCurrency(stats.totalAgencyUsd)}</p>
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
                        {topStreamer ? formatCurrency(topStreamer.host_usd) + ' USD' : ''}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="glass card-hover">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Maior Receita
                      </CardTitle>
                      <DollarSign className="h-5 w-5 text-success" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-xl font-bold text-success">{formatCurrency(topStreamer?.host_usd || 0)}</p>
                      <p className="text-sm text-muted-foreground">{topStreamer?.name || '-'}</p>
                    </CardContent>
                  </Card>

                  <Card className="glass card-hover">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Streamers
                      </CardTitle>
                      <Users className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-xl font-bold">{stats.streamerCount}</p>
                      <p className="text-sm text-muted-foreground">
                        {activeView === 'weekly' ? 'Ativos' : 'No período'}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Streamers Bar Chart */}
                  <Card className="glass">
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-primary" />
                          Ranking de Streamers
                        </CardTitle>
                        <Select value={rankingType} onValueChange={(v) => setRankingType(v as RankingType)}>
                          <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Ranking por" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="luck_gifts">Presente da Sorte</SelectItem>
                            <SelectItem value="exclusive_gifts">Exclusivo</SelectItem>
                            <SelectItem value="host_crystals">Cristais</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
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
                              formatter={(value: number) => [formatNumber(value), getRankingLabel()]}
                            />
                            <Bar dataKey="value" fill="hsl(330, 100%, 59%)" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Revenue Distribution Pie Chart OR Monthly Growth Line Chart */}
                  {activeView === 'yearly' ? (
                    <Card className="glass">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-success" />
                          Crescimento Mensal
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={monthlyGrowth}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                              <YAxis stroke="hsl(var(--muted-foreground))" />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: 'hsl(var(--card))', 
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px'
                                }}
                                formatter={(value: number) => formatCurrency(value)}
                              />
                              <Legend />
                              <Line 
                                type="monotone" 
                                dataKey="revenue" 
                                name="Host" 
                                stroke="hsl(142, 76%, 36%)" 
                                strokeWidth={2}
                                dot={{ fill: 'hsl(142, 76%, 36%)' }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="agency" 
                                name="Agência" 
                                stroke="hsl(330, 100%, 59%)" 
                                strokeWidth={2}
                                dot={{ fill: 'hsl(330, 100%, 59%)' }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
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
                  )}
                </div>

                {/* Detailed Streamers Table for Monthly/Yearly */}
                {(activeView === 'monthly' || activeView === 'yearly') && stats.streamers.length > 0 && (
                  <Card className="glass">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Detalhamento por Streamer
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px]">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/30">
                              <TableHead>#</TableHead>
                              <TableHead>Nome</TableHead>
                              <TableHead className="text-right">Sorte</TableHead>
                              <TableHead className="text-right">Exclusivo</TableHead>
                              <TableHead className="text-right">Cristais</TableHead>
                              <TableHead className="text-right">Host $</TableHead>
                              <TableHead className="text-right">Agência $</TableHead>
                              <TableHead className="text-right">Tempo</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {[...stats.streamers]
                              .sort((a, b) => b.host_usd - a.host_usd)
                              .map((streamer, index) => (
                                <TableRow key={streamer.streamer_id}>
                                  <TableCell className="font-medium text-primary">
                                    {index < 3 ? '🏆' : ''} {index + 1}
                                  </TableCell>
                                  <TableCell className="font-medium">{streamer.name}</TableCell>
                                  <TableCell className="text-right">{formatNumber(streamer.luck_gifts)}</TableCell>
                                  <TableCell className="text-right">{formatNumber(streamer.exclusive_gifts)}</TableCell>
                                  <TableCell className="text-right font-medium text-secondary">
                                    {formatNumber(streamer.host_crystals)}
                                  </TableCell>
                                  <TableCell className="text-right text-success">{formatCurrency(streamer.host_usd)}</TableCell>
                                  <TableCell className="text-right text-primary">{formatCurrency(streamer.agency_usd)}</TableCell>
                                  <TableCell className="text-right font-mono">{formatMinutesToHours(streamer.minutes)}</TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
