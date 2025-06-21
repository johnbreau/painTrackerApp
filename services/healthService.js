import * as Health from 'expo-health-connect';

export const initializeHealthConnect = async () => {
  try {
    // Check if Health Connect is available
    const isAvailable = await Health.isAvailableAsync();
    
    if (!isAvailable) {
      console.log('Health Connect is not available on this device');
      return false;
    }

    // Request permissions
    const permissions = await Health.requestPermissionsAsync([
      { accessType: 'read', recordType: 'Steps' },
      { accessType: 'write', recordType: 'CustomPainEvent' }
    ]);

    return permissions.granted;
  } catch (error) {
    console.error('Error initializing Health Connect:', error);
    return false;
  }
};

export const logPainEvent = async (intensity = 5, location = 'Wrist') => {
  try {
    const isAvailable = await Health.isAvailableAsync();
    if (!isAvailable) return false;

    const now = new Date();
    const painEvent = {
      recordType: 'CustomPainEvent',
      metadata: {
        id: `pain-${now.getTime()}`,
        lastModifiedTime: now.toISOString(),
        clientRecordId: `pain-${now.getTime()}`,
        dataOrigin: 'com.yourname.paintracker',
        clientRecordVersion: 1,
      },
      startTime: now.toISOString(),
      endTime: now.toISOString(),
      intensity,
      location,
    };

    await Health.saveRecords([painEvent]);
    return true;
  } catch (error) {
    console.error('Error logging pain event to Health Connect:', error);
    return false;
  }
};

export const getPainHistory = async (startDate, endDate = new Date()) => {
  try {
    const isAvailable = await Health.isAvailableAsync();
    if (!isAvailable) return [];

    const painEvents = await Health.readRecords({
      recordType: 'CustomPainEvent',
      timeRangeFilter: {
        operator: 'between',
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      },
    });

    return painEvents.records;
  } catch (error) {
    console.error('Error fetching pain history:', error);
    return [];
  }
};
