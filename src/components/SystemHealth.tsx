import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDeviceStore } from '../store';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export const SystemHealth = () => {
  const { systemHealth, recommendations, computeSystemHealth } = useDeviceStore();
  const [scanning, setScanning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    computeSystemHealth();
  }, [computeSystemHealth]);

  const handleQuickScan = async () => {
    setScanning(true);
    try {
      const response = await api.runQuickScan();
      if (response.success) {
        computeSystemHealth();
        toast({
          title: 'Quick Scan Complete',
          description: response.message,
        });
      }
    } catch (error) {
      toast({
        title: 'Scan Failed',
        description: 'Unable to complete system scan',
        variant: 'destructive',
      });
    } finally {
      setScanning(false);
    }
  };

  const getHealthIcon = () => {
    switch (systemHealth) {
      case 'good':
        return <CheckCircle className="w-16 h-16 text-green-400" />;
      case 'warning':
        return <AlertCircle className="w-16 h-16 text-yellow-400" />;
      case 'critical':
        return <AlertCircle className="w-16 h-16 text-red-400" />;
    }
  };

  const getHealthText = () => {
    switch (systemHealth) {
      case 'good':
        return 'All Systems Nominal';
      case 'warning':
        return 'Minor Issues Detected';
      case 'critical':
        return 'Critical Issues Found';
    }
  };

  const getHealthBadge = () => {
    const variants = {
      good: 'default',
      warning: 'secondary',
      critical: 'destructive'
    } as const;

    return (
      <Badge variant={variants[systemHealth]} className="capitalize">
        {systemHealth}
      </Badge>
    );
  };

  return (
    <Card className="hyperstack-card hyperstack-card-glow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          System Status
          {getHealthBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Health Indicator */}
        <div className="flex flex-col items-center text-center space-y-3">
          {getHealthIcon()}
          <div>
            <h3 className="font-semibold text-lg">{getHealthText()}</h3>
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Quick Scan Button */}
        <Button 
          onClick={handleQuickScan} 
          disabled={scanning}
          className="w-full"
          variant="outline"
        >
          {scanning ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              Scanning...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Quick Scan
            </>
          )}
        </Button>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">Recommendations</h4>
            <div className="space-y-1">
              {recommendations.map((rec, index) => (
                <div key={index} className="text-xs p-2 bg-secondary rounded border-l-2 border-yellow-400">
                  {rec}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};