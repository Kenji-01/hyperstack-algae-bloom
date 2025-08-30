# pH Sensor Integration Guide

This document explains how to integrate a pH sensor with the Duckweed Segmentation API for automatic pH control.

## Overview

The system is designed to prioritize pH sensor readings over duckweed coverage for pH control decisions. When a pH sensor is connected and providing readings, it will be used for precise pH management. If no sensor is available, the system falls back to duckweed coverage-based control.

## Environment Variables

Add these environment variables to configure pH sensor behavior:

```bash
# pH sensor target range (optimal for duckweed growth)
TARGET_PH_MIN=6.5
TARGET_PH_MAX=7.5

# Existing pH control thresholds (used when no sensor available)
PH_THRESHOLD_LOW=30.0
PH_THRESHOLD_HIGH=70.0
PH_RELAY_PIN=18
```

## Implementation Steps

### 1. Hardware Setup

Connect your pH sensor to the Raspberry Pi:
- **Analog pH sensors**: Connect to ADC (e.g., MCP3008) then to Pi
- **Digital pH sensors**: Connect via I2C or SPI
- **Serial pH probes**: Connect via UART

### 2. Software Implementation

Replace the placeholder `read_ph_sensor()` function in `main.py`:

#### For Analog pH Sensor (via MCP3008 ADC):

```python
import spidev

def read_ph_sensor() -> float:
    """Read pH from analog sensor via MCP3008 ADC"""
    try:
        spi = spidev.SpiDev()
        spi.open(0, 0)  # Bus 0, Device 0
        spi.max_speed_hz = 1000000
        
        # Read from channel 0
        adc_response = spi.xfer2([1, (8 + 0) << 4, 0])
        adc_value = ((adc_response[1] & 3) << 8) + adc_response[2]
        
        # Convert ADC value to voltage (assuming 3.3V reference)
        voltage = (adc_value * 3.3) / 1024
        
        # Convert voltage to pH (calibration required)
        # This is sensor-specific - adjust based on your sensor's specs
        ph_value = 7.0 - ((voltage - 2.5) / 0.18)
        
        spi.close()
        return ph_value if 0 <= ph_value <= 14 else None
        
    except Exception as e:
        log.warning(f"pH sensor read failed: {e}")
        return None
```

#### For I2C pH Sensor:

```python
import smbus
import time

def read_ph_sensor() -> float:
    """Read pH from I2C sensor"""
    try:
        bus = smbus.SMBus(1)  # I2C bus 1
        sensor_address = 0x63  # Replace with your sensor's address
        
        # Send read command (sensor-specific)
        bus.write_byte(sensor_address, 0x52)  # 'R' command
        time.sleep(0.9)  # Wait for reading
        
        # Read response
        response = bus.read_i2c_block_data(sensor_address, 0, 7)
        
        # Parse response (sensor-specific format)
        if response[0] == 1:  # Success
            ph_string = ''.join([chr(x) for x in response[1:] if x != 0])
            ph_value = float(ph_string)
            return ph_value if 0 <= ph_value <= 14 else None
            
    except Exception as e:
        log.warning(f"pH sensor read failed: {e}")
        return None
```

#### For Serial pH Probe:

```python
import serial
import time

def read_ph_sensor() -> float:
    """Read pH from serial probe"""
    try:
        ser = serial.Serial('/dev/ttyUSB0', 9600, timeout=1)
        
        # Send read command
        ser.write(b'R\r')
        time.sleep(1)
        
        # Read response
        response = ser.readline().decode('utf-8').strip()
        ser.close()
        
        # Parse response
        if response.startswith('*OK'):
            ph_value = float(response.split(',')[1])
            return ph_value if 0 <= ph_value <= 14 else None
            
    except Exception as e:
        log.warning(f"pH sensor read failed: {e}")
        return None
```

### 3. Calibration

Most pH sensors require calibration with buffer solutions:

1. **Two-point calibration**: Use pH 4.0 and pH 7.0 buffer solutions
2. **Three-point calibration**: Use pH 4.0, pH 7.0, and pH 10.0 buffer solutions

Update the voltage-to-pH conversion formula based on your calibration results.

### 4. Testing

1. Start the server: `uvicorn main:app --host 0.0.0.0 --port 8000`
2. Check sensor status: `GET /ph/status`
3. Monitor logs for pH readings during analysis
4. Test with different pH solutions to verify accuracy

## Control Logic

The pH control logic works as follows:

1. **pH Sensor Available**: 
   - If pH < TARGET_PH_MIN or pH > TARGET_PH_MAX → Activate pH adjustment
   - If TARGET_PH_MIN ≤ pH ≤ TARGET_PH_MAX → Deactivate pH adjustment

2. **No pH Sensor (Fallback)**:
   - If duckweed coverage ≤ 30% → Activate pH adjustment
   - If duckweed coverage ≥ 70% → Deactivate pH adjustment
   - If 30% < coverage < 70% → Maintain current state

## Troubleshooting

### Common Issues:

1. **Sensor not detected**: Check wiring and I2C/SPI configuration
2. **Erratic readings**: Ensure proper sensor calibration and stable power supply
3. **No response**: Verify sensor address and communication protocol
4. **Out of range values**: Check sensor calibration and buffer solutions

### Debug Commands:

```bash
# Check I2C devices
i2cdetect -y 1

# Test SPI communication
ls /dev/spi*

# Monitor serial communication
screen /dev/ttyUSB0 9600
```

## Dependencies

Add to `requirements.txt` based on your sensor type:

```
# For SPI sensors
spidev

# For I2C sensors  
smbus2

# For serial sensors
pyserial
```

## Safety Notes

- Always use proper electrical isolation when working with water and electronics
- Calibrate sensors regularly for accurate readings
- Implement proper error handling to prevent system crashes
- Consider using redundant sensors for critical applications
