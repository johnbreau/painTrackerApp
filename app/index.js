import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { Accelerometer } from 'expo-sensors';

export default function PainTracker() {
  const [painLogs, setPainLogs] = useState([]);
  const [isWatching, setIsWatching] = useState(false);

  // Watch for watch taps using accelerometer
  useEffect(() => {
    if (isWatching) {
      Accelerometer.setUpdateInterval(400);
      const subscription = Accelerometer.addListener(accelerometerData => {
        // Simple tap detection - adjust sensitivity as needed
        const { x, y, z } = accelerometerData;
        const acceleration = Math.sqrt(x * x + y * y + z * z);
        
        if (acceleration > 1.5) {
          logPain();
        }
      });

      return () => subscription && subscription.remove();
    }
  }, [isWatching]);

  const logPain = async () => {
    try {
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Add to logs
      const newLog = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        intensity: 5, // Default intensity
        location: 'Wrist'
      };
      
      setPainLogs(prevLogs => [newLog, ...prevLogs]);
      
    } catch (error) {
      console.error('Error logging pain:', error);
    }
  };

  const toggleWatchMode = () => {
    setIsWatching(!isWatching);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pain Tracker</Text>
      
      <View style={styles.instructions}>
        <Text style={styles.instructionsText}>
          {isWatching 
            ? 'Shake the device to log pain'
            : 'Press "Start Watch Mode" to begin'}
        </Text>
      </View>
      
      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={[styles.button, isWatching && styles.activeButton]}
          onPress={toggleWatchMode}
        >
          <Text style={styles.buttonText}>
            {isWatching ? 'Stop Watch Mode' : 'Start Watch Mode'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.logButton}
          onPress={logPain}
        >
          <Text style={styles.buttonText}>Log Pain Manually</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.logsTitle}>Recent Logs:</Text>
      <View style={styles.logsContainer}>
        {painLogs.length === 0 ? (
          <Text style={styles.noLogsText}>No pain events logged yet</Text>
        ) : (
          painLogs.map(log => (
            <View key={log.id} style={styles.logItem}>
              <Text>{new Date(log.timestamp).toLocaleString()}</Text>
              <Text>Intensity: {log.intensity}/10</Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1a1a1a',
  },
  instructions: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 25,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  instructionsText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  buttonsContainer: {
    marginBottom: 25,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activeButton: {
    backgroundColor: '#FF3B30',
  },
  logButton: {
    backgroundColor: '#34C759',
    padding: 18,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  logsTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    color: '#1a1a1a',
  },
  logsContainer: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 15,
  },
  logItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  noLogsText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    fontSize: 16,
  },
});
