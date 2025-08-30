// Mock API layer for HyperStack AI

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const randomDelay = () => delay(200 + Math.random() * 500);

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

export const api = {
  async getStatus(): Promise<ApiResponse> {
    await randomDelay();
    return {
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        status: 'operational'
      }
    };
  },

  async setLight(on: boolean): Promise<ApiResponse> {
    await randomDelay();
    return {
      success: Math.random() > 0.1, // 90% success rate
      message: on ? 'Lights turned on' : 'Lights turned off'
    };
  },

  async setPump(on: boolean): Promise<ApiResponse> {
    await randomDelay();
    return {
      success: Math.random() > 0.05, // 95% success rate
      message: on ? 'Pump started' : 'Pump stopped'
    };
  },

  async setValve(open: boolean): Promise<ApiResponse> {
    await randomDelay();
    return {
      success: Math.random() > 0.1, // 90% success rate
      message: open ? 'Valve opened' : 'Valve closed'
    };
  },

  async setFan(on: boolean): Promise<ApiResponse> {
    await randomDelay();
    return {
      success: Math.random() > 0.1, // 90% success rate
      message: on ? 'Fan started' : 'Fan stopped'
    };
  },

  async setAiMode(mode: 'off' | 'segmentation'): Promise<ApiResponse> {
    await randomDelay();
    return {
      success: true,
      message: `AI mode set to ${mode}`
    };
  },

  async updateThreshold(name: string, value: number): Promise<ApiResponse> {
    await randomDelay();
    return {
      success: Math.random() > 0.05, // 95% success rate
      message: `${name} threshold updated to ${value}`
    };
  },

  async runQuickScan(): Promise<ApiResponse> {
    await delay(2000); // Longer delay for scan
    return {
      success: true,
      data: {
        health: Math.random() > 0.3 ? 'good' : Math.random() > 0.5 ? 'warning' : 'critical',
        scannedComponents: ['pump', 'lights', 'sensors', 'camera'],
        timestamp: new Date().toISOString()
      },
      message: 'System scan completed'
    };
  },

  async testConnectivity(): Promise<ApiResponse> {
    await randomDelay();
    const connectionQuality = Math.random();
    return {
      success: true,
      data: {
        status: connectionQuality > 0.7 ? 'connected' : connectionQuality > 0.3 ? 'poor' : 'disconnected',
        latency: Math.round(50 + Math.random() * 200),
        signal: Math.round(connectionQuality * 100)
      },
      message: 'Connectivity test completed'
    };
  },

  async exportData(timeRange: string): Promise<ApiResponse> {
    await delay(1000);
    return {
      success: true,
      data: {
        downloadUrl: '#',
        filename: `hyperstack-data-${timeRange}-${Date.now()}.csv`,
        records: Math.round(Math.random() * 1000 + 100)
      },
      message: 'Data export ready'
    };
  },

  async recomputeMetrics(): Promise<ApiResponse> {
    await delay(1000);
    return {
      success: true,
      message: 'Metrics recomputed successfully'
    };
  }
};