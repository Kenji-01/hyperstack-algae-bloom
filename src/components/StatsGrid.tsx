import { Gauge, TrendingUp, Droplets, Power, Thermometer, Wind, Leaf, TreePine } from 'lucide-react';

interface StatsGridProps {
  data: {
    pH: number;
    growthRate: number;
    waterFlow: string;
    pumpStatus: boolean;
    temperature: number;
    oxygenLevel: number;
    lastHarvest: string;
  };
}

export const StatsGrid = ({ data }: StatsGridProps) => {
  const StatCard = ({ 
    title, 
    value, 
    unit, 
    icon: Icon, 
    color, 
    status 
  }: {
    title: string;
    value: string | number;
    unit?: string;
    icon: any;
    color: string;
    status?: 'good' | 'warning' | 'danger';
  }) => {
    const statusColors = {
      good: 'border-emerald-500/30 bg-emerald-500/10',
      warning: 'border-yellow-500/30 bg-yellow-500/10',
      danger: 'border-red-500/30 bg-red-500/10'
    };

    return (
      <div className={`p-6 rounded-xl border backdrop-blur-sm ${statusColors[status || 'good']} bg-slate-800/50`}>
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          {status === 'danger' && <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />}
          {status === 'warning' && <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />}
        </div>
        <div className="space-y-1">
          <p className="text-sm text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-white">
            {value}{unit && <span className="text-lg text-slate-300">{unit}</span>}
          </p>
        </div>
      </div>
    );
  };

  const getpHStatus = (pH: number) => {
    if (pH < 6.5 || pH > 8.0) return 'danger';
    if (pH < 6.8 || pH > 7.8) return 'warning';
    return 'good';
  };

  const getGrowthStatus = (rate: number) => {
    if (rate < 5) return 'danger';
    if (rate < 10) return 'warning';
    return 'good';
  };

  // Calculate carbon metrics based on system data
  const calculateCarbonRelease = () => {
    // Very low carbon release - highly optimized algae farming system
    const baseCarbonRelease = 2.0; // kg CO2/day baseline
    const pumpEffect = data.pumpStatus ? 0.2 : 0; // Pump adds minimal carbon
    const temperatureEffect = Math.max(0, (data.temperature - 25) * 0.05); // Higher temp = slightly more energy
    return Math.max(2.0, Math.min(3.0, baseCarbonRelease + pumpEffect + temperatureEffect));
  };

  const calculateCarbonConsumption = () => {
    // Fixed algae carbon consumption around 3 kg CO2/day
    const baseConsumption = 3.0; // kg CO2/day baseline consumption
    const growthMultiplier = Math.max(0.95, Math.min(1.05, data.growthRate / 12)); // Small variation based on growth
    const pHEfficiency = data.pH >= 7.0 && data.pH <= 7.5 ? 1.02 : 0.98; // Minimal pH effect
    return Math.max(2.8, Math.min(3.2, baseConsumption * growthMultiplier * pHEfficiency));
  };

  const carbonRelease = calculateCarbonRelease();
  const carbonConsumption = calculateCarbonConsumption();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
      <StatCard
        title="pH Level"
        value={data.pH.toFixed(1)}
        icon={Gauge}
        color="bg-blue-500"
        status={getpHStatus(data.pH)}
      />
      
      <StatCard
        title="Growth Rate"
        value={data.growthRate.toFixed(1)}
        unit="%"
        icon={TrendingUp}
        color="bg-emerald-500"
        status={getGrowthStatus(data.growthRate)}
      />
      
      <StatCard
        title="Water Flow"
        value={data.waterFlow}
        icon={Droplets}
        color="bg-cyan-500"
        status={data.waterFlow === 'Good' ? 'good' : 'warning'}
      />
      
      <StatCard
        title="Pump Status"
        value={data.pumpStatus ? 'ON' : 'OFF'}
        icon={Power}
        color={data.pumpStatus ? 'bg-emerald-500' : 'bg-red-500'}
        status={data.pumpStatus ? 'good' : 'warning'}
      />
      
      <StatCard
        title="Temperature"
        value={data.temperature.toFixed(1)}
        unit="°C"
        icon={Thermometer}
        color="bg-orange-500"
        status="good"
      />
      
      <StatCard
        title="Oxygen Level"
        value={data.oxygenLevel.toFixed(0)}
        unit="%"
        icon={Wind}
        color="bg-indigo-500"
        status={data.oxygenLevel > 80 ? 'good' : 'warning'}
      />

      <StatCard
        title="Carbon Release"
        value={carbonRelease.toFixed(1)}
        unit=" kg CO₂/day"
        icon={TreePine}
        color="bg-red-500"
        status={carbonRelease < 3 ? 'good' : carbonRelease < 5 ? 'warning' : 'danger'}
      />

      <StatCard
        title="Carbon Consumed"
        value={carbonConsumption.toFixed(1)}
        unit=" kg CO₂/day"
        icon={Leaf}
        color="bg-green-600"
        status="good"
      />
      
      <div className="md:col-span-2 xl:col-span-4 p-6 rounded-xl border border-emerald-500/30 bg-slate-800/50 backdrop-blur-sm">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-purple-500">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Last Harvest</p>
              <p className="text-xl font-bold text-white">{data.lastHarvest}</p>
              <p className="text-sm text-slate-400">Next harvest estimated in <span className="text-emerald-300 font-medium">3-5 days</span></p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-emerald-600">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Net Carbon Impact</p>
              <p className="text-xl font-bold text-emerald-300">-{(carbonConsumption - carbonRelease).toFixed(1)} kg CO₂/day</p>
              <p className="text-sm text-slate-400">Carbon <span className="text-emerald-300 font-medium">negative</span> operation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
