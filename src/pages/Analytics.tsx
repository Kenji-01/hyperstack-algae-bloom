import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Calendar, Download, RotateCcw, Eye, Trash2 } from 'lucide-react';
import { TopBar } from '@/components/TopBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useDeviceStore } from '@/lib/store';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export default function Analytics() {
  const { growthRate, energyUsage, co2Levels, capturedFrames } = useDeviceStore();
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d'>('14d');
  const [exportLoading, setExportLoading] = useState(false);
  const [recomputeLoading, setRecomputeLoading] = useState(false);
  const { toast } = useToast();

  // Generate mock historical data based on time range
  const generateHistoricalData = (days: number) => {
    return Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      growth: Math.random() * 20 + 60,
      energy: Math.random() * 2 + 3,
      co2: Math.random() * 1 + 1.5,
      coverage: Math.random() * 30 + 40
    }));
  };

  const timeRangeMap = { '7d': 7, '14d': 14, '30d': 30 };
  const chartData = generateHistoricalData(timeRangeMap[timeRange]);

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const response = await api.exportData(timeRange);
      if (response.success) {
        // Simulate file download
        const blob = new Blob(['CSV data would be here'], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.data.filename;
        a.click();
        URL.revokeObjectURL(url);
        
        toast({
          title: 'Export Complete',
          description: `Downloaded ${response.data.records} records`,
        });
      }
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Unable to export data',
        variant: 'destructive',
      });
    } finally {
      setExportLoading(false);
    }
  };

  const handleRecompute = async () => {
    setRecomputeLoading(true);
    try {
      const response = await api.recomputeMetrics();
      if (response.success) {
        toast({
          title: 'Metrics Updated',
          description: response.message,
        });
      }
    } catch (error) {
      toast({
        title: 'Recompute Failed',
        description: 'Unable to recompute metrics',
        variant: 'destructive',
      });
    } finally {
      setRecomputeLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive system performance and growth analysis</p>
        </div>

        {/* Growth Over Time */}
        <Card className="hyperstack-card hyperstack-card-glow mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Growth Over Time</CardTitle>
              <div className="flex items-center gap-2">
                {(['7d', '14d', '30d'] as const).map((range) => (
                  <Button
                    key={range}
                    variant={timeRange === range ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeRange(range)}
                  >
                    {range}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="growth" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Growth Rate"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="coverage" 
                    stroke="hsl(174 72% 56%)" 
                    strokeWidth={2}
                    name="Coverage %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Energy & CO₂ Panel */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <Card className="hyperstack-card hyperstack-card-glow">
            <CardHeader>
              <CardTitle>Energy & CO₂ Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-secondary rounded-lg">
                  <div className="text-2xl font-bold text-primary">{energyUsage.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">kWh/day</div>
                </div>
                <div className="text-center p-4 bg-secondary rounded-lg">
                  <div className="text-2xl font-bold text-primary">{co2Levels.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">kg CO₂/day</div>
                </div>
              </div>
              
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="energy"
                      stackId="1"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                      name="Energy (kWh)"
                    />
                    <Area
                      type="monotone"
                      dataKey="co2"
                      stackId="2"
                      stroke="hsl(174 72% 56%)"
                      fill="hsl(174 72% 56%)"
                      fillOpacity={0.3}
                      name="CO₂ (kg)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex gap-2 mt-4">
                <Button 
                  onClick={handleExport}
                  disabled={exportLoading}
                  variant="outline"
                  className="flex-1"
                >
                  {exportLoading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Export CSV
                </Button>
                
                <Button 
                  onClick={handleRecompute}
                  disabled={recomputeLoading}
                  variant="outline"
                  className="flex-1"
                >
                  {recomputeLoading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <RotateCcw className="w-4 h-4 mr-2" />
                  )}
                  Recompute
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI Segmentation History */}
          <Card className="hyperstack-card hyperstack-card-glow">
            <CardHeader>
              <CardTitle>AI Segmentation History</CardTitle>
            </CardHeader>
            <CardContent>
              {capturedFrames.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No captured frames yet</p>
                  <p className="text-sm">Use the camera on the dashboard to capture frames</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {capturedFrames.map((frame) => (
                    <div 
                      key={frame.id}
                      className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={frame.imageData} 
                          alt="Captured frame"
                          className="w-12 h-12 rounded object-cover bg-black"
                        />
                        <div>
                          <div className="text-sm font-medium">
                            Coverage: {frame.coverage.toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {frame.timestamp.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {frame.coverage > 70 ? 'High' : frame.coverage > 40 ? 'Medium' : 'Low'}
                        </Badge>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Frame Analysis</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <img 
                                src={frame.imageData} 
                                alt="Full frame"
                                className="w-full rounded-lg bg-black"
                              />
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <strong>Coverage:</strong> {frame.coverage.toFixed(2)}%
                                </div>
                                <div>
                                  <strong>Timestamp:</strong> {frame.timestamp.toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}