import { useState } from 'react';
import { Power, Lightbulb, Droplets, Fan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDeviceStore, DeviceState } from '@/lib/store';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export const ControlsPanel = () => {
  const { lightOn, pumpOn, valveOpen, fanOn, updateMetric } = useDeviceStore();
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleToggle = async (
    type: 'light' | 'pump' | 'valve' | 'fan',
    currentState: boolean,
    apiCall: (state: boolean) => Promise<any>
  ) => {
    setLoading(type);
    try {
      const response = await apiCall(!currentState);
      if (response.success) {
        const key = type === 'valve' ? 'valveOpen' : `${type}On` as keyof DeviceState;
        updateMetric(key, !currentState);
        toast({
          title: 'Success',
          description: response.message,
        });
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Operation failed',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const controls = [
    {
      id: 'pump',
      label: 'Water Pump',
      icon: Power,
      state: pumpOn,
      action: () => handleToggle('pump', pumpOn, api.setPump),
      activeColor: 'bg-blue-500',
      inactiveColor: 'bg-gray-500'
    },
    {
      id: 'light',
      label: 'Grow Lights',
      icon: Lightbulb,
      state: lightOn,
      action: () => handleToggle('light', lightOn, api.setLight),
      activeColor: 'bg-yellow-500',
      inactiveColor: 'bg-gray-500'
    },
    {
      id: 'valve',
      label: 'Water Valve',
      icon: Droplets,
      state: valveOpen,
      action: () => handleToggle('valve', valveOpen, api.setValve),
      activeColor: 'bg-cyan-500',
      inactiveColor: 'bg-gray-500'
    },
    {
      id: 'fan',
      label: 'Circulation Fan',
      icon: Fan,
      state: fanOn,
      action: () => handleToggle('fan', fanOn, api.setFan),
      activeColor: 'bg-green-500',
      inactiveColor: 'bg-gray-500'
    }
  ];

  return (
    <Card className="hyperstack-card hyperstack-card-glow">
      <CardHeader>
        <CardTitle>Manual Controls</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {controls.map((control) => {
            const IconComponent = control.icon;
            const isLoading = loading === control.id;

            return (
              <div
                key={control.id}
                className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${control.state ? control.activeColor : control.inactiveColor}`}>
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{control.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {control.state ? 'Currently on' : 'Currently off'}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={control.action}
                  disabled={isLoading}
                  size="sm"
                  variant={control.state ? 'destructive' : 'default'}
                  className="min-w-[80px]"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    control.state ? 'STOP' : 'START'
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};