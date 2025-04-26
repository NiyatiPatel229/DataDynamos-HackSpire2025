import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, Alert, Image, ScrollView, Dimensions } from 'react-native';
import { AntDesign, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { auth, db } from './firebase';
import { ref, onValue, update, serverTimestamp, get } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

// Dataset for yoga poses focused on stress reduction
const yogaPoses = [
  {
    id: 'child-pose',
    name: 'Child\'s Pose',
    sanskritName: 'Balasana',
    description: 'A restful pose that gently stretches your lower back, hips, thighs, and ankles while relieving stress and fatigue.',
    benefits: [
      'Calms the brain and helps relieve stress',
      'Gently stretches the lower back',
      'Relieves shoulder and neck tension'
    ],
    duration: '3 min',
    durationInSeconds: 180,
    difficulty: 'Beginner',
    targetAreas: ['Back', 'Hips', 'Shoulders'],
    points: 35,
    // Replace with your actual image paths
    imagePath: require('./assets/yoga/child-pose.png')
  },
  {
    id: 'corpse-pose',
    name: 'Corpse Pose',
    sanskritName: 'Savasana',
    description: 'A pose of total relaxation, making it one of the most challenging asanas due to the difficulty in completely letting go.',
    benefits: [
      'Calms central nervous system',
      'Relaxes the entire body',
      'Reduces stress and improves concentration'
    ],
    duration: '5 min',
    durationInSeconds: 300,
    difficulty: 'Beginner',
    targetAreas: ['Full Body', 'Mind'],
    points: 30,
    imagePath: require('./assets/yoga/corpse-pose.png')
  },
  {
    id: 'legs-up-wall',
    name: 'Legs Up The Wall',
    sanskritName: 'Viparita Karani',
    description: 'A restorative pose that allows gravity to help blood flow back to the heart, reducing swelling and fatigue in the legs.',
    benefits: [
      'Relieves tired or cramped legs and feet',
      'Gently stretches the hamstrings',
      'Reduces anxiety and calms the mind'
    ],
    duration: '7 min',
    durationInSeconds: 420,
    difficulty: 'Beginner',
    targetAreas: ['Legs', 'Mind', 'Circulation'],
    points: 45,
    imagePath: require('./assets/yoga/legs-up-wall.png')
  },
  {
    id: 'cat-cow',
    name: 'Cat-Cow Stretch',
    sanskritName: 'Marjaryasana-Bitilasana',
    description: 'A gentle flow between two poses that warms the body and brings flexibility to the spine while relieving stress.',
    benefits: [
      'Improves posture and balance',
      'Stretches the spine and torso',
      'Calms the mind and relieves stress'
    ],
    duration: '4 min',
    durationInSeconds: 240,
    difficulty: 'Beginner',
    targetAreas: ['Spine', 'Back', 'Neck'],
    points: 40,
    imagePath: require('./assets/yoga/cat-cow.png')
  }
];

// Dataset for mindfulness activities based on mood
const mindfulnessActivities = {
    happy: [
      {
        title: "Gratitude Garden",
        description: "Plant virtual seeds by listing things you're grateful for. Watch your garden grow as you add more items daily.",
        points: 50,
        duration: "5 min",
        durationInSeconds: 300,
        icon: "leaf",
        iconType: "font-awesome"
      },
      {
        title: "Joy Journaling",
        description: "Document moments that brought you joy today. Earn badges for consistency.",
        points: 30,
        duration: "10 min",
        durationInSeconds: 600,
        icon: "book-open",
        iconType: "feather"
      },
      {
        title: "Mindful Photography",
        description: "Take 5 photos of beautiful things around you. Share and earn community points.",
        points: 60,
        duration: "15 min",
        durationInSeconds: 900,
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
        durationInSeconds: 480,
        icon: "arrow-up-circle",
        iconType: "feather"
      },
      {
        title: "Comfort Quest",
        description: "Find and interact with 5 items that bring you comfort. Document your discoveries.",
        points: 50,
        duration: "10 min",
        durationInSeconds: 600,
        icon: "coffee",
        iconType: "feather"
      },
      {
        title: "Hope Horizon",
        description: "Visualize stepping stones to feeling better, earning perspective points.",
        points: 60,
        duration: "12 min",
        durationInSeconds: 720,
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
        durationInSeconds: 900,
        icon: "running",
        iconType: "font-awesome-5"
      },
      {
        title: "Creative Burst",
        description: "Use your energy for a timed creative challenge - draw, write or build something.",
        points: 50,
        duration: "20 min",
        durationInSeconds: 1200,
        icon: "palette",
        iconType: "ionicon"
      },
      {
        title: "Energy Flow",
        description: "Follow a guided visualization to direct your energy positively.",
        points: 40,
        duration: "10 min",
        durationInSeconds: 600,
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
        durationInSeconds: 420,
        icon: "yoga",
        iconType: "material-community"
      },
      {
        title: "Present Moment Scavenger Hunt",
        description: "Find and observe objects with all your senses to deepen relaxation.",
        points: 40,
        duration: "10 min",
        durationInSeconds: 600,
        icon: "magnify",
        iconType: "material-community"
      },
      {
        title: "Calm Continuation",
        description: "Learn techniques to extend your relaxed state through daily activities.",
        points: 35,
        duration: "5 min",
        durationInSeconds: 300,
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
        durationInSeconds: 900,
        icon: "shield",
        iconType: "font-awesome-5"
      },
      {
        title: "Breath Quest",
        description: "Level up your breathing skills with guided exercises that get progressively more calming.",
        points: 50,
        duration: "8 min",
        durationInSeconds: 480,
        icon: "lungs",
        iconType: "font-awesome-5"
      },
      {
        title: "Grounding 5-4-3-2-1",
        description: "Find 5 things you see, 4 you can touch, 3 you hear, 2 you smell, and 1 you taste.",
        points: 60,
        duration: "10 min",
        durationInSeconds: 600,
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
        durationInSeconds: 900,
        icon: "heart",
        iconType: "ant-design"
      },
      {
        title: "Connection Reflection",
        description: "Mindfully reflect on meaningful relationships and what they bring to your life.",
        points: 40,
        duration: "10 min",
        durationInSeconds: 600,
        icon: "team",
        iconType: "ant-design"
      },
      {
        title: "Self-Love Sanctuary",
        description: "Build a virtual sanctuary filled with self-compassion practices.",
        points: 60,
        duration: "12 min",
        durationInSeconds: 720,
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
        durationInSeconds: 1200,
        icon: "fort-awesome",
        iconType: "font-awesome-5"
      },
      {
        title: "Task Mastery",
        description: "Break down one challenging task into manageable steps, with rewards for each completion.",
        points: 60,
        duration: "15 min",
        durationInSeconds: 900,
        icon: "tasks",
        iconType: "font-awesome-5"
      },
      {
        title: "Mind Mapping Challenge",
        description: "Create an expanding mind map around a central goal or challenge.",
        points: 50,
        duration: "10 min",
        durationInSeconds: 600,
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
        durationInSeconds: 900,
        icon: "history",
        iconType: "font-awesome"
      },
      {
        title: "Nostalgia Playlist",
        description: "Create a playlist of songs from meaningful times and mindfully listen to one.",
        points: 30,
        duration: "10 min",
        durationInSeconds: 600,
        icon: "music",
        iconType: "font-awesome"
      },
      {
        title: "Wisdom Collection",
        description: "Identify lessons from past experiences that can help you today.",
        points: 60,
        duration: "12 min",
        durationInSeconds: 720,
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
        durationInSeconds: 720,
        icon: "fire-alt",
        iconType: "font-awesome-5"
      },
      {
        title: "Cooling Stream",
        description: "Follow a progressive relaxation journey that cools heated emotions.",
        points: 60,
        duration: "10 min",
        durationInSeconds: 600,
        icon: "tint",
        iconType: "font-awesome-5"
      },
      {
        title: "Expression Quest",
        description: "Find healthy ways to express your feelings through art, movement or writing.",
        points: 70,
        duration: "15 min",
        durationInSeconds: 900,
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
        durationInSeconds: 900,
        icon: "map",
        iconType: "font-awesome"
      },
      {
        title: "Inspiration Implementation",
        description: "Take one inspired idea and create an action plan, earning planning points.",
        points: 60,
        duration: "12 min",
        durationInSeconds: 720,
        icon: "lightbulb",
        iconType: "font-awesome-5"
      },
      {
        title: "Creative Connections",
        description: "Find unexpected connections between your inspiration and other areas of life.",
        points: 50,
        duration: "10 min",
        durationInSeconds: 600,
        icon: "link",
        iconType: "font-awesome"
      }
    ]
  };
  

// Add yoga to all mood categories if not already there
Object.keys(mindfulnessActivities).forEach(mood => {
  if (!mindfulnessActivities[mood].some(activity => activity.isYoga)) {
    mindfulnessActivities[mood].push({
      title: "Stress-Relief Yoga",
      description: "Follow along with 3D avatar guidance for yoga poses specifically designed to reduce stress and enhance your mood.",
      points: 70,
      duration: "12 min",
      durationInSeconds: 720,
      icon: "yoga",
      iconType: "material-community",
      isYoga: true
    });
  }
});

const MindfulActivitiesComponent = ({ selectedMood }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [yogaModalVisible, setYogaModalVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedYogaPose, setSelectedYogaPose] = useState(null);
  const [userStreak, setUserStreak] = useState(0);
  const [userPoints, setUserPoints] = useState(0);
  const [userId, setUserId] = useState(null);
  const [activityStarted, setActivityStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [avatarAnimation, setAvatarAnimation] = useState('pulse');
  
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const requiredDurationRef = useRef(null);
  
  // Get activities based on current mood
  const activities = mindfulnessActivities[selectedMood] || mindfulnessActivities.relaxed;
  
  // Load user data when component mounts
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Check if user is logged in
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
            setUserId(user.uid);
            // Load user data from Firebase
            const userRef = ref(db, `users/${user.uid}`);
            onValue(userRef, (snapshot) => {
              if (snapshot.exists()) {
                const userData = snapshot.val();
                setUserStreak(userData.streak || 0);
                setUserPoints(userData.points || 0);
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
          } else {
            setUserId(null);
            setUserStreak(0);
            setUserPoints(0);
          }
        });
        
        return () => unsubscribe();
      } catch (error) {
        console.error("Error loading user data:", error);
        // Set default values in case of error
        setUserStreak(0);
        setUserPoints(0);
      }
    };
    
    loadUserData();
  }, []);

  // Handle activity selection
  const handleActivitySelect = (activity) => {
    setSelectedActivity(activity);
    
    if (activity.isYoga) {
      // Open yoga selection modal
      setYogaModalVisible(true);
    } else {
      // Open regular activity modal
      setModalVisible(true);
      setActivityStarted(false);
      setTimeRemaining(activity.durationInSeconds || 300);
    }
  };

  // Handle yoga pose selection
  const handleYogaPoseSelect = (pose) => {
    setSelectedYogaPose(pose);
    setYogaModalVisible(false);
    setModalVisible(true);
    setActivityStarted(false);
    setTimeRemaining(pose.durationInSeconds || 300);
  };

  // Start the activity and timer
  const startActivity = () => {
    if (!userId) {
      Alert.alert("Login Required", "Please log in to track your progress.");
      return;
    }
    
    setActivityStarted(true);
    startTimeRef.current = Date.now();
    
    // If it's a yoga pose, use its duration, otherwise use the activity duration
    if (selectedYogaPose) {
      requiredDurationRef.current = selectedYogaPose.durationInSeconds || 300;
    } else {
      requiredDurationRef.current = selectedActivity.durationInSeconds || 300;
    }
    
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
        
        // Change avatar animation every 20 seconds for yoga poses
        if (selectedYogaPose && elapsedSeconds % 20 === 0) {
          const animations = ['pulse', 'bounce', 'flash', 'jello', 'rubberBand'];
          const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
          setAvatarAnimation(randomAnimation);
        }
      }
    }, 1000);
  };

  // Complete activity
  const completeActivity = (completed = false) => {
    // FIX 1: Make sure to always clear the timer when completing activity
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (completed && userId) {
      try {
        // Award points and update streak
        const pointsEarned = selectedYogaPose ? selectedYogaPose.points : selectedActivity.points;
        
        // Update local state
        setUserPoints(prev => prev + pointsEarned);
        setUserStreak(prev => prev + 1);
        
        // Show success message
        Alert.alert(
          "Activity Completed!", 
          `Congratulations! You've earned ${pointsEarned} points.`
        );
        
        // Update Firebase (if we're connected)
        const userRef = ref(db, `users/${userId}`);
        update(userRef, {
          points: userPoints + pointsEarned,
          streak: userStreak + 1,
          lastCompletedDate: new Date().toDateString(),
          lastActivityCompleted: {
            title: selectedYogaPose ? selectedYogaPose.name : selectedActivity.title,
            points: pointsEarned,
            completedAt: serverTimestamp()
          }
        }).catch(err => console.error("Error updating user data:", err));
      } catch (error) {
        console.error("Error completing activity:", error);
      }
    }
    
    setActivityStarted(false);
    setModalVisible(false);
    setSelectedYogaPose(null);
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
          <View style={[
            styles.activityIconContainer,
            activity.isYoga && styles.yogaIconContainer
          ]}>
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
              {activity.isYoga && (
                <View style={styles.metaItem}>
                  <MaterialCommunityIcons name="yoga" size={12} color="#4CAF50" />
                  <Text style={[styles.metaText, { color: '#4CAF50' }]}>3D Guide</Text>
                </View>
              )}
            </View>
          </View>
          <AntDesign name="right" size={16} color="#6200ee" style={styles.arrowIcon} />
        </TouchableOpacity>
      ))}
      
      {/* Yoga Pose Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={yogaModalVisible}
        onRequestClose={() => setYogaModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.yogaModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.yogaModalTitle}>Stress Relief Yoga</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setYogaModalVisible(false)}
              >
                <AntDesign name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.yogaModalSubtitle}>
              Select a yoga pose to follow with our 3D avatar guide
            </Text>
            
            <ScrollView style={styles.yogaList}>
              {yogaPoses.map((pose, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.yogaPoseCard}
                  onPress={() => handleYogaPoseSelect(pose)}
                >
                  <View style={styles.yogaPoseCardContent}>
                    <Image 
                      source={pose.imagePath}
                      style={styles.yogaPoseImage}
                      resizeMode="cover"
                    />
                    <View style={styles.yogaPoseInfo}>
                      <Text style={styles.yogaPoseName}>{pose.name}</Text>
                      <Text style={styles.yogaPoseSanskrit}>{pose.sanskritName}</Text>
                      <Text style={styles.yogaPoseDescription} numberOfLines={2}>
                        {pose.description}
                      </Text>
                      <View style={styles.yogaPoseMeta}>
                        <View style={styles.yogaPoseMetaItem}>
                          <FontAwesome5 name="clock" size={12} color="#4CAF50" />
                          <Text style={styles.yogaPoseMetaText}>{pose.duration}</Text>
                        </View>
                        <View style={styles.yogaPoseMetaItem}>
                          <FontAwesome5 name="star" size={12} color="#4CAF50" />
                          <Text style={styles.yogaPoseMetaText}>{pose.points} pts</Text>
                        </View>
                        <View style={styles.yogaPoseMetaItem}>
                          <FontAwesome5 name="signal" size={12} color="#4CAF50" />
                          <Text style={styles.yogaPoseMetaText}>{pose.difficulty}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      
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
            setSelectedYogaPose(null);
          }
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedYogaPose ? (
              // Yoga pose detail view
              <>
                <View style={styles.modalHeader}>
                  {!activityStarted && (
                    <TouchableOpacity 
                      style={styles.closeButton}
                      onPress={() => {
                        setModalVisible(false);
                        setSelectedYogaPose(null);
                      }}
                    >
                      <AntDesign name="close" size={24} color="#333" />
                    </TouchableOpacity>
                  )}
                </View>
                
                <Text style={styles.modalTitle}>{selectedYogaPose.name}</Text>
                <Text style={styles.modalSanskritName}>{selectedYogaPose.sanskritName}</Text>
                
                {activityStarted ? (
                  // Active yoga session view
                  <View style={styles.yogaSessionContainer}>
                    <Text style={styles.timerLabel}>Time Remaining</Text>
                    <Text style={styles.timerText}>{formatTimeRemaining(timeRemaining)}</Text>
                    
                    <Animatable.View 
                      animation={avatarAnimation}
                      iterationCount="infinite"
                      duration={2000}
                      style={styles.yogaAvatarContainer}
                    >
                      <Image 
                        source={selectedYogaPose.imagePath}
                        style={styles.yogaAvatar}
                        resizeMode="contain"
                      />
                    </Animatable.View>
                    
                    <Text style={styles.yogaInstructionText}>
                      Follow the avatar and maintain the pose. Remember to breathe deeply.
                    </Text>
                  </View>
                ) : (
                  // Yoga pose details view
                  <>
                    <View style={styles.yogaAvatarPreviewContainer}>
                      <Image 
                        source={selectedYogaPose.imagePath}
                        style={styles.yogaAvatarPreview}
                        resizeMode="contain"
                      />
                    </View>
                    
                    <Text style={styles.yogaPoseDetailDescription}>
                      {selectedYogaPose.description}
                    </Text>
                    
                    <View style={styles.benefitsContainer}>
                      <Text style={styles.benefitsTitle}>Benefits:</Text>
                      {selectedYogaPose.benefits.map((benefit, index) => (
                        <View key={index} style={styles.benefitItem}>
                          <MaterialCommunityIcons name="check-circle" size={16} color="#4CAF50" />
                          <Text style={styles.benefitText}>{benefit}</Text>
                        </View>
                      ))}
                    </View>
                    
                    <View style={styles.targetAreasContainer}>
                      <Text style={styles.targetAreasTitle}>Target Areas:</Text>
                      <View style={styles.targetAreaTags}>
                        {selectedYogaPose.targetAreas.map((area, index) => (
                          <View key={index} style={styles.targetAreaTag}>
                            <Text style={styles.targetAreaText}>{area}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </>
                )}
                
                {activityStarted ? (
                  <TouchableOpacity 
                    style={[styles.startButton, { backgroundColor: '#e53935' }]}
                    onPress={() => {
                      Alert.alert(
                        "Stop Yoga Session?",
                        "You won't receive points if you stop now.",
                        [
                          { text: "Continue", style: "cancel" },
                          { text: "Stop", onPress: () => completeActivity(false) }
                        ]
                      );
                    }}
                  >
                    <Text style={styles.startButtonText}>Stop Session</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={[styles.startButton, { backgroundColor: '#4CAF50' }]}
                    onPress={startActivity}
                  >
                    <Text style={styles.startButtonText}>Start Yoga Session</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : selectedActivity && (
              // Regular activity detail view
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
                  {renderIcon(selectedActivity.icon, selectedActivity.iconType)}
                </View>
                <Text style={styles.modalTitle}>{selectedActivity.title}</Text>
                
                {activityStarted ? (
                  <View style={styles.timerContainer}>
                    <Text style={styles.timerLabel}>Time Remaining</Text>
                    <Text style={styles.timerText}>{formatTimeRemaining(timeRemaining)}</Text>
                    <Text style={styles.modalDescription}>Keep going! You're doing great with your {selectedActivity.title} activity.</Text>
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

// Styles for the component
const styles = StyleSheet.create({
  container: {
    marginTop: 5,
    marginBottom: 15,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 5,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 18,
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
    shadowRadius: 3,
    elevation: 2,
  },
  activityIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0e6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  yogaIconContainer: {
    backgroundColor: '#e8f5e9',
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
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  arrowIcon: {
    alignSelf: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  yogaModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  closeButton: {
    padding: 5,
  },
  yogaModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  yogaModalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  yogaList: {
    maxHeight: '80%',
  },
  yogaPoseCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e8f5e9',
  },
  yogaPoseCardContent: {
    flexDirection: 'row',
  },
  yogaPoseIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  yogaPoseInfo: {
    flex: 1,
  },
  yogaPoseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  yogaPoseSanskrit: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#666',
    marginBottom: 4,
  },
  yogaPoseDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  yogaPoseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yogaPoseMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  yogaPoseMetaText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
  },
  modalIconContainer: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0e6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalSanskritName: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 24,
  },
  modalMeta: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 25,
  },
  modalMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  modalMetaText: {
    fontSize: 14,
    color: '#6200ee',
    marginLeft: 6,
  },
  startButton: {
    backgroundColor: '#6200ee',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  timerContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  timerLabel: {
    fontSize: 14,
    color: '#666',
  },
  timerText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6200ee',
    marginVertical: 10,
  },
  yogaSessionContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  yogaAvatarContainer: {
    width: width * 0.8,
    height: width * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 15,
  },
  yogaAvatar: {
    width: '100%',
    height: '100%',
  },
  yogaInstructionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 10,
  },
  yogaAvatarPreviewContainer: {
    width: width * 0.6,
    height: width * 0.6,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 15,
  },
  yogaAvatarPreview: {
    width: '100%',
    height: '100%',
  },
  yogaPoseDetailDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    lineHeight: 24,
  },
  benefitsContainer: {
    marginBottom: 15,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  benefitText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  targetAreasContainer: {
    marginBottom: 20,
  },
  targetAreasTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  targetAreaTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  targetAreaTag: {
    backgroundColor: '#e8f5e9',
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  targetAreaText: {
    fontSize: 12,
    color: '#4CAF50',
  }
});

export default MindfulActivitiesComponent;