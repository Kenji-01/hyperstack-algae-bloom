
import { Droplets, Activity, Settings, Home } from 'lucide-react';

export const Header = () => {
  return (
    <header className="bg-slate-900/80 backdrop-blur-sm border-b border-emerald-500/20 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">HyperStack AI</h1>
              <p className="text-sm text-emerald-300">Algae Monitoring System</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#" className="flex items-center space-x-2 text-emerald-300 hover:text-white transition-colors">
              <Home className="w-4 h-4" />
              <span>Dashboard</span>
            </a>
            <a href="#" className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors">
              <Activity className="w-4 h-4" />
              <span>Analytics</span>
            </a>
            <a href="#" className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </a>
          </nav>
          
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-sm text-emerald-300">Live</span>
          </div>
        </div>
      </div>
    </header>
  );
};
