import { useState } from 'react';
import { Cog, Smartphone, Brain, Gauge, User, Save, RotateCcw, TestTube2 } from 'lucide-react';
import { TopBar } from '@/components/TopBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useDeviceStore } from '@/lib/store';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { 
    thresholds, 
    settings, 
    aiMode,
    cameraEnabled,
    updateThreshold, 
    updateSetting, 
    updateMetric,
    resetToDefaults 
  } = useDeviceStore();
  
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  const handleSaveThresholds = async () => {
    setSaving(true);
    try {
      // Save all thresholds
      const promises = Object.entries(thresholds).map(([key, value]) =>
        api.updateThreshold(key, value)
      );
      
      const results = await Promise.all(promises);
      const successful = results.filter(r => r.success).length;
      
      toast({
        title: 'Thresholds Updated',
        description: `Successfully updated ${successful}/${results.length} thresholds`,
      });
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Unable to save threshold settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleConnectivityTest = async () => {
    setTesting(true);
    try {
      const response = await api.testConnectivity();
      if (response.success) {
        updateMetric('connectivity', response.data.status);
        toast({
          title: 'Connectivity Test',
          description: `Status: ${response.data.status} | Latency: ${response.data.latency}ms`,
        });
      }
    } catch (error) {
      toast({
        title: 'Test Failed',
        description: 'Unable to test connectivity',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleReset = () => {
    resetToDefaults();
    toast({
      title: 'Settings Reset',
      description: 'All settings have been restored to defaults',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">System Settings</h1>
          <p className="text-muted-foreground">Configure device behavior, AI parameters, and system thresholds</p>
        </div>

        <Tabs defaultValue="devices" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="devices" className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              Devices
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              AI
            </TabsTrigger>
            <TabsTrigger value="thresholds" className="flex items-center gap-2">
              <Gauge className="w-4 h-4" />
              Thresholds
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Account
            </TabsTrigger>
          </TabsList>

          <TabsContent value="devices">
            <Card className="hyperstack-card hyperstack-card-glow">
              <CardHeader>
                <CardTitle>Device Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="default-pump">Default Pump Mode</Label>
                        <p className="text-sm text-muted-foreground">Auto-start pump on system boot</p>
                      </div>
                      <Switch
                        id="default-pump"
                        checked={settings.defaultPumpMode}
                        onCheckedChange={(checked) => updateSetting('defaultPumpMode', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="default-light">Default Light Mode</Label>
                        <p className="text-sm text-muted-foreground">Auto-start lights on system boot</p>
                      </div>
                      <Switch
                        id="default-light"
                        checked={settings.defaultLightMode}
                        onCheckedChange={(checked) => updateSetting('defaultLightMode', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="default-fan">Default Fan Mode</Label>
                        <p className="text-sm text-muted-foreground">Auto-start fan on system boot</p>
                      </div>
                      <Switch
                        id="default-fan"
                        checked={settings.defaultFanMode}
                        onCheckedChange={(checked) => updateSetting('defaultFanMode', checked)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="camera-enabled">Camera System</Label>
                        <p className="text-sm text-muted-foreground">Enable camera and AI monitoring</p>
                      </div>
                      <Switch
                        id="camera-enabled"
                        checked={cameraEnabled}
                        onCheckedChange={(checked) => updateMetric('cameraEnabled', checked)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Connectivity Test</Label>
                      <Button 
                        onClick={handleConnectivityTest}
                        disabled={testing}
                        variant="outline"
                        className="w-full"
                      >
                        {testing ? (
                          <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                            Testing...
                          </>
                        ) : (
                          <>
                            <TestTube2 className="w-4 h-4 mr-2" />
                            Test Connection
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai">
            <Card className="hyperstack-card hyperstack-card-glow">
              <CardHeader>
                <CardTitle>AI Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ai-mode">AI Mode</Label>
                      <Select 
                        value={aiMode} 
                        onValueChange={(value: 'off' | 'segmentation') => updateMetric('aiMode', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="off">Off</SelectItem>
                          <SelectItem value="segmentation">Segmentation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="green-threshold">Green Threshold Sensitivity</Label>
                      <Slider
                        id="green-threshold"
                        min={0.1}
                        max={1.0}
                        step={0.05}
                        value={[settings.greenThreshold]}
                        onValueChange={([value]) => updateSetting('greenThreshold', value)}
                        className="py-4"
                      />
                      <div className="text-sm text-muted-foreground">
                        Current: {settings.greenThreshold.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="show-overlay">Show Overlay</Label>
                        <p className="text-sm text-muted-foreground">Display segmentation overlay on camera feed</p>
                      </div>
                      <Switch
                        id="show-overlay"
                        checked={settings.showOverlay}
                        onCheckedChange={(checked) => updateSetting('showOverlay', checked)}
                      />
                    </div>

                    <div className="p-4 bg-secondary rounded-lg">
                      <h4 className="font-medium mb-2">AI Performance</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Mode: {aiMode === 'off' ? 'Disabled' : 'Green Segmentation'}</div>
                        <div>Sensitivity: {(settings.greenThreshold * 100).toFixed(0)}%</div>
                        <div>Overlay: {settings.showOverlay ? 'Enabled' : 'Disabled'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="thresholds">
            <Card className="hyperstack-card hyperstack-card-glow">
              <CardHeader>
                <CardTitle>System Thresholds</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ph-min">pH Minimum</Label>
                      <Input
                        id="ph-min"
                        type="number"
                        step="0.1"
                        min="5.0"
                        max="8.0"
                        value={thresholds.phMin}
                        onChange={(e) => updateThreshold('phMin', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ph-max">pH Maximum</Label>
                      <Input
                        id="ph-max"
                        type="number"
                        step="0.1"
                        min="5.0"
                        max="8.0"
                        value={thresholds.phMax}
                        onChange={(e) => updateThreshold('phMax', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="temp-min">Temperature Minimum (°C)</Label>
                      <Input
                        id="temp-min"
                        type="number"
                        min="15"
                        max="35"
                        value={thresholds.tempMin}
                        onChange={(e) => updateThreshold('tempMin', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="temp-max">Temperature Maximum (°C)</Label>
                      <Input
                        id="temp-max"
                        type="number"
                        min="15"
                        max="35"
                        value={thresholds.tempMax}
                        onChange={(e) => updateThreshold('tempMax', parseInt(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ec-target">EC Target (μS/cm)</Label>
                      <Input
                        id="ec-target"
                        type="number"
                        min="500"
                        max="1200"
                        value={thresholds.ecTarget}
                        onChange={(e) => updateThreshold('ecTarget', parseInt(e.target.value) || 0)}
                      />
                    </div>

                    <Button 
                      onClick={handleSaveThresholds}
                      disabled={saving}
                      className="w-full"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Thresholds
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account">
            <Card className="hyperstack-card hyperstack-card-glow">
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-secondary rounded-lg">
                      <h4 className="font-medium mb-2">Profile Information</h4>
                      <div className="space-y-2 text-sm">
                        <div><strong>User:</strong> System Administrator</div>
                        <div><strong>Role:</strong> Owner</div>
                        <div><strong>System:</strong> HyperStack AI v1.0</div>
                        <div><strong>Last Login:</strong> {new Date().toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="p-4 bg-secondary rounded-lg">
                      <h4 className="font-medium mb-2">Theme Settings</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Dark Mode (Default)</span>
                        <Switch checked={true} disabled />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <h4 className="font-medium mb-2 text-destructive">Danger Zone</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Reset all settings to factory defaults. This action cannot be undone.
                      </p>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="destructive" className="w-full">
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Reset to Defaults
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reset All Settings</DialogTitle>
                            <DialogDescription>
                              This will permanently reset all settings to their factory defaults, 
                              including thresholds, AI configuration, and device preferences. 
                              Captured frames will also be cleared.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button variant="outline">Cancel</Button>
                            <Button variant="destructive" onClick={handleReset}>
                              Reset Everything
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}