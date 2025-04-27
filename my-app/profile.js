import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ScrollView, Dimensions, ActivityIndicator, TextInput, FlatList, Linking, Platform, SafeAreaView, PermissionsAndroid, ToastAndroid } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { ref, onValue, query, orderByChild, limitToLast, push, set, update, remove, off } from 'firebase/database';
import { LineChart } from 'react-native-chart-kit';

// Get screen dimensions
const { width: initialWidth, height: initialHeight } = Dimensions.get('window');
const primaryColor = '#9370DB';

// Time period options
const TIME_PERIODS = {
  CURRENT: 'current',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly'
};

const ProfileScreen = () => {
  const [loading, setLoading] = useState(true);
  const [moodHistory, setMoodHistory] = useState([]);
  const [timePeriod, setTimePeriod] = useState(TIME_PERIODS.CURRENT);
  const [sosSending, setSosSending] = useState(false);
  const [userStreak, setUserStreak] = useState(0);
  const [userPoints, setUserPoints] = useState(0);
  const [dimensions, setDimensions] = useState({ 
    window: { width: initialWidth, height: initialHeight },
    screen: Dimensions.get('screen')
  });
  const [contacts, setContacts] = useState([]);
  const [newContactName, setNewContactName] = useState('');
  const [newContactNumber, setNewContactNumber] = useState('');
  const [showContactForm, setShowContactForm] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isSendingSOS, setIsSendingSOS] = useState(false);
  
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window, screen }) => {
      setDimensions({ window, screen });
    });
    return () => subscription?.remove();
  }, []);
  
  useEffect(() => {
    loadMoodHistory();
    fetchUserStats();
  }, []);
  
  useEffect(() => {
    if (!auth.currentUser) return;
    
    const contactsRef = ref(db, `users/${auth.currentUser.uid}/emergencyContacts`);
    const listener = onValue(contactsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userContacts = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
          default: false
        }));
        setContacts(userContacts);
      } else {
        setContacts([]);
      }
    });

    return () => {
      off(contactsRef, 'value', listener);
    };
  }, []);
  
  const loadMoodHistory = () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setLoading(true);
    const moodHistoryRef = query(
      ref(db, `userMoods/${currentUser.uid}/moodHistory`),
      orderByChild('timestamp'),
      limitToLast(10)
    );

    onValue(moodHistoryRef, (snapshot) => {
      if (snapshot.exists()) {
        const historyData = snapshot.val();
        const moodArray = Object.values(historyData).sort((a, b) => a.timestamp - b.timestamp);
        setMoodHistory(moodArray);
      }
      setLoading(false);
    }, { onlyOnce: true });
  };
  
  const fetchUserStats = () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    
    const userRef = ref(db, `users/${currentUser.uid}`);
    onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        setUserStreak(userData.streak || 0);
        setUserPoints(userData.points || 0);
      }
    });
  };

  const getSentimentValue = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 1;
      case 'negative': return -1;
      case 'neutral': return 0;
      default: return 0;
    }
  };
  
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };
  
  const renderChartContent = () => {
    const containerPadding = 40;
    const chartWidth = Math.min(dimensions.window.width - containerPadding, 500);
    const chartHeight = Math.min(180, dimensions.window.height * 0.25);
    
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={styles.loadingText}>Loading your mood history...</Text>
        </View>
      );
    }
    
    if (timePeriod === TIME_PERIODS.CURRENT && moodHistory.length === 0) {
      return (
        <Text style={styles.noDataText}>
          No mood data available yet. Chat with the assistant to track your mood over time.
        </Text>
      );
    }
    
    const prepareChartData = () => {
      switch(timePeriod) {
        case TIME_PERIODS.CURRENT:
          const maxLabels = Math.floor(chartWidth / 60);
          const step = Math.max(1, Math.ceil(moodHistory.length / maxLabels));
          
          const filteredLabels = [];
          const filteredData = [];
          
          moodHistory.forEach((mood, i) => {
            if (i % step === 0 || i === moodHistory.length - 1) {
              filteredLabels.push(formatDate(mood.timestamp));
              filteredData.push(getSentimentValue(mood.sentiment));
            }
          });
          
          return {
            labels: filteredLabels,
            datasets: [{
              data: filteredData,
              color: (opacity = 1) => primaryColor,
              strokeWidth: 2
            }],
            legend: ["Mood"]
          };
          
        case TIME_PERIODS.WEEKLY:
          return {
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            datasets: [{
              data: [0, 0, 0, 0, 0, 0, 0],
              color: (opacity = 1) => primaryColor,
              strokeWidth: 2
            }],
            legend: ["Weekly Mood"]
          };
          
        case TIME_PERIODS.MONTHLY:
          return {
            labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
            datasets: [{
              data: [0, 0, 0, 0],
              color: (opacity = 1) => primaryColor,
              strokeWidth: 2
            }],
            legend: ["Monthly Mood"]
          };
        default:
          return {
            labels: [],
            datasets: [{ data: [] }],
            legend: [""]
          };
      }
    };
    
    const chartConfig = {
      backgroundGradientFrom: "#ffffff",
      backgroundGradientTo: "#ffffff",
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(147, 112, 219, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      style: {
        borderRadius: 16
      },
      propsForDots: {
        r: "6",
        strokeWidth: "2",
        stroke: primaryColor
      },
      propsForLabels: {
        fontSize: 10,
        fontWeight: '500',
        textAlign: 'center'
      },
      propsForBackgroundLines: {
        strokeDasharray: "",
        stroke: "#e0e0e0",
        strokeWidth: 1
      },
      formatYLabel: (value) => {
        if (value === 1) return "+";
        if (value === 0) return "0";
        if (value === -1) return "-";
        return "";
      },
      horizontalLabelRotation: 0,
      verticalLabelRotation: 0,
      formatXLabel: (label) => {
        if (label && label.includes('/')) {
          return label.split('/')[1];
        }
        return label;
      }
    };
    
    const renderChart = (data) => (
      <View style={styles.chartWrapper}>
        <LineChart
          data={data}
          width={chartWidth}
          height={chartHeight}
          chartConfig={chartConfig}
          withHorizontalLabels={true}
          withVerticalLabels={true}
          withHorizontalLines={true}
          withVerticalLines={false}
          withDots={true}
          withShadow={false}
          bezier={true}
          style={{
            marginVertical: 8,
            borderRadius: 16,
            paddingRight: 0,
            paddingLeft: 0
          }}
          fromZero={false}
          segments={3}
          yAxisLabel=""
          yAxisSuffix=""
        />
      </View>
    );
    
    if (timePeriod === TIME_PERIODS.WEEKLY) {
      return (
        <View style={styles.chartWrapper}>
          {renderChart(prepareChartData())}
          <Text style={styles.noDataText}>
            Weekly mood history is not available yet.
          </Text>
        </View>
      );
    }
    
    if (timePeriod === TIME_PERIODS.MONTHLY) {
      return (
        <View style={styles.chartWrapper}>
          {renderChart(prepareChartData())}
          <Text style={styles.noDataText}>
            Monthly mood history is not available yet.
          </Text>
        </View>
      );
    }
    
    return (
      <View style={styles.chartWrapper}>
        {renderChart(prepareChartData())}
        <Text style={styles.chartDescription}>
          This chart shows your mood patterns based on your conversations with the mental health assistant.
        </Text>
      </View>
    );
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const handleAddContact = async () => {
    if (!newContactName.trim() || !newContactNumber.trim()) {
      Alert.alert('Input Required', 'Please enter both name and number');
      return;
    }
    
    if (!auth.currentUser) {
      Alert.alert('Authentication Required', 'Please sign in to add contacts');
      return;
    }
    
    try {
      const contactsRef = ref(db, `users/${auth.currentUser.uid}/emergencyContacts`);
      const newContactRef = push(contactsRef);
      
      await set(newContactRef, {
        name: newContactName.trim(),
        number: newContactNumber.trim(),
      });
      
      setNewContactName('');
      setNewContactNumber('');
      setShowContactForm(false);
    } catch (error) {
      console.error('Failed to add contact:', error);
      Alert.alert('Error', 'Could not add contact');
    }
  };

  const handleRemoveContact = async (contactId, isDefault) => {
    if (isDefault) {
      Alert.alert('Cannot Remove', 'Default emergency contacts cannot be removed');
      return;
    }
    
    if (!auth.currentUser) {
      Alert.alert('Authentication Required', 'Please sign in to remove contacts');
      return;
    }
    
    try {
      const contactRef = ref(db, `users/${auth.currentUser.uid}/emergencyContacts/${contactId}`);
      await remove(contactRef);
      Alert.alert('Success', 'Contact removed successfully');
    } catch (error) {
      console.error('Failed to remove contact:', error);
      Alert.alert('Error', 'Could not remove contact');
    }
  };

  const handleCallContact = (number) => {
    try {
      Linking.openURL(`tel:${number}`);
    } catch (error) {
      console.error('Error making phone call:', error);
      Alert.alert('Error', 'Could not make the call');
    }
  };
  
  const handleSOS = () => {
    if (contacts.length === 0) {
      Alert.alert(
        'No Emergency Contacts', 
        'Please add at least one emergency contact before using the SOS feature.',
        [
          {
            text: 'Add Contact',
            onPress: () => setShowContactForm(true),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          }
        ]
      );
      return;
    }
    
    Alert.alert(
      'Emergency Call',
      'Would you like to call your emergency contact?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('SOS cancelled by user')
        },
        {
          text: 'Call Now',
          style: 'destructive',
          onPress: () => {
            callEmergencyContact();
          },
        },
      ],
      { cancelable: true }
    );
  };
  
  const callEmergencyContact = async () => {
    setSosSending(true);
    
    try {
      if (auth.currentUser) {
        try {
          const sosRef = ref(db, `users/${auth.currentUser.uid}/sosHistory`);
          const newSosRef = push(sosRef);
          await set(newSosRef, {
            timestamp: Date.now(),
            action: 'emergency call',
            contactsNotified: contacts.map(c => ({ name: c.name, number: c.number }))
          });
        } catch (error) {
          console.error('Failed to log SOS to database:', error);
        }
      }
      
      if (contacts.length > 0) {
        try {
          const firstContact = contacts[0];
          await Linking.openURL(`tel:${firstContact.number}`);
          
          Alert.alert(
            'Emergency Call Initiated',
            `Calling ${firstContact.name}...`,
            [{ text: 'OK' }]
          );
        } catch (error) {
          console.error('Failed to initiate call:', error);
          Alert.alert('Error', 'Could not make the emergency call. Please try manually calling your contact.');
        }
      }
    } catch (error) {
      console.error('Error in emergency function:', error);
      Alert.alert('Error', 'Failed to complete emergency procedure');
    } finally {
      setSosSending(false);
      setIsSendingSOS(false);
    }
  };

  const renderContact = ({ item }) => (
    <View style={styles.contactCard}>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactNumber}>{item.number}</Text>
      </View>
      <View style={styles.contactActions}>
        <TouchableOpacity
          onPress={() => handleCallContact(item.number)}
          style={styles.callButton}
        >
          <Text style={styles.callButtonText}>📞</Text>
        </TouchableOpacity>
        {!item.default && (
          <TouchableOpacity
            onPress={() => handleRemoveContact(item.id, item.default)}
            style={styles.removeButton}
          >
            <Text style={styles.removeButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 10 : 60 }]}>
        <Text style={styles.title}>My Profile</Text>
        <Text style={styles.subtitle}>Manage your account and preferences</Text>
        
        <TouchableOpacity 
          style={[
            styles.sosButton, 
            { 
              top: Platform.OS === 'ios' ? 10 : 60,
              right: dimensions.window.width * 0.05
            },
            isSendingSOS && styles.sosButtonActive
          ]}
          onPress={handleSOS}
          disabled={sosSending || isSendingSOS}
        >
          {sosSending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.sosButtonText}>CALL</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.contentContainer}>
          <View style={styles.profileSection}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {auth.currentUser?.displayName?.charAt(0) || 'U'}
              </Text>
            </View>
            <Text style={styles.userName}>{auth.currentUser?.displayName || 'User'}</Text>
            <Text style={styles.userEmail}>{auth.currentUser?.email}</Text>
          </View>
          
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Mindfulness Statistics</Text>
            
            <View style={styles.statsCardsContainer}>
              <View style={styles.statsCard}>
                <View style={styles.statsIconContainer}>
                  <Text style={styles.statsIcon}>🔥</Text>
                </View>
                <View style={styles.statsContent}>
                  <Text style={styles.statsValue}>{userStreak}</Text>
                  <Text style={styles.statsLabel}>Day Streak</Text>
                </View>
              </View>
              
              <View style={styles.statsCard}>
                <View style={styles.statsIconContainer}>
                  <Text style={styles.statsIcon}>✨</Text>
                </View>
                <View style={styles.statsContent}>
                  <Text style={styles.statsValue}>{userPoints}</Text>
                  <Text style={styles.statsLabel}>Mindfulness Points</Text>
                </View>
              </View>
            </View>
            
            <Text style={styles.statsDescription}>
              Continue your mindfulness activities to increase your streak and earn more points!
            </Text>
          </View>
          
          <Text style={styles.sectionTitle}>Mood Tracker</Text>
          <View style={styles.chartContainer}>
            <View style={styles.timeFilterContainer}>
              <TouchableOpacity 
                style={[
                  styles.timeFilterButton, 
                  timePeriod === TIME_PERIODS.CURRENT && styles.activeTimeFilterButton
                ]}
                onPress={() => setTimePeriod(TIME_PERIODS.CURRENT)}
              >
                <Text style={[
                  styles.timeFilterText,
                  timePeriod === TIME_PERIODS.CURRENT && styles.activeTimeFilterText
                ]}>Current</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.timeFilterButton, 
                  timePeriod === TIME_PERIODS.WEEKLY && styles.activeTimeFilterButton
                ]}
                onPress={() => setTimePeriod(TIME_PERIODS.WEEKLY)}
              >
                <Text style={[
                  styles.timeFilterText,
                  timePeriod === TIME_PERIODS.WEEKLY && styles.activeTimeFilterText
                ]}>Weekly</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.timeFilterButton, 
                  timePeriod === TIME_PERIODS.MONTHLY && styles.activeTimeFilterButton
                ]}
                onPress={() => setTimePeriod(TIME_PERIODS.MONTHLY)}
              >
                <Text style={[
                  styles.timeFilterText,
                  timePeriod === TIME_PERIODS.MONTHLY && styles.activeTimeFilterText
                ]}>Monthly</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.chartTitle}>Your Mood Over Time</Text>
            
            {renderChartContent()}
          </View>
          
          <Text style={styles.sectionTitle}>Emergency Support</Text>
          <View style={styles.emergencyContainer}>
            <View style={styles.emergencyHeader}>
              <View style={styles.iconContainer}>
                <Text style={styles.emergencyIcon}>⚠️</Text>
              </View>
              <Text style={styles.emergencyTitle}>Emergency Support</Text>
            </View>
            
            <Text style={styles.emergencySubtitle}>
              If you're experiencing a mental health crisis or need immediate support, you can call your emergency contacts with the CALL button.
            </Text>
            
            <FlatList
              data={contacts}
              keyExtractor={item => item.id}
              renderItem={renderContact}
              scrollEnabled={false}
              contentContainerStyle={styles.contactsList}
            />
            
            {showContactForm ? (
              <View style={styles.formContainer}>
                <TextInput
                  value={newContactName}
                  onChangeText={setNewContactName}
                  placeholder="Contact name"
                  style={styles.input}
                />
                <TextInput
                  value={newContactNumber}
                  onChangeText={setNewContactNumber}
                  placeholder="Phone number"
                  keyboardType="phone-pad"
                  style={styles.input}
                />
                <View style={styles.formButtons}>
                  <TouchableOpacity
                    onPress={handleAddContact}
                    style={styles.saveButton}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setShowContactForm(false);
                      setNewContactName('');
                      setNewContactNumber('');
                    }}
                    style={styles.cancelButton}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setShowContactForm(true)}
                style={styles.addButton}
              >
                <Text style={styles.addButtonText}>+ Add emergency contact</Text>
              </TouchableOpacity>
            )}
            
            <Text style={styles.emergencyFooter}>
              Remember: It's okay to ask for help, and you don't have to face difficult times alone.
            </Text>
          </View>
          
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    backgroundColor: primaryColor,
    padding: '5%',
    paddingTop: Platform.OS === 'ios' ? 50 : 60,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    position: 'relative',
  },
  title: {
    fontSize: Math.min(24, Dimensions.get('window').width * 0.06),
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: Math.min(16, Dimensions.get('window').width * 0.04),
    color: 'white',
    marginTop: 5,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: '5%',
    paddingBottom: '10%',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: '7%',
    marginTop: '3%',
  },
  avatarPlaceholder: {
    width: Dimensions.get('window').width * 0.25,
    height: Dimensions.get('window').width * 0.25,
    borderRadius: Dimensions.get('window').width * 0.125,
    backgroundColor: primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: Dimensions.get('window').width * 0.1,
    color: 'white',
    fontWeight: 'bold',
  },
  userName: {
    fontSize: Math.min(22, Dimensions.get('window').width * 0.055),
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: Math.min(16, Dimensions.get('window').width * 0.04),
    color: '#666',
  },
  sectionTitle: {
    fontSize: Math.min(18, Dimensions.get('window').width * 0.045),
    fontWeight: 'bold',
    marginTop: '5%',
    marginBottom: '2.5%',
    color: '#333',
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  timeFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  timeFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activeTimeFilterButton: {
    backgroundColor: primaryColor + '20',
  },
  timeFilterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTimeFilterText: {
    color: primaryColor,
    fontWeight: 'bold',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    overflow: 'hidden',
    marginHorizontal: -15,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    alignSelf: 'center',
    paddingBottom: 10,
  },
  chartDescription: {
    fontSize: Math.min(12, Dimensions.get('window').width * 0.035),
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 10,
    maxWidth: '90%',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 15,
  },
  signOutButton: {
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  signOutText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emergencyContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e53935',
  },
  emergencySubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  iconContainer: {
    marginRight: 10,
  },
  emergencyIcon: {
    fontSize: 22,
  },
  contactsList: {
    marginBottom: 12,
  },
  contactCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  contactNumber: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callButton: {
    marginLeft: 10,
  },
  callButtonText: {
    fontSize: 18,
  },
  removeButton: {
    marginLeft: 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#e53935',
    fontSize: 12,
    fontWeight: 'bold',
  },
  formContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    fontSize: 14,
    backgroundColor: 'white',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    backgroundColor: primaryColor,
    padding: 10,
    borderRadius: 6,
    flex: 1,
    marginRight: 6,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 6,
    flex: 1,
    marginLeft: 6,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  addButtonText: {
    color: primaryColor,
    fontSize: 14,
    fontWeight: '500',
  },
  emergencyFooter: {
    fontStyle: 'italic',
    textAlign: 'center',
    color: '#666',
    marginTop: 12,
    fontSize: 12,
  },
  sosButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 60,
    right: '5%',
    backgroundColor: '#f44336',
    width: Dimensions.get('window').width * 0.12,
    height: Dimensions.get('window').width * 0.12,
    minWidth: 40,
    minHeight: 40,
    maxWidth: 60,
    maxHeight: 60,
    borderRadius: Dimensions.get('window').width * 0.06,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 100,
  },
  sosButtonActive: {
    backgroundColor: '#d32f2f',
  },
  sosButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: Math.min(16, Dimensions.get('window').width * 0.04),
  },
  statsContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  statsCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 15,
    flex: 0.48,
    shadowColor: '#9370DB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statsIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(147, 112, 219, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statsIcon: {
    fontSize: 22,
  },
  statsContent: {
    flex: 1,
  },
  statsValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  statsLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statsDescription: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default ProfileScreen;