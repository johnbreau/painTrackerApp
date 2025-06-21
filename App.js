import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  TouchableWithoutFeedback,
  ScrollView,
  StatusBar,
  Animated,
  Easing,
  Switch,
  Dimensions,
  SafeAreaView,
  Modal,
  TextInput
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Accelerometer } from 'expo-sensors';
import { initializeHealthConnect, logPainEvent } from './services/healthService';

// Screen dimensions can be accessed using Dimensions.get('window')

// Animation configuration
const config = {
  animation: {
    duration: 300,
    easing: Easing.inOut(Easing.ease),
  },
  colors: {
    primary: '#6366f1',
    primaryLight: '#818cf8',
    danger: '#ef4444',
    success: '#10b981',
    background: '#f8fafc',
    card: '#ffffff',
    text: '#1e293b',
    textLight: '#64748b',
    border: '#e2e8f0',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 5,
    },
  },
};

// Custom hook for watch mode with haptic feedback
const useWatchMode = (onTap) => {
  const [isWatching, setIsWatching] = useState(false);
  const lastTap = useRef(0);
  
  // Watch for watch taps using accelerometer
  useEffect(() => {
    if (isWatching) {
      Accelerometer.setUpdateInterval(400);
      const subscription = Accelerometer.addListener(accelerometerData => {
        const { x, y, z } = accelerometerData;
        const acceleration = Math.sqrt(x * x + y * y + z * z);
        const now = Date.now();
        
        // Debounce taps to prevent multiple rapid triggers
        if (acceleration > 1.5 && now - lastTap.current > 1000) {
          lastTap.current = now;
          onTap();
        }
      });

      return () => subscription && subscription.remove();
    }
  }, [isWatching, onTap]);

  const toggleWatchMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsWatching(!isWatching);
  };

  return { isWatching, toggleWatchMode };
};

// Pain level selector component
const PainLevelSelector = ({ level, onSelect, color = config.colors.primary }) => {
  const levels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  
  return (
    <View style={styles.painLevelContainer}>
      <View style={styles.painLevelBars}>
        {levels.map((lvl) => (
          <TouchableWithoutFeedback 
            key={lvl} 
            onPress={() => onSelect(lvl)}
          >
            <View 
              style={[
                styles.painLevelBar,
                lvl <= level && { backgroundColor: color },
                lvl === 1 && { borderTopLeftRadius: 4, borderBottomLeftRadius: 4 },
                lvl === 10 && { borderTopRightRadius: 4, borderBottomRightRadius: 4 },
              ]}
            />
          </TouchableWithoutFeedback>
        ))}
      </View>
      <Text style={[styles.painLevelText, { color }]}>{level}/10</Text>
    </View>
  );
};

