
import { Power, Settings, RefreshCw, AlertTriangle, Zap, Droplet } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ControlPanelProps {
  pumpStatus: boolean;
  valveStatus: boolean;
  lightStatus: boolean;
  onTogglePump: () => void;
  onToggleValve: () => void;
  onToggleLight: () => void;
  data: {
    pH: number;
    growthRate: number;
    waterFlow: string;
    temperature: number;
    oxygenLevel: number;
  };
}

export const ControlPanel = ({ pumpStatus, valveStatus, lightStatus, onTogglePump, onToggleValve, onToggleLight, data }: ControlPanelProps) => {
  const getSystemHealth = () => {
    const issues = [];
    if (data.pH < 6.5 || data.pH > 8.0) issues.push('pH out of range');
    if (data.growthRate < 5) issues.push('Low growth rate');
    if (data.waterFlow !== 'Good') issues.push('Water flow issues');
    if (data.oxygenLevel < 75) issues.push('Low oxygen');
    
    return {
      status: issues.length === 0 ? 'healthy' : issues.length < 3 ? 'warning' : 'critical',
      issues
    };
  };

  const health = getSystemHealth();

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Manual Controls */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-emerald-500/20">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Manual Controls
        </h3>
        
        <div className="space-y-6">
          {/* Pump Control */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700/50 border border-slate-600/50">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${pumpStatus ? 'bg-emerald-500' : 'bg-red-500'}`}>
                <Power className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-medium text-white">Water Pump</p>
                <p className="text-sm text-slate-400">
                  {pumpStatus ? 'Currently running' : 'Currently stopped'}
                </p>
              </div>
            </div>
            <Button
              onClick={onTogglePump}
              className={`${
                pumpStatus 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-emerald-500 hover:bg-emerald-600'
              } text-white font-medium px-6`}
            >
              {pumpStatus ? 'STOP' : 'START'}
            </Button>
          </div>

          {/* Valve Control */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700/50 border border-slate-600/50">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${valveStatus ? 'bg-blue-500' : 'bg-gray-500'}`}>
                <Droplet className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-medium text-white">Water Valve</p>
                <p className="text-sm text-slate-400">
                  {valveStatus ? 'Currently open' : 'Currently closed'}
                </p>
              </div>
            </div>
            <Button
              onClick={onToggleValve}
              className={`${
                valveStatus 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white font-medium px-6`}
            >
              {valveStatus ? 'CLOSE' : 'OPEN'}
            </Button>
          </div>

          {/* Light Control */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700/50 border border-slate-600/50">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${lightStatus ? 'bg-yellow-500' : 'bg-gray-500'}`}>
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-medium text-white">Growth Light</p>
                <p className="text-sm text-slate-400">
                  {lightStatus ? 'Currently on' : 'Currently off'}
                </p>
              </div>
            </div>
            <Button
              onClick={onToggleLight}
              className={`${
                lightStatus 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-yellow-500 hover:bg-yellow-600'
              } text-white font-medium px-6`}
            >
              {lightStatus ? 'TURN OFF' : 'TURN ON'}
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="bg-slate-700/50 border-slate-600/50 text-white hover:bg-slate-600/50 h-12"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
            <Button 
              variant="outline" 
              className="bg-slate-700/50 border-slate-600/50 text-white hover:bg-slate-600/50 h-12"
            >
              <Settings className="w-4 h-4 mr-2" />
              Calibrate
            </Button>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-emerald-500/20">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          System Health
        </h3>
        
        <div className="space-y-4">
          {/* Health Status */}
          <div className={`p-4 rounded-lg border ${
            health.status === 'healthy' 
              ? 'bg-emerald-500/10 border-emerald-500/30' 
              : health.status === 'warning'
              ? 'bg-yellow-500/10 border-yellow-500/30'
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-medium text-white">Overall Status</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                health.status === 'healthy' 
                  ? 'bg-emerald-500/20 text-emerald-300' 
                  : health.status === 'warning'
                  ? 'bg-yellow-500/20 text-yellow-300'
                  : 'bg-red-500/20 text-red-300'
              }`}>
                {health.status === 'healthy' ? '✅ Optimal' : 
                 health.status === 'warning' ? '⚠️ Attention' : '🚨 Critical'}
              </span>
            </div>
          </div>

          {/* Issues List */}
          {health.issues.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-300">Active Issues:</p>
              {health.issues.map((issue, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm text-red-300">
                  <div className="w-1 h-1 rounded-full bg-red-400" />
                  <span>{issue}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="text-4xl mb-2">🌟</div>
              <p className="text-emerald-300 font-medium">All systems operating normally!</p>
              <p className="text-sm text-slate-400 mt-1">Your algae is thriving</p>
            </div>
          )}

          {/* Recommendations */}
          <div className="mt-6 p-4 rounded-lg bg-slate-700/30 border border-slate-600/30">
            <p className="text-sm font-medium text-slate-300 mb-2">💡 Recommendations:</p>
            <ul className="text-xs text-slate-400 space-y-1">
              {data.growthRate > 15 && <li>• Consider harvesting soon - growth rate is optimal</li>}
              {data.pH < 7.0 && <li>• Monitor pH levels - consider alkaline adjustment</li>}
              {data.pH > 7.5 && <li>• pH slightly high - monitor for stability</li>}
              {!pumpStatus && <li>• Water circulation stopped - consider restarting pump</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
