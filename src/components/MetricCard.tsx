import { ReactNode } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '../utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: ReactNode;
  subtitle?: string;
  status?: 'good' | 'warning' | 'critical';
  className?: string;
  children?: ReactNode;
}

export const MetricCard = ({
  title,
  value,
  unit,
  icon,
  subtitle,
  status = 'good',
  className,
  children
}: MetricCardProps) => {
  const statusColors = {
    good: 'text-green-400',
    warning: 'text-yellow-400',
    critical: 'text-red-400'
  };

  return (
    <Card className={cn('hyperstack-card hyperstack-card-glow', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex items-baseline space-x-2">
          <span className={cn('text-2xl font-bold', statusColors[status])}>
            {value}
          </span>
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {children}
      </CardContent>
    </Card>
  );
};