// Pain log item component
const PainLogItem = ({ log }) => {
  const formattedTime = new Date(log.timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  const formattedDate = new Date(log.timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <View style={styles.logItem}>
      <View style={styles.logTimeContainer}>
        <Text style={styles.logTime}>{formattedTime}</Text>
        <Text style={styles.logDate}>{formattedDate}</Text>
      </View>
      <View style={styles.logContent}>
        <View style={styles.logHeader}>
          <Text style={styles.logLocation}>{log.location}</Text>
          <Text style={styles.logIntensity}>{log.intensity}/10</Text>
        </View>
        <View style={styles.painLevelIndicatorContainer}>
          <View 
            style={[
              styles.painLevelIndicator, 
              { 
                width: `${log.intensity * 10}%`,
                backgroundColor: getIntensityColor(log.intensity)
              }
            ]} 
          />
        </View>
      </View>
    </View>
  );
};

// Helper function to get color based on pain intensity
const getIntensityColor = (intensity) => {
  if (intensity <= 3) return '#10b981'; // Green for mild
  if (intensity <= 7) return '#f59e0b'; // Yellow for moderate
  return '#ef4444'; // Red for severe
};

export default function App() {
  const [painLogs, setPainLogs] = useState([]);
  const [showLogForm, setShowLogForm] = useState(false);
  const [currentPainLevel, setCurrentPainLevel] = useState(5);
  const [selectedLocation, setSelectedLocation] = useState('Head');
  
  // Initialize Health Connect on mount
  useEffect(() => {
    const initHealth = async () => {
      try {
        await initializeHealthConnect();
      } catch (error) {
        console.log('Health Connect initialization error:', error);
      }
    };

    initHealth();
  }, []);
  
  // Watch mode functionality
  const handleLogPain = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const newLog = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        intensity: currentPainLevel,
        location: selectedLocation
      };
      
      setPainLogs(prevLogs => [newLog, ...prevLogs]);
      
      // Sync with Apple Health
      const healthLogged = await logPainEvent(newLog.intensity, newLog.location);
      if (!healthLogged) {
        console.log('Could not log to Apple Health');
      }
      
    } catch (error) {
      console.error('Error logging pain:', error);
    }
  }, [currentPainLevel, selectedLocation]);
  
  const { isWatching, toggleWatchMode } = useWatchMode(handleLogPain);
  
  const handleAddLog = () => {
    setShowLogForm(true);
  };
  
  const handleSaveLog = () => {
    handleLogPain();
    setShowLogForm(false);
  };
  
  const locations = [
    'Head', 'Neck', 'Shoulder', 'Arm', 'Elbow', 'Wrist', 
    'Hand', 'Chest', 'Back', 'Hip', 'Leg', 'Knee', 'Ankle', 'Foot'
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: config.colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={config.colors.background} />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Pain Tracker</Text>
            <Text style={styles.subtitle}>Track and monitor your pain levels</Text>
          </View>
          <TouchableOpacity 
            style={styles.themeToggle}
            onPress={() => {}}
          >
            <MaterialCommunityIcons 
              name="theme-light-dark" 
              size={24} 
              color={config.colors.primary} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: config.colors.primary }]}>
            <Text style={styles.statValue}>{painLogs.length}</Text>
            <Text style={styles.statLabel}>Total Logs</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: config.colors.success }]}>
            <Text style={styles.statValue}>
              {painLogs.length > 0 
                ? Math.round(painLogs.reduce((sum, log) => sum + log.intensity, 0) / painLogs.length * 10) / 10 
                : '0'}/10
            </Text>
            <Text style={styles.statLabel}>Avg. Pain</Text>
          </View>
        </View>
        
        {/* Watch Mode Card */}
        <View style={[styles.card, { backgroundColor: isWatching ? 'rgba(99, 102, 241, 0.1)' : '#fff' }]}>
          <View style={styles.cardHeader}>
            <MaterialIcons 
              name="watch-later" 
              size={24} 
              color={isWatching ? config.colors.primary : config.colors.textLight} 
            />
            <Text style={[styles.cardTitle, { color: isWatching ? config.colors.primary : config.colors.text }]}>
              Watch Mode
            </Text>
            <View style={[styles.toggleContainer, isWatching && { backgroundColor: 'rgba(99, 102, 241, 0.2)' }]}>
              <Switch
                value={isWatching}
                onValueChange={toggleWatchMode}
                trackColor={{ false: '#e2e8f0', true: config.colors.primary }}
                thumbColor="white"
              />
            </View>
          </View>
          <Text style={[styles.cardDescription, { color: config.colors.textLight }]}>
            {isWatching 
              ? 'Tap your phone or shake the simulator to log pain'
              : 'Enable to log pain with a simple tap or shake'}
          </Text>
          {isWatching && (
            <View style={styles.pulseContainer}>
              <Animated.View style={[styles.pulse, { backgroundColor: config.colors.primary }]} />
            </View>
          )}
        </View>
        
        {/* Recent Logs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Logs</Text>
            {painLogs.length > 0 && (
              <TouchableOpacity onPress={handleAddLog}>
                <Text style={[styles.seeAll, { color: config.colors.primary }]}>
                  Add New
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          {painLogs.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons 
                name="add-circle-outline" 
                size={48} 
                color={config.colors.primary} 
                style={styles.emptyIcon}
              />
              <Text style={[styles.emptyText, { color: config.colors.textLight }]}>
                No pain logs yet. Tap below to add your first entry.
              </Text>
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: config.colors.primary }]}
                onPress={handleAddLog}
              >
                <MaterialIcons name="add" size={20} color="white" />
                <Text style={styles.addButtonText}>Add Pain Log</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.logsContainer}>
              {painLogs.slice(0, 5).map((log, index) => (
                <PainLogItem key={log.id} log={log} />
              ))}
              {painLogs.length > 5 && (
                <TouchableOpacity style={styles.viewAllButton}>
                  <Text style={[styles.viewAllText, { color: config.colors.primary }]}>
                    View All Logs ({painLogs.length - 5} more)
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Floating Action Button */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: config.colors.primary }]}
        onPress={handleAddLog}
        activeOpacity={0.9}
      >
        <MaterialIcons name="add" size={24} color="white" />
      </TouchableOpacity>
      
      {/* Add Log Modal */}
      <Modal
        visible={showLogForm}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLogForm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: config.colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: config.colors.text }]}>
                Log Pain
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowLogForm(false)}
              >
                <MaterialIcons name="close" size={24} color={config.colors.textLight} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: config.colors.text }]}>
                Pain Intensity
              </Text>
              <PainLevelSelector 
                level={currentPainLevel} 
                onSelect={setCurrentPainLevel}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: config.colors.text }]}>
                Location
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.locationsContainer}
              >
                {locations.map((location, index) => (
                  <TouchableOpacity
                    key={location}
                    style={[
                      styles.locationButton,
                      selectedLocation === location && {
                        backgroundColor: config.colors.primary,
                        borderColor: config.colors.primary,
                      },
                      { 
                        marginLeft: index === 0 ? 0 : 8,
                        borderColor: config.colors.border
                      }
                    ]}
                    onPress={() => setSelectedLocation(location)}
                  >
                    <Text 
                      style={[
                        styles.locationText,
                        selectedLocation === location && { color: 'white' },
                        { color: config.colors.text }
                      ]}
                    >
                      {location}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: config.colors.text }]}>
                Notes (Optional)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: config.colors.background,
                    color: config.colors.text,
                    borderColor: config.colors.border
                  }
                ]}
                placeholder="Add any additional notes..."
                placeholderTextColor={config.colors.textLight + '80'}
                multiline
                numberOfLines={3}
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: config.colors.primary }]}
              onPress={handleSaveLog}
              activeOpacity={0.9}
            >
              <Text style={styles.saveButtonText}>Save Log</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  themeToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#6366f1',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  toggleContainer: {
    padding: 4,
    borderRadius: 12,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  pulseContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  pulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    margin: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  logsContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
  },
  logItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
  },
  logTimeContainer: {
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    fontFamily: 'System',
  },
  logDate: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
    fontFamily: 'System',
  },
  logContent: {
    flex: 1,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  logLocation: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    fontFamily: 'System',
  },
  logIntensity: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
    fontFamily: 'System',
  },
  painLevelIndicatorContainer: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  },
  painLevelIndicator: {
    height: '100%',
    borderRadius: 2,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 10,
  },
});
