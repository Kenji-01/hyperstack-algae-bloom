import { useEffect, useRef, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Thermometer, Droplets, Zap, Activity, Gauge, Camera, Wifi, FlaskRound } from 'lucide-react';
import { TopBar } from '@/components/TopBar';
import { MetricCard } from '@/components/MetricCard';
import { CameraSegmentation } from '@/components/CameraSegmentation';
import { ControlsPanel } from '@/components/ControlsPanel';
import { SystemHealth } from '@/components/SystemHealth';
import { AlgaeAnimation } from '@/components/AlgaeAnimation';
// (removed) import DuckweedSegClient from '@/components/DuckweedSegClient';
import { useDeviceStore } from '../store';

const STATUS_URL = "http://raspberrypi.local:8765/duckweed_status.json";

function Toast({ show, text }) {
  if (!show) return null;
  return (
    <div style={{
      position: "fixed",
      right: 16,
      bottom: 16,
      background: "rgba(0,0,0,0.9)",
      color: "white",
      padding: "10px 12px",
      borderRadius: 10,
      fontSize: 14,
      zIndex: 9999,
      boxShadow: "0 6px 20px rgba(0,0,0,.25)",
      pointerEvents: "none"
    }}>
      {text}
    </div>
  );
}

export default function Dashboard() {
  const { 
    waterTemp, 
    pH, 
    EC, 
    DO, 
    lightOn, 
    pumpOn, 
    valveOpen, 
    fanOn,
    connectivity,
    cameraEnabled,
    growthRate,
    energyUsage,
    co2Levels,
    systemHealth,
    updateMetric,
    computeSystemHealth
  } = useDeviceStore();

  // Use reactive selector for live duckweed coverage updates
  const duckweedCoverage = useDeviceStore(s => s.duckweedCoverage ?? 0);

  // Toast state for harvest alerts
  const [toastVisible, setToastVisible] = useState(false);
  const lastActionRef = useRef("");
  const [status, setStatus] = useState(null);

  // Poll status from backend
  useEffect(() => {
    const pollStatus = async () => {
      try {
        const res = await fetch(STATUS_URL, { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          setStatus(json);
        }
      } catch (error) {
        // Silently handle fetch errors
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  // Show toast on harvest alert
  useEffect(() => {
    if (!status) return;
    const action = status.action || "";
    if (action === "harvest_alert" && lastActionRef.current !== "harvest_alert") {
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 10000); // hide after 10s
    }
    lastActionRef.current = action;
  }, [status]);

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Add small random variations to simulate live data
      updateMetric('waterTemp', Math.max(20, Math.min(30, waterTemp + (Math.random() - 0.5) * 0.2)));
      updateMetric('pH', Math.max(6.0, Math.min(8.0, pH + (Math.random() - 0.5) * 0.05)));
      updateMetric('EC', Math.max(700, Math.min(1000, EC + (Math.random() - 0.5) * 10)));
      updateMetric('DO', Math.max(7.0, Math.min(10.0, DO + (Math.random() - 0.5) * 0.1)));
      updateMetric('energyUsage', Math.max(3.0, Math.min(6.0, energyUsage + (Math.random() - 0.5) * 0.1)));
      updateMetric('co2Levels', Math.max(1.5, Math.min(3.0, co2Levels + (Math.random() - 0.5) * 0.05)));
      
      // Update growth rate array
      const newGrowthData = [...growthRate];
      newGrowthData.push(Math.random() * 20 + 60);
      if (newGrowthData.length > 14) newGrowthData.shift();
      updateMetric('growthRate', newGrowthData);
      
      computeSystemHealth();
    }, 5000);

    return () => clearInterval(interval);
  }, [waterTemp, pH, EC, DO, energyUsage, co2Levels, growthRate, updateMetric, computeSystemHealth]);

  // Prepare chart data
  const chartData = growthRate.map((value, index) => ({
    day: index + 1,
    growth: value
  }));

  const getConnectivityStatus = () => {
    switch (connectivity) {
      case 'connected': return { icon: 'text-green-400', text: 'Connected' };
      case 'poor': return { icon: 'text-yellow-400', text: 'Poor Signal' };
      case 'disconnected': return { icon: 'text-red-400', text: 'Disconnected' };
    }
  };

  const connectivityStatus = getConnectivityStatus();

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      
      <main className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Left Column */}
          <div className="space-y-6">
            <SystemHealth />
            <CameraSegmentation />
            {/* DuckweedSegClient removed in favor of top camera */}
          </div>
          
          {/* Right Column - Growth Analytics */}
          <div className="hyperstack-card hyperstack-card-glow p-6">
            <h2 className="text-xl font-bold mb-4">Growth Analytics</h2>
            <div className="h-64 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="day" 
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
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {/* Duckweed Animation */}
            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Duckweed Status</h3>
              <AlgaeAnimation 
                mood={systemHealth === 'good' ? 'happy' : systemHealth === 'warning' ? 'neutral' : 'bad'} 
              />
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          <MetricCard
            title="Duckweed Coverage"
            value={duckweedCoverage.toFixed(1)}
            unit="%"
            icon={<Droplets className="w-4 h-4" />}
            status={duckweedCoverage >= 50 ? 'good' : duckweedCoverage >= 20 ? 'warning' : 'critical'}
          />
          
          <MetricCard
            title="pH Level"
            value={pH.toFixed(1)}
            icon={<FlaskRound className="w-4 h-4" />}
            status={pH >= 6.5 && pH <= 7.5 ? 'good' : 'warning'}
          />
          
          <MetricCard
            title="Water Temp"
            value={waterTemp.toFixed(1)}
            unit="°C"
            icon={<Thermometer className="w-4 h-4" />}
            status={waterTemp >= 20 && waterTemp <= 26 ? 'good' : 'warning'}
          />
          
          <MetricCard
            title="EC Level"
            value={EC}
            unit="μS/cm"
            icon={<Zap className="w-4 h-4" />}
            status={Math.abs(EC - 800) <= 100 ? 'good' : 'warning'}
          />
          
          <MetricCard
            title="Dissolved O₂"
            value={DO.toFixed(1)}
            unit="mg/L"
            icon={<Activity className="w-4 h-4" />}
            status={DO >= 7.5 ? 'good' : 'warning'}
          />
          
          <MetricCard
            title="Pump Status"
            value={pumpOn ? 'RUNNING' : 'STOPPED'}
            icon={<Gauge className="w-4 h-4" />}
            status={pumpOn ? 'good' : 'warning'}
          />
          
          <MetricCard
            title="Lights"
            value={lightOn ? 'ON' : 'OFF'}
            icon={<Zap className="w-4 h-4" />}
            status={lightOn ? 'good' : 'warning'}
          />
          
          <MetricCard
            title="Camera"
            value={cameraEnabled ? 'ACTIVE' : 'INACTIVE'}
            icon={<Camera className="w-4 h-4" />}
            status={cameraEnabled ? 'good' : 'warning'}
          />
          
          <MetricCard
            title="Connectivity"
            value={connectivityStatus.text}
            icon={<Wifi className={`w-4 h-4 ${connectivityStatus.icon}`} />}
            status={connectivity === 'connected' ? 'good' : connectivity === 'poor' ? 'warning' : 'critical'}
          />
        </div>

        {/* Control Panel */}
        <ControlsPanel />
      </main>

      <Toast show={toastVisible} text="Harvesting Alert — Valve cycle complete" />
    </div>
  );
}
