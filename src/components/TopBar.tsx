import { Link, useLocation } from 'react-router-dom';
import { Activity, User } from 'lucide-react';
import { cn } from '../utils';

export const TopBar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/analytics', label: 'Analytics' },
    { path: '/settings', label: 'Settings' },
  ];

  return (
    <header className="w-full bg-card border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary rounded-xl">
              <Activity className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">HyperStack AI</h1>
              <p className="text-xs text-muted-foreground">Duckweed Management System</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'hyperstack-nav-link',
                  location.pathname === item.path && 'hyperstack-nav-link-active'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Status & User */}
          <div className="flex items-center space-x-4">
            <div className="live-indicator">
              <div className="live-dot"></div>
              <span>Live</span>
            </div>
            <div className="p-2 bg-secondary rounded-full">
              <User className="w-5 h-5 text-secondary-foreground" />
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden mt-4 flex items-center space-x-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'hyperstack-nav-link text-sm',
                location.pathname === item.path && 'hyperstack-nav-link-active'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
};