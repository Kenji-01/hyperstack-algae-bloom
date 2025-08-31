// Create a shared store file that can be imported without path issues
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface CapturedFrame {
  id: string;
  timestamp: Date;
  coverage: number;
  imageData: string;
}

export interface DeviceState {
  lightOn: boolean;
  pumpOn: boolean;
  fanOn: boolean;
  valveOpen: boolean;
  duckweedCoverage: number;
  temperature: number;
  ph: number;
  ec: number;
  waterTemp: number;
  pH: number;
  EC: number;
  DO: number;
  growthRate: number[];
  energyUsage: number;
  co2Levels: number;
  connectivity: 'connected' | 'poor' | 'disconnected';
  systemHealth: 'good' | 'warning' | 'critical';
  recommendations: string[];
  aiMode: 'off' | 'segmentation';
  cameraEnabled: boolean;
  valveClosed: boolean | null;
  threshold: number;
  phAdjustmentActive: boolean | null;
  settings: {
    greenThreshold: number;
    showOverlay: boolean;
    defaultPumpMode: boolean;
    defaultLightMode: boolean;
    defaultFanMode: boolean;
    alarmVolume: number;
    updateFrequency: number;
    dataRetention: number;
  };
  thresholds: {
    phMin: number;
    phMax: number;
    tempMin: number;
    tempMax: number;
    ecTarget: number;
  };
  capturedFrames: CapturedFrame[];
}

export interface DeviceActions {
  toggleLight: () => void;
  togglePump: () => void;
  toggleFan: () => void;
  toggleValve: () => void;
  updateMetric: (key: keyof DeviceState, value: any) => void;
  setDuckweedCoverage: (pct: number) => void;
  setValveClosed: (closed: boolean | null) => void;
  setThreshold: (n: number) => void;
  updateSetting: (key: keyof DeviceState['settings'], value: any) => void;
  updateThreshold: (key: keyof DeviceState['thresholds'], value: number) => void;
  addCapturedFrame: (frame: CapturedFrame) => void;
  clearCapturedFrames: () => void;
  resetToDefaults: () => void;
  computeSystemHealth: () => void;
}

const initialState: DeviceState = {
  lightOn: false,
  pumpOn: false,
  fanOn: false,
  valveOpen: true,
  duckweedCoverage: 0,
  temperature: 24.5,
  ph: 6.8,
  ec: 850,
  waterTemp: 24.5,
  pH: 6.8,
  EC: 850,
  DO: 8.2,
  growthRate: [65, 72, 68, 75, 82, 79, 71, 77, 84, 81, 73, 76, 83, 80],
  energyUsage: 4.2,
  co2Levels: 2.1,
  connectivity: 'connected',
  systemHealth: 'good',
  recommendations: [],
  aiMode: 'off',
  cameraEnabled: true,
  valveClosed: null,
  threshold: 40,
  phAdjustmentActive: null,
  settings: {
    greenThreshold: 0.3,
    showOverlay: true,
    defaultPumpMode: false,
    defaultLightMode: false,
    defaultFanMode: false,
    alarmVolume: 0.7,
    updateFrequency: 5,
    dataRetention: 30,
  },
  thresholds: {
    phMin: 6.0,
    phMax: 7.5,
    tempMin: 20,
    tempMax: 28,
    ecTarget: 800,
  },
  capturedFrames: [],
};

export const useDeviceStore = create<DeviceState & DeviceActions>()(
  devtools(
    (set, get) => ({
      ...initialState,
      toggleLight: () => set((state) => ({ lightOn: !state.lightOn })),
      togglePump: () => set((state) => ({ pumpOn: !state.pumpOn })),
      toggleFan: () => set((state) => ({ fanOn: !state.fanOn })),
      toggleValve: () => set((state) => ({ valveOpen: !state.valveOpen })),
      updateMetric: (key, value) => set((state) => ({ [key]: value })),
      setDuckweedCoverage: (pct) => set({ duckweedCoverage: pct }),
      setValveClosed: (closed) => set({ valveClosed: closed }),
      setThreshold: (n) => set({ threshold: n }),
      updateSetting: (key, value) => 
        set((state) => ({ 
          settings: { ...state.settings, [key]: value } 
        })),
      updateThreshold: (key, value) => 
        set((state) => ({ 
          thresholds: { ...state.thresholds, [key]: value } 
        })),
      addCapturedFrame: (frame) => 
        set((state) => ({ 
          capturedFrames: [...state.capturedFrames, frame].slice(-50)
        })),
      clearCapturedFrames: () => set({ capturedFrames: [] }),
      resetToDefaults: () => set(initialState),
      computeSystemHealth: () => {
        const state = get();
        const recommendations: string[] = [];
        let health: 'good' | 'warning' | 'critical' = 'good';
        
        if (state.pH < 6.5 || state.pH > 7.5) {
          recommendations.push('pH level is outside optimal range');
          health = 'warning';
        }
        if (state.waterTemp < 20 || state.waterTemp > 26) {
          recommendations.push('Water temperature needs adjustment');
          health = 'warning';
        }
        if (state.DO < 7.5) {
          recommendations.push('Dissolved oxygen levels are low');
          health = 'critical';
        }
        
        set({ systemHealth: health, recommendations });
      },
    }),
    { name: 'device-store' }
  )
);