import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ScrollView, Dimensions, ActivityIndicator, TextInput, FlatList, Linking, Platform, SafeAreaView } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { ref, onValue, query, orderByChild, limitToLast, push, set, update, remove, off } from 'firebase/database';
import { LineChart } from 'react-native-chart-kit';

// Get screen dimensions
const { width: initialWidth, height: initialHeight } = Dimensions.get('window');
const primaryColor = '#9370DB'; // Match the app theme

// Time period options
const TIME_PERIODS = {
  CURRENT: 'current',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly'
};

// Default emergency contacts
const defaultContacts = [
  { id: 'crisis-hotline', name: 'Crisis Hotline', number: '988', default: true },
  { id: 'text-support', name: 'Text Support', number: '741741', default: true }
];

const ProfileScreen = () => {
  const [loading, setLoading] = useState(true);
  const [moodHistory, setMoodHistory] = useState([]);
  const [timePeriod, setTimePeriod] = useState(TIME_PERIODS.CURRENT);
  const [sosSending, setSosSending] = useState(false);
  
  // Add responsive dimensions state
  const [dimensions, setDimensions] = useState({ 
    window: { width: initialWidth, height: initialHeight },
    screen: Dimensions.get('screen')
  });
  
  // Emergency support states
  const [contacts, setContacts] = useState([]);
  const [newContactName, setNewContactName] = useState('');
  const [newContactNumber, setNewContactNumber] = useState('');
  const [showContactForm, setShowContactForm] = useState(false);
  
  // Add event listener for screen dimension changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window, screen }) => {
      setDimensions({ window, screen });
    });
    
    return () => subscription?.remove();
  }, []);
  
  // Load mood history when component mounts
  useEffect(() => {
    loadMoodHistory();
  }, []);
  
  // Load emergency contacts
  useEffect(() => {
    if (!auth.currentUser) return;
    
    // Load user's emergency contacts
    const contactsRef = ref(db, `users/${auth.currentUser.uid}/emergencyContacts`);
    const listener = onValue(contactsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userContacts = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
          default: false
        }));
        
        // Combine default contacts with user contacts
        setContacts([...defaultContacts, ...userContacts]);
      } else {
        setContacts(defaultContacts);
      }
    });

    return () => {
      off(contactsRef, 'value', listener);
    };
  }, []);
  
  // Load mood history from Firebase
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
  
  // Convert sentiment to numerical value for chart
  const getSentimentValue = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 1;
      case 'negative': return -1;
      case 'neutral': return 0;
      default: return 0;
    }
  };
  
  // Format date for chart labels
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };
  
  // Prepare chart data
  const prepareChartData = () => {
    switch(timePeriod) {
      case TIME_PERIODS.CURRENT:
        return {
          labels: moodHistory.map(mood => formatDate(mood.timestamp)),
          datasets: [
            {
              data: moodHistory.map(mood => getSentimentValue(mood.sentiment)),
              color: (opacity = 1) => primaryColor,
              strokeWidth: 2
            }
          ],
          legend: ["Mood"]
        };
      case TIME_PERIODS.WEEKLY:
        // Placeholder for weekly data (empty chart)
        return {
          labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          datasets: [
            {
              data: [0, 0, 0, 0, 0, 0, 0],
              color: (opacity = 1) => primaryColor,
              strokeWidth: 2
            }
          ],
          legend: ["Weekly Mood"]
        };
      case TIME_PERIODS.MONTHLY:
        // Placeholder for monthly data (empty chart)
        return {
          labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
          datasets: [
            {
              data: [0, 0, 0, 0],
              color: (opacity = 1) => primaryColor,
              strokeWidth: 2
            }
          ],
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
      r: "5",
      strokeWidth: "2",
      stroke: primaryColor
    },
    propsForLabels: {
      fontSize: 8,
      fontWeight: '400',
      textLength: 4,
      ellipsizeMode: 'clip'
    },
    propsForBackgroundLines: {
      strokeDasharray: ""
    },
    formatYLabel: (value) => {
      if (value === 1) return "1";
      if (value === 0) return "0";
      if (value === -1) return "-1";
      return "";
    },
    horizontalLabelRotation: 45,
    verticalLabelRotation: 0,
    formatXLabel: (label) => {
      if (label && label.length > 5) {
        return label.substring(0, 5);
      }
      return label;
    }
  };
  
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  // Emergency Support Functions
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
    // Don't allow removing default contacts
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
  
  // SOS Function to send emergency messages
  const handleSOS = () => {
    if (contacts.length === 0) {
      Alert.alert('No Contacts', 'Please add emergency contacts first');
      return;
    }
    
    Alert.alert(
      'Send SOS',
      'Are you sure you want to send an emergency message to all your contacts?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: () => sendEmergencyMessages(),
        },
      ],
      { cancelable: true }
    );
  };
  
  const sendEmergencyMessages = async () => {
    const username = auth.currentUser?.displayName || 'User';
    const emergencyMessage = `EMERGENCY ALERT: ${username} needs immediate help. This is an automated emergency message from MindMate.`;
    
    setSosSending(true);
    
    try {
      // Log SOS event to database
      if (auth.currentUser) {
        const sosRef = ref(db, `users/${auth.currentUser.uid}/sosHistory`);
        const newSosRef = push(sosRef);
        await set(newSosRef, {
          timestamp: Date.now(),
          messageSent: emergencyMessage,
          contactsNotified: contacts.map(c => c.name)
        });
      }
      
      // Send messages to each contact
      let messagesSent = 0;
      
      for (const contact of contacts) {
        try {
          if (Platform.OS === 'android') {
            // For Android
            await Linking.openURL(`sms:${contact.number}?body=${encodeURIComponent(emergencyMessage)}`);
          } else {
            // For iOS
            await Linking.openURL(`sms:${contact.number}&body=${encodeURIComponent(emergencyMessage)}`);
          }
          messagesSent++;
          
          // Small delay between messages
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (err) {
          console.error(`Failed to send message to ${contact.name}:`, err);
        }
      }
      
      // Attempt to call first contact in the list if any exist
      if (contacts.length > 0) {
        try {
          await Linking.openURL(`tel:${contacts[0].number}`);
        } catch (err) {
          console.error('Failed to initiate call:', err);
        }
      }
      
      Alert.alert(
        'SOS Sent',
        `Emergency messages sent to ${messagesSent} contacts.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error in SOS function:', error);
      Alert.alert('Error', 'Failed to send emergency messages');
    } finally {
      setSosSending(false);
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

  const renderChartContent = () => {
    // Calculate responsive chart dimensions based on screen size
    const containerPadding = 40; // Increase padding to prevent overflow
    const chartWidth = Math.min(dimensions.window.width - containerPadding, 500);
    const chartHeight = Math.min(180, dimensions.window.height * 0.25); // Slightly smaller height
    
    // Add increased padding for chart
    const chartStyle = {
      ...styles.chart,
      paddingRight: 10, // Extra padding on the right
      marginLeft: -10 // Offset a bit to the left
    };
    
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
    
    // Create chart component with proper configuration
    const renderChart = (data) => (
      <LineChart
        data={data}
        width={chartWidth}
        height={chartHeight}
        chartConfig={{
          ...chartConfig,
          // Adjust label rotation based on screen width
          horizontalLabelRotation: dimensions.window.width < 350 ? 60 : 45,
          // Hide some labels if there are too many
          skipLabels: dimensions.window.width < 350 ? 1 : 0
        }}
        withHorizontalLines={true}
        withVerticalLines={false} // Remove vertical grid lines for clarity
        withDots={true}
        withShadow={false}
        bezier
        style={chartStyle}
        withInnerLines={false} // Simplify chart
        fromZero
        segments={3} // Fewer Y-axis segments
      />
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 10 : 60 }]}>
        <Text style={styles.title}>My Profile</Text>
        <Text style={styles.subtitle}>Manage your account and preferences</Text>
        
        {/* SOS Button */}
        <TouchableOpacity 
          style={[
            styles.sosButton, 
            { 
              top: Platform.OS === 'ios' ? 10 : 60,
              right: dimensions.window.width * 0.05
            }
          ]}
          onPress={handleSOS}
          disabled={sosSending}
        >
          {sosSending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.sosButtonText}>SOS</Text>
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
          
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <View style={styles.placeholderBox}>
            <Text style={styles.placeholderText}>
              Account settings will be implemented here.
            </Text>
          </View>
          
          <Text style={styles.sectionTitle}>Wellness Progress</Text>
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
          
          {/* Emergency Support Section */}
          <Text style={styles.sectionTitle}>Emergency Support</Text>
          <View style={styles.emergencyContainer}>
            <View style={styles.emergencyHeader}>
              <View style={styles.iconContainer}>
                <Text style={styles.emergencyIcon}>⚠️</Text>
              </View>
              <Text style={styles.emergencyTitle}>Emergency Support</Text>
            </View>
            
            <Text style={styles.emergencySubtitle}>
              If you're experiencing a mental health crisis or need immediate support, please don't hesitate to reach out:
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
          
          <Text style={styles.sectionTitle}>Notification Preferences</Text>
          <View style={styles.placeholderBox}>
            <Text style={styles.placeholderText}>
              Notification settings will be displayed in this section.
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
    position: 'relative', // For positioning SOS button
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
  placeholderBox: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  placeholderText: {
    color: '#666',
    textAlign: 'center',
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
    backgroundColor: primaryColor + '20', // 20% opacity
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
    overflow: 'hidden', // Prevent chart from overflowing
    marginHorizontal: -15, // Negative margin to allow for slightly wider chart
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    alignSelf: 'center',
    paddingBottom: 10, // Additional padding at bottom for labels
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
  // Emergency Support Styles
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
  // SOS Button styles
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
  sosButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: Math.min(16, Dimensions.get('window').width * 0.04),
  },
});

export default ProfileScreen;