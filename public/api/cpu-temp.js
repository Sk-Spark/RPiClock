// Simple API endpoint to read CPU temperature
// This would normally be a backend service, but for demo purposes we'll create a simple solution

const fs = require('fs').promises;
const path = require('path');

async function getCPUTemperature() {
  try {
    // Read from Raspberry Pi thermal zone
    const tempPath = '/sys/class/thermal/thermal_zone0/temp';
    const tempData = await fs.readFile(tempPath, 'utf8');
    const tempMillidegrees = parseInt(tempData.trim());
    const tempCelsius = tempMillidegrees / 1000;
    
    return {
      temperature: tempCelsius,
      unit: 'C',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error reading CPU temperature:', error);
    throw new Error('Could not read CPU temperature');
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getCPUTemperature };
}