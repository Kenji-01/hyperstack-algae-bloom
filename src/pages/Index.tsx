
import { useState, useEffect } from 'react';
import { AlgaeAnimation } from '../components/AlgaeAnimation';
import { StatsGrid } from '../components/StatsGrid';
import { ControlPanel } from '../components/ControlPanel';
import { Header } from '../components/Header';
import { GrowthChart } from '../components/GrowthChart';

type AlgaeMood = 'bad' | 'neutral' | 'happy';

const Index = () => {
  const [systemData, setSystemData] = useState({
    pH: 7.2,
    growthRate: 12.5,
    waterFlow: 'Good',
    pumpStatus: true,
    valveStatus: true,
    lightStatus: true,
    algaeMood: 'happy' as AlgaeMood,
    temperature: 24.5,
    oxygenLevel: 85,
    lastHarvest: '2 days ago'
  });

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemData(prev => {
        const newPH = Math.max(6.5, Math.min(8.5, prev.pH + (Math.random() - 0.5) * 0.1));
        const newGrowthRate = Math.max(0, Math.min(20, prev.growthRate + (Math.random() - 0.5) * 2));
        const newOxygenLevel = Math.max(70, Math.min(100, prev.oxygenLevel + (Math.random() - 0.5) * 5));
        const newTemperature = Math.max(20, Math.min(30, prev.temperature + (Math.random() - 0.5) * 0.5));
        
        let newAlgaeMood: AlgaeMood = 'neutral';
        if (newPH < 6.8 || newGrowthRate < 5) {
          newAlgaeMood = 'bad';
        } else if (newPH > 7.8 && newGrowthRate > 15) {
          newAlgaeMood = 'happy';
        }

        return {
          ...prev,
          pH: newPH,
          growthRate: newGrowthRate,
          oxygenLevel: newOxygenLevel,
          temperature: newTemperature,
          algaeMood: newAlgaeMood
        };
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const togglePump = () => {
    setSystemData(prev => ({
      ...prev,
      pumpStatus: !prev.pumpStatus
    }));
  };

  const toggleValve = () => {
    setSystemData(prev => ({
      ...prev,
      valveStatus: !prev.valveStatus
    }));
  };

  const toggleLight = () => {
    setSystemData(prev => ({
      ...prev,
      lightStatus: !prev.lightStatus
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        {/* Hero Section with Algae Animation */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-emerald-500/20">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">System Status</h2>
            <AlgaeAnimation mood={systemData.algaeMood} />
            <div className="text-center mt-6">
              <div className="inline-flex px-4 py-2 rounded-full text-sm font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {systemData.algaeMood === 'happy' && '🌟 Ready for Harvest!'}
                {systemData.algaeMood === 'neutral' && '⚖️ Stable Growth'}
                {systemData.algaeMood === 'bad' && '⚠️ Needs Attention'}
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-emerald-500/20">
            <h2 className="text-2xl font-bold text-white mb-6">Growth Analytics</h2>
            <GrowthChart growthRate={systemData.growthRate} />
          </div>
        </div>

        {/* Stats Grid */}
        <StatsGrid data={systemData} />

        {/* Control Panel */}
        <ControlPanel 
          pumpStatus={systemData.pumpStatus}
          valveStatus={systemData.valveStatus}
          lightStatus={systemData.lightStatus}
          onTogglePump={togglePump}
          onToggleValve={toggleValve}
          onToggleLight={toggleLight}
          data={systemData}
        />
      </main>
    </div>
  );
};

export default Index;
