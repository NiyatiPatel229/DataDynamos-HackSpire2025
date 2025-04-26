import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, Alert } from 'react-native';
import { AntDesign, FontAwesome5, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { auth, db } from './firebase';
import { ref, onValue, update, serverTimestamp, get } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';

// Dataset for mindfulness activities based on mood
const mindfulnessActivities = {
  happy: [
    {
      title: "Gratitude Garden",
      description: "Plant virtual seeds by listing things you're grateful for. Watch your garden grow as you add more items daily.",
      points: 50,
      duration: "5 min",
      icon: "leaf",
      iconType: "font-awesome"
    },
    {
      title: "Joy Journaling",
      description: "Document moments that brought you joy today. Earn badges for consistency.",
      points: 30,
      duration: "10 min",
      icon: "book-open",
      iconType: "feather"
    },
    {
      title: "Mindful Photography",
      description: "Take 5 photos of beautiful things around you. Share and earn community points.",
      points: 60,
      duration: "15 min",
      icon: "camera",
      iconType: "feather"
    }
  ],
  sad: [
    {
      title: "Mood Elevator",
      description: "Follow guided exercises that gradually lift your mood, level by level.",
      points: 40,
      duration: "8 min",
      icon: "arrow-up-circle",
      iconType: "feather"
    },
    {
      title: "Comfort Quest",
      description: "Find and interact with 5 items that bring you comfort. Document your discoveries.",
      points: 50,
      duration: "10 min",
      icon: "coffee",
      iconType: "feather"
    },
    {
      title: "Hope Horizon",
      description: "Visualize stepping stones to feeling better, earning perspective points.",
      points: 60,
      duration: "12 min",
      icon: "sun",
      iconType: "feather"
    }
  ],
  energetic: [
    {
      title: "Motion Mission",
      description: "Complete 3 quick high-energy movement challenges to channel your energy.",
      points: 70,
      duration: "15 min",
      icon: "running",
      iconType: "font-awesome-5"
    },
    {
      title: "Creative Burst",
      description: "Use your energy for a timed creative challenge - draw, write or build something.",
      points: 50,
      duration: "20 min",
      icon: "palette",
      iconType: "ionicon"
    },
    {
      title: "Energy Flow",
      description: "Follow a guided visualization to direct your energy positively.",
      points: 40,
      duration: "10 min",
      icon: "flash",
      iconType: "ionicon"
    }
  ],
  relaxed: [
    {
      title: "Serenity Stretch",
      description: "Follow gentle stretches that enhance your relaxed state. Earn flexibility points.",
      points: 30,
      duration: "7 min",
      icon: "yoga",
      iconType: "material-community"
    },
    {
      title: "Present Moment Scavenger Hunt",
      description: "Find and observe objects with all your senses to deepen relaxation.",
      points: 40,
      duration: "10 min",
      icon: "magnify",
      iconType: "material-community"
    },
    {
      title: "Calm Continuation",
      description: "Learn techniques to extend your relaxed state through daily activities.",
      points: 35,
      duration: "5 min",
      icon: "weather-sunset",
      iconType: "material-community"
    }
  ],
  anxious: [
    {
      title: "Worry Warrior",
      description: "Battle anxious thoughts through an interactive game that challenges your fears.",
      points: 80,
      duration: "15 min",
      icon: "shield",
      iconType: "font-awesome-5"
    },
    {
      title: "Breath Quest",
      description: "Level up your breathing skills with guided exercises that get progressively more calming.",
      points: 50,
      duration: "8 min",
      icon: "lungs",
      iconType: "font-awesome-5"
    },
    {
      title: "Grounding 5-4-3-2-1",
      description: "Find 5 things you see, 4 you can touch, 3 you hear, 2 you smell, and 1 you taste.",
      points: 60,
      duration: "10 min",
      icon: "hand-paper",
      iconType: "font-awesome-5"
    }
  ],
  romantic: [
    {
      title: "Appreciation Artistry",
      description: "Create something that expresses appreciation for someone special in your life.",
      points: 50,
      duration: "15 min",
      icon: "heart",
      iconType: "ant-design"
    },
    {
      title: "Connection Reflection",
      description: "Mindfully reflect on meaningful relationships and what they bring to your life.",
      points: 40,
      duration: "10 min",
      icon: "team",
      iconType: "ant-design"
    },
    {
      title: "Self-Love Sanctuary",
      description: "Build a virtual sanctuary filled with self-compassion practices.",
      points: 60,
      duration: "12 min",
      icon: "spa",
      iconType: "ionicon"
    }
  ],
  focused: [
    {
      title: "Focus Fortress",
      description: "Build a mental fortress by eliminating distractions one by one. Earn concentration points.",
      points: 70,
      duration: "20 min",
      icon: "fort-awesome",
      iconType: "font-awesome-5"
    },
    {
      title: "Task Mastery",
      description: "Break down one challenging task into manageable steps, with rewards for each completion.",
      points: 60,
      duration: "15 min",
      icon: "tasks",
      iconType: "font-awesome-5"
    },
    {
      title: "Mind Mapping Challenge",
      description: "Create an expanding mind map around a central goal or challenge.",
      points: 50,
      duration: "10 min",
      icon: "sitemap",
      iconType: "font-awesome"
    }
  ],
  nostalgic: [
    {
      title: "Memory Lane Expedition",
      description: "Navigate through positive memories, collecting tokens of wisdom from your past.",
      points: 45,
      duration: "15 min",
      icon: "history",
      iconType: "font-awesome"
    },
    {
      title: "Nostalgia Playlist",
      description: "Create a playlist of songs from meaningful times and mindfully listen to one.",
      points: 30,
      duration: "10 min",
      icon: "music",
      iconType: "font-awesome"
    },
    {
      title: "Wisdom Collection",
      description: "Identify lessons from past experiences that can help you today.",
      points: 60,
      duration: "12 min",
      icon: "graduation-cap",
      iconType: "font-awesome"
    }
  ],
  angry: [
    {
      title: "Anger Alchemist",
      description: "Transform anger energy into constructive action through guided visualization.",
      points: 80,
      duration: "12 min",
      icon: "fire-alt",
      iconType: "font-awesome-5"
    },
    {
      title: "Cooling Stream",
      description: "Follow a progressive relaxation journey that cools heated emotions.",
      points: 60,
      duration: "10 min",
      icon: "tint",
      iconType: "font-awesome-5"
    },
    {
      title: "Expression Quest",
      description: "Find healthy ways to express your feelings through art, movement or writing.",
      points: 70,
      duration: "15 min",
      icon: "pencil-alt",
      iconType: "font-awesome-5"
    }
  ],
  inspired: [
    {
      title: "Vision Voyage",
      description: "Chart a course for your inspiration, mapping steps to bring your ideas to life.",
      points: 70,
      duration: "15 min",
      icon: "map",
      iconType: "font-awesome"
    },
    {
      title: "Inspiration Implementation",
      description: "Take one inspired idea and create an action plan, earning planning points.",
      points: 60,
      duration: "12 min",
      icon: "lightbulb",
      iconType: "font-awesome-5"
    },
    {
      title: "Creative Connections",
      description: "Find unexpected connections between your inspiration and other areas of life.",
      points: 50,
      duration: "10 min",
      icon: "link",
      iconType: "font-awesome"
    }
  ]
};

const MindfulActivitiesComponent = ({ selectedMood }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [userStreak, setUserStreak] = useState(0);
    const [userPoints, setUserPoints] = useState(0);
    const [userId, setUserId] = useState(null);
    const [activityStarted, setActivityStarted] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [lastCompletedDate, setLastCompletedDate] = useState(null);
    
    const timerRef = useRef(null);
    const startTimeRef = useRef(null);
    const requiredDurationRef = useRef(null);
    
    // Get activities based on current mood
    const activities = mindfulnessActivities[selectedMood] || mindfulnessActivities.relaxed;
    
    // Check authentication state and load user data
    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setUserId(user.uid);
          // Load user data from Firebase
          loadUserData(user.uid);
        } else {
          setUserId(null);
          setUserStreak(0);
          setUserPoints(0);
          setLastCompletedDate(null);
        }
      });
      
      return () => unsubscribe();
    }, []);
  
    // Load user data from Firebase
    const loadUserData = (uid) => {
      const userRef = ref(db, `users/${uid}`);
      onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.val();
          setUserStreak(userData.streak || 0);
          setUserPoints(userData.points || 0);
          setLastCompletedDate(userData.lastCompletedDate || null);
        } else {
          // Create initial user data if it doesn't exist
          update(userRef, {
            streak: 0,
            points: 0,
            lastCompletedDate: null,
            createdAt: serverTimestamp()
          });
        }
      });
    };
  
    // Handle activity selection
    const handleActivitySelect = (activity) => {
      setSelectedActivity(activity);
      setModalVisible(true);
      setActivityStarted(false);
      setTimeRemaining(activity.durationInSeconds || 300); // Default to 5 minutes if not specified
    };
  
    // Start the activity and timer
    const startActivity = () => {
      if (!userId) {
        Alert.alert("Login Required", "Please log in to track your progress.");
        return;
      }
      
      setActivityStarted(true);
      startTimeRef.current = Date.now();
      requiredDurationRef.current = selectedActivity.durationInSeconds || 300;
      
      // Set up timer to update countdown
      timerRef.current = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const remaining = requiredDurationRef.current - elapsedSeconds;
        
        if (remaining <= 0) {
          clearInterval(timerRef.current);
          setTimeRemaining(0);
          completeActivity(true);
        } else {
          setTimeRemaining(remaining);
        }
      }, 1000);
    };
  
    // Complete or stop activity
    const completeActivity = (completed = false) => {
      clearInterval(timerRef.current);
      
      if (!userId) return;
      
      if (completed || (startTimeRef.current && 
          (Date.now() - startTimeRef.current) / 1000 >= requiredDurationRef.current)) {
        // Activity was completed fully - award points and update streak
        const userRef = ref(db, `users/${userId}`);
        
        // Get current user data to check streak
        get(userRef).then((snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.val();
            const today = new Date().toDateString();
            const lastCompleted = userData.lastCompletedDate ? 
                                 new Date(userData.lastCompletedDate).toDateString() : null;
            
            // Check if streak should increment (different day than last completion)
            let newStreak = userData.streak || 0;
            if (lastCompleted !== today) {
              // Check if streak continues or resets
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              const yesterdayString = yesterday.toDateString();
              
              if (lastCompleted === yesterdayString) {
                // Streak continues
                newStreak += 1;
              } else if (lastCompleted !== today) {
                // Streak resets if not yesterday and not today
                newStreak = 1;
              }
            }
            
            // Update user data
            update(userRef, {
              points: (userData.points || 0) + selectedActivity.points,
              streak: newStreak,
              lastCompletedDate: today,
              lastActivityCompleted: {
                title: selectedActivity.title,
                points: selectedActivity.points,
                completedAt: serverTimestamp()
              }
            });
            
            // Update local state
            setUserPoints((userData.points || 0) + selectedActivity.points);
            setUserStreak(newStreak);
            setLastCompletedDate(today);
            
            // Log activity completion
            const activityLogRef = ref(db, `users/${userId}/activityLog/${Date.now()}`);
            update(activityLogRef, {
              activityTitle: selectedActivity.title,
              mood: selectedMood,
              points: selectedActivity.points,
              completedAt: serverTimestamp()
            });
            
            // Show success message
            Alert.alert(
              "Activity Completed!", 
              `Congratulations! You've earned ${selectedActivity.points} points.`
            );
          }
        });
      } else {
        // Activity was stopped early - no points
        Alert.alert(
          "Activity Incomplete", 
          "You need to complete the full duration to earn points."
        );
      }
      
      setActivityStarted(false);
      setModalVisible(false);
    };
  
    // Clean up timer on unmount
    useEffect(() => {
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }, []);
  
    // Format time remaining as mm:ss
    const formatTimeRemaining = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };
  
    // Function to render the appropriate icon
    const renderIcon = (iconName, iconType) => {
      switch(iconType) {
        case 'ant-design':
          return <AntDesign name={iconName} size={24} color="#6200ee" />;
        case 'font-awesome-5':
        case 'font-awesome':
          return <FontAwesome5 name={iconName} size={24} color="#6200ee" />;
        case 'material-community':
          return <MaterialCommunityIcons name={iconName} size={24} color="#6200ee" />;
        case 'ionicon':
          return <Ionicons name={iconName} size={24} color="#6200ee" />;
        default:
          return <AntDesign name="questioncircle" size={24} color="#6200ee" />;
      }
    };
  
    return (
      <View style={styles.container}>
        {/* User Progress Section */}
        <View style={styles.progressContainer}>
          <View style={styles.progressItem}>
            <Text style={styles.progressLabel}>Daily Streak</Text>
            <View style={styles.streakContainer}>
              <FontAwesome5 name="fire" size={24} color="#FF9500" />
              <Text style={styles.streakText}>{userStreak} days</Text>
            </View>
          </View>
          <View style={styles.progressItem}>
            <Text style={styles.progressLabel}>Mindfulness Points</Text>
            <View style={styles.pointsContainer}>
              <FontAwesome5 name="star" size={24} color="#FFD700" />
              <Text style={styles.pointsText}>{userPoints}</Text>
            </View>
          </View>
        </View>
        
        {/* Activities List */}
        {activities.map((activity, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.activityCard}
            onPress={() => handleActivitySelect(activity)}
          >
            <View style={styles.activityIconContainer}>
              {renderIcon(activity.icon, activity.iconType)}
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              <Text style={styles.activityDescription} numberOfLines={2}>
                {activity.description}
              </Text>
              <View style={styles.activityMeta}>
                <View style={styles.metaItem}>
                  <FontAwesome5 name="clock" size={12} color="#6200ee" />
                  <Text style={styles.metaText}>{activity.duration}</Text>
                </View>
                <View style={styles.metaItem}>
                  <FontAwesome5 name="star" size={12} color="#6200ee" />
                  <Text style={styles.metaText}>{activity.points} pts</Text>
                </View>
              </View>
            </View>
            <AntDesign name="right" size={16} color="#6200ee" style={styles.arrowIcon} />
          </TouchableOpacity>
        ))}
        
        {/* Activity Detail Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            if (activityStarted) {
              Alert.alert(
                "Stop Activity?",
                "You won't receive points if you stop now.",
                [
                  { text: "Continue", style: "cancel" },
                  { text: "Stop", onPress: () => completeActivity(false) }
                ]
              );
            } else {
              setModalVisible(false);
            }
          }}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {selectedActivity && (
                <>
                  <View style={styles.modalHeader}>
                    {!activityStarted && (
                      <TouchableOpacity 
                        style={styles.closeButton}
                        onPress={() => setModalVisible(false)}
                      >
                        <AntDesign name="close" size={24} color="#333" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.modalIconContainer}>
                    {selectedActivity.iconType && renderIcon(selectedActivity.icon, selectedActivity.iconType)}
                  </View>
                  <Text style={styles.modalTitle}>{selectedActivity.title}</Text>
                  
                  {activityStarted ? (
                    <View style={styles.timerContainer}>
                      <Text style={styles.timerLabel}>Time Remaining</Text>
                      <Text style={styles.timerText}>{formatTimeRemaining(timeRemaining)}</Text>
                      <Text style={styles.modalDescription}>Keep going! You're doing great.</Text>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.modalDescription}>{selectedActivity.description}</Text>
                      
                      <View style={styles.modalMeta}>
                        <View style={styles.modalMetaItem}>
                          <FontAwesome5 name="clock" size={16} color="#6200ee" />
                          <Text style={styles.modalMetaText}>{selectedActivity.duration}</Text>
                        </View>
                        <View style={styles.modalMetaItem}>
                          <FontAwesome5 name="star" size={16} color="#6200ee" />
                          <Text style={styles.modalMetaText}>{selectedActivity.points} points</Text>
                        </View>
                      </View>
                      
                      <View style={styles.modalInstructions}>
                        <Text style={styles.instructionsTitle}>How it works:</Text>
                        <Text style={styles.instructionsText}>
                          1. Find a quiet and comfortable space
                        </Text>
                        <Text style={styles.instructionsText}>
                          2. Follow the guided instructions at your own pace
                        </Text>
                        <Text style={styles.instructionsText}>
                          3. Complete the full duration to earn points
                        </Text>
                      </View>
                    </>
                  )}
                  
                  {activityStarted ? (
                    <TouchableOpacity 
                      style={[styles.startButton, { backgroundColor: '#e53935' }]}
                      onPress={() => {
                        Alert.alert(
                          "Stop Activity?",
                          "You won't receive points if you stop now.",
                          [
                            { text: "Continue", style: "cancel" },
                            { text: "Stop", onPress: () => completeActivity(false) }
                          ]
                        );
                      }}
                    >
                      <Text style={styles.startButtonText}>Stop Activity</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={styles.startButton}
                      onPress={startActivity}
                    >
                      <Text style={styles.startButtonText}>Start Activity</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </View>
        </Modal>
      </View>
    );
  };
  
  const styles = StyleSheet.create({
    container: {
      marginBottom: 20,
    },
    progressContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 15,
      backgroundColor: 'white',
      borderRadius: 10,
      padding: 15,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    progressItem: {
      alignItems: 'center',
    },
    progressLabel: {
      fontSize: 12,
      color: '#666',
      marginBottom: 5,
    },
    streakContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    streakText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333',
      marginLeft: 5,
    },
    pointsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    pointsText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333',
      marginLeft: 5,
    },
    activityCard: {
      flexDirection: 'row',
      backgroundColor: 'white',
      borderRadius: 10,
      padding: 15,
      marginBottom: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      alignItems: 'center',
    },
    activityIconContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: '#f0e6ff',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15,
    },
    activityContent: {
      flex: 1,
    },
    activityTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 4,
    },
    activityDescription: {
      fontSize: 13,
      color: '#666',
      marginBottom: 6,
    },
    activityMeta: {
      flexDirection: 'row',
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 12,
    },
    metaText: {
      fontSize: 12,
      color: '#6200ee',
      marginLeft: 4,
    },
    arrowIcon: {
      marginLeft: 10,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      width: '90%',
      backgroundColor: 'white',
      borderRadius: 20,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    modalHeader: {
      alignItems: 'flex-end',
      marginBottom: 10,
    },
    closeButton: {
      padding: 5,
    },
    modalIconContainer: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: '#f0e6ff',
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      marginBottom: 15,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#333',
      textAlign: 'center',
      marginBottom: 10,
    },
    modalDescription: {
      fontSize: 16,
      color: '#444',
      textAlign: 'center',
      marginBottom: 20,
      lineHeight: 22,
    },
    modalMeta: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 20,
    },
    modalMetaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 10,
    },
    modalMetaText: {
      fontSize: 14,
      color: '#6200ee',
      marginLeft: 5,
      fontWeight: '500',
    },
    modalInstructions: {
      backgroundColor: '#f8f8f8',
      borderRadius: 10,
      padding: 15,
      marginBottom: 20,
    },
    instructionsTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 10,
    },
    instructionsText: {
      fontSize: 14,
      color: '#444',
      marginBottom: 5,
      lineHeight: 20,
    },
    startButton: {
      backgroundColor: '#6200ee',
      borderRadius: 10,
      padding: 15,
      alignItems: 'center',
    },
    startButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
    },
    timerContainer: {
      alignItems: 'center',
      marginBottom: 20,
    },
    timerLabel: {
      fontSize: 14,
      color: '#666',
      marginBottom: 5,
    },
    timerText: {
      fontSize: 36,
      fontWeight: 'bold',
      color: '#6200ee',
      marginBottom: 10,
    },
  });
  
  export default MindfulActivitiesComponent;