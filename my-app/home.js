import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  SafeAreaView,
  Image,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Speech from 'expo-speech';
import Voice from '@react-native-voice/voice';
import { auth, db } from './firebase';
import { ref, push, set, onValue, remove, query, orderByChild, equalTo, limitToLast } from 'firebase/database';
import axios from 'axios';

// You'll need to install: expo-linear-gradient, expo-speech, @react-native-voice/voice, axios

const { width } = Dimensions.get('window');
const primaryColor = '#9370DB'; // Medium Purple
const secondaryColor = '#7B68EE'; // Medium Slate Blue
const accentColor = '#B19CD9'; // Light Purple
const darkAccent = '#6A5ACD'; // Slate Blue
const lightBackground = '#F8F7FF'; // Very Light Purple
const cardBackground = '#FFFFFF'; // White

const HomeScreen = () => {
  // State for home screen
  const [showChatbot, setShowChatbot] = useState(false);
  
  // States for chatbot
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const [currentMood, setCurrentMood] = useState({ sentiment: 'neutral', score: 0, timestamp: null });
  const [moodHistory, setMoodHistory] = useState([]);
  const flatListRef = useRef(null);
  const currentUser = auth.currentUser;
  
  // Replace with your actual Gemini API key
  const GEMINI_API_KEY = 'AIzaSyA9pusWPVjr2NOPwrEO6Ry-uUzJzfRb2d4';
  
  // Sentiment to mood mapping (same as in recommandation.js)
  const sentimentToMood = {
    positive: ['happy', 'energetic', 'inspired'],
    neutral: ['relaxed', 'focused', 'nostalgic'],
    negative: ['sad', 'anxious', 'angry']
  };
  
  // Map sentiment score to mood (simplified ML approach - same as in recommandation.js)
  const mapSentimentToMood = (sentiment, score) => {
    if (!sentiment || !sentimentToMood[sentiment]) {
      return 'happy'; // Default fallback
    }
    
    if (sentiment === 'positive') {
      if (score > 0.7) return 'inspired';
      if (score > 0.3) return 'energetic';
      return 'happy';
    } 
    else if (sentiment === 'negative') {
      if (score < -0.7) return 'angry';
      if (score < -0.3) return 'anxious';
      return 'sad';
    }
    else { // neutral
      if (score > 0.1) return 'focused';
      if (score < -0.1) return 'nostalgic';
      return 'relaxed';
    }
  };
  
  // Initial bot message - only if no history exists
  useEffect(() => {
    if (showChatbot && chatHistory.length === 0) {
      const initialMessage = {
        id: 'initial',
        text: "How have you been doing lately?",
        sender: 'bot',
        timestamp: new Date().getTime()
      };
      setChatHistory([initialMessage]);
      // Save initial message to database if no history exists
      if (currentUser) {
        const chatRef = ref(db, `chatHistory/${currentUser.uid}/${initialMessage.id}`);
        set(chatRef, initialMessage);
      }
    }
  }, [showChatbot, chatHistory.length, currentUser]);

  // Load chat history from Firebase when chatbot is opened
  useEffect(() => {
    if (showChatbot && currentUser) {
      loadChatHistory();
    }
  }, [showChatbot, currentUser]);

  // Set up voice recognition
  useEffect(() => {
    function onSpeechStart() {
      setIsListening(true);
    }
    
    function onSpeechEnd() {
      setIsListening(false);
    }
    
    function onSpeechResults(e) {
      if (e.value && e.value[0]) {
        setMessage(e.value[0]);
      }
    }
    
    function onSpeechError(e) {
      console.error('Speech recognition error:', e);
      setIsListening(false);
    }
    
    // Set up event listeners
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;

    // Initialize Voice
    const initVoice = async () => {
      try {
        await Voice.isAvailable();
        console.log('Voice recognition is available');
      } catch (e) {
        console.error('Voice recognition error:', e);
      }
    };

    initVoice();

    return () => {
      Voice.destroy().then(() => {
        Voice.removeAllListeners();
      });
    };
  }, []);

  // Scroll to bottom when chat updates
  useEffect(() => {
    if (flatListRef.current && chatHistory.length > 0) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chatHistory]);

  // Load user's current mood and mood history when component mounts
  useEffect(() => {
    if (currentUser) {
      loadCurrentMood();
      loadMoodHistory();
    }
  }, [currentUser]);

  const loadChatHistory = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      // Using Realtime Database query
      const chatRef = ref(db, `chatHistory/${currentUser.uid}`);
      
      onValue(chatRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const messages = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);
          setChatHistory(messages);
        } else {
          // No chat history found
          setChatHistory([
            {
              id: 'initial',
              text: "How have you been doing lately?",
              sender: 'bot',
              timestamp: new Date().getTime()
            }
          ]);
        }
        setLoading(false);
      }, {
        onlyOnce: true
      });
    } catch (error) {
      console.error("Error loading chat history:", error);
      Alert.alert("Error", "Failed to load chat history");
      setLoading(false);
    }
  };

  const saveChatMessage = async (messageData) => {
    if (!currentUser) return;
    
    try {
      // Using Realtime Database
      const chatRef = ref(db, `chatHistory/${currentUser.uid}/${messageData.id}`);
      await set(chatRef, messageData);
    } catch (error) {
      console.error("Error saving chat message:", error);
    }
  };

  const clearChatHistory = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      // Delete all chat messages for this user
      const chatRef = ref(db, `chatHistory/${currentUser.uid}`);
      await remove(chatRef);
      
      // Reset chat with initial message
      const initialMessage = {
        id: 'initial',
        text: "How have you been doing lately?",
        sender: 'bot',
        timestamp: new Date().getTime()
      };
      setChatHistory([initialMessage]);
      
      // Save the initial message back to database
      const newChatRef = ref(db, `chatHistory/${currentUser.uid}/${initialMessage.id}`);
      await set(newChatRef, initialMessage);
    } catch (error) {
      console.error("Error clearing chat history:", error);
      Alert.alert("Error", "Failed to clear chat history");
    } finally {
      setLoading(false);
    }
  };

  const generateChatResponse = async (prompt, chatHistory) => {
    try {
      // Format the chat history for context
      const formattedHistory = chatHistory.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));
      
      // Add the current prompt
      const contents = [
        ...formattedHistory,
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ];
  
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            }
          ],
          systemInstruction: {
            parts: [
              {
                text: "You are a mental health assistant chatbot. Your purpose is to provide supportive, empathetic conversations to users about their mental wellbeing. Ask thoughtful questions to understand their emotional state. Provide evidence-based coping strategies when appropriate. Always be compassionate and non-judgmental. If users express severe distress or suicidal thoughts, emphasize the importance of seeking professional help and provide crisis resources. Never diagnose medical conditions. Focus on being a supportive listener who helps users explore their feelings and develop healthy coping mechanisms."
              }
            ]
          }
        }
      );
  
      if (response.data.candidates && response.data.candidates[0].content) {
        return response.data.candidates[0].content.parts[0].text;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      
      // For development/testing - provide simulated responses if API fails
      const lowerCaseMessage = prompt.toLowerCase();
      if (lowerCaseMessage.includes('sad') || lowerCaseMessage.includes('depress')) {
        return "I'm sorry to hear you're feeling down. Depression and sadness are common emotions that everyone experiences at times. Would you like to talk more about what's making you feel this way? Remember that seeking support from a professional therapist can be really helpful.";
      } else if (lowerCaseMessage.includes('anxious') || lowerCaseMessage.includes('worry')) {
        return "It sounds like you're experiencing some anxiety. That's completely understandable - many people deal with anxiety. Have you tried any relaxation techniques like deep breathing or mindfulness? These can sometimes help manage anxious feelings in the moment.";
      } else if (lowerCaseMessage.includes('happy') || lowerCaseMessage.includes('good')) {
        return "I'm glad to hear you're feeling positive! What's been contributing to your good mood lately? Recognizing the things that bring us joy can help us cultivate more positive experiences.";
      } else if (lowerCaseMessage.includes('tired') || lowerCaseMessage.includes('exhausted')) {
        return "Feeling tired can really impact our mental health. Have you been able to get enough rest lately? Sometimes establishing a consistent sleep routine can help improve both physical and mental energy levels.";
      } else {
        return "Thank you for sharing. How does talking about this make you feel? Remember that your emotions are valid, and it's okay to have ups and downs. Is there anything specific you'd like to explore further about your mental health?";
      }
    }
  };

  // Load current mood from Firebase
  const loadCurrentMood = () => {
    if (!currentUser) return;

    const currentMoodRef = ref(db, `userMoods/${currentUser.uid}/currentMood`);
    onValue(currentMoodRef, (snapshot) => {
      if (snapshot.exists()) {
        const moodData = snapshot.val();
        setCurrentMood(moodData);
      } else {
        // Set default mood if none exists
        setCurrentMood({ 
          sentiment: 'neutral', 
          score: 0, 
          timestamp: new Date().getTime() 
        });
      }
    }, { onlyOnce: true });
  };

  // Load mood history from Firebase
  const loadMoodHistory = () => {
    if (!currentUser) return;

    const moodHistoryRef = query(
      ref(db, `userMoods/${currentUser.uid}/moodHistory`),
      orderByChild('timestamp'),
      limitToLast(10)
    );

    onValue(moodHistoryRef, (snapshot) => {
      if (snapshot.exists()) {
        const historyData = snapshot.val();
        const moodArray = Object.values(historyData).sort((a, b) => b.timestamp - a.timestamp);
        setMoodHistory(moodArray);
      }
    }, { onlyOnce: true });
  };

  // Analyze sentiment of text using Gemini API
  const analyzeSentiment = async (text) => {
    try {
      // Use Gemini to analyze sentiment
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Analyze the sentiment of this text and return a JSON object with a 'sentiment' field that has a value of either 'positive', 'negative', or 'neutral', and a 'score' field with a numerical score from -1 to 1 where -1 is very negative, 0 is neutral, and 1 is very positive. Only return the JSON, nothing else. Text: "${text}"`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            topK: 10,
            topP: 0.8,
            maxOutputTokens: 100,
          }
        }
      );

      if (response.data.candidates && response.data.candidates[0].content) {
        const resultText = response.data.candidates[0].content.parts[0].text;
        // Extract JSON from response
        const jsonMatch = resultText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const sentimentResult = JSON.parse(jsonMatch[0]);
          console.log('Sentiment analysis result:', sentimentResult);
          return sentimentResult;
        }
      }
      
      // Default return if parsing fails
      return { sentiment: 'neutral', score: 0 };
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return { sentiment: 'neutral', score: 0 };
    }
  };

  // Update user's mood in database
  const updateUserMood = async (sentimentResult) => {
    if (!currentUser) return;
    
    const timestamp = new Date().getTime();
    const moodData = {
      ...sentimentResult,
      timestamp,
      // Add a mapped mood for recommendations
      mappedMood: mapSentimentToMood(sentimentResult.sentiment, sentimentResult.score)
    };
    
    try {
      // Update current mood
      const currentMoodRef = ref(db, `userMoods/${currentUser.uid}/currentMood`);
      await set(currentMoodRef, moodData);
      
      // Add to mood history
      const historyRef = ref(db, `userMoods/${currentUser.uid}/moodHistory/${timestamp}`);
      await set(historyRef, moodData);
      
      // Update local state
      setCurrentMood(moodData);
      
      // Update mood history
      loadMoodHistory();
      
      console.log('Updated user mood:', moodData);
    } catch (error) {
      console.error('Error updating mood in database:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    const userMessage = {
      id: Date.now().toString(),
      text: message.trim(),
      sender: 'user',
      timestamp: new Date().getTime()
    };
    
    setChatHistory(prev => [...prev, userMessage]);
    saveChatMessage(userMessage);
    
    // Analyze sentiment of user's message
    const sentimentResult = await analyzeSentiment(message.trim());
    updateUserMood(sentimentResult);
    
    setMessage('');
    
    // Show loading indicator
    setLoading(true);
    
    try {
      // Call to Gemini API
      const response = await generateChatResponse(message.trim(), chatHistory);
      
      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'bot',
        timestamp: new Date().getTime()
      };
      
      setChatHistory(prev => [...prev, botMessage]);
      saveChatMessage(botMessage);
    } catch (error) {
      console.error("Error getting response from Gemini:", error);
      
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble responding right now. Please try again later.",
        sender: 'bot',
        timestamp: new Date().getTime()
      };
      
      setChatHistory(prev => [...prev, errorMessage]);
      saveChatMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const startListening = async () => {
    try {
      await Voice.stop();
      await Voice.start('en-US');
      console.log('Voice recognition started');
    } catch (e) {
      console.error('Error starting voice recognition:', e);
      Alert.alert('Voice Error', 'Could not start voice recognition. Please try again.');
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
      console.log('Voice recognition stopped');
    } catch (e) {
      console.error('Error stopping voice recognition:', e);
    }
  };

  const speakText = (text) => {
    setIsSpeaking(true);
    Speech.speak(text, {
      language: 'en',
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false)
    });
  };

  const stopSpeaking = () => {
    Speech.stop();
    setIsSpeaking(false);
  };

  const renderChatMessage = ({ item }) => {
    const isBot = item.sender === 'bot';
    
    return (
      <View style={[
        styles.messageContainer,
        isBot ? styles.botMessageContainer : styles.userMessageContainer
      ]}>
        {isBot && (
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={[primaryColor, secondaryColor]}
              style={styles.avatarGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.avatarText}>AI</Text>
            </LinearGradient>
          </View>
        )}
        <View style={[
          styles.messageBubble,
          isBot ? styles.botMessageBubble : styles.userMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isBot ? styles.botMessageText : styles.userMessageText
          ]}>
            {item.text}
          </Text>
          
          {isBot && (
            <TouchableOpacity 
              style={styles.speakButton}
              onPress={() => isSpeaking ? stopSpeaking() : speakText(item.text)}
            >
              <Icon 
                name={isSpeaking ? "volume-off" : "volume-up"} 
                size={20} 
                color={primaryColor} 
              />
            </TouchableOpacity>
          )}
        </View>
        {!isBot && (
          <View style={styles.userAvatarContainer}>
            <LinearGradient
              colors={[secondaryColor, darkAccent]}
              style={styles.userAvatarGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.avatarText}>You</Text>
            </LinearGradient>
          </View>
        )}
      </View>
    );
  };

  // Get mood emoji based on sentiment
  const getMoodEmoji = (sentiment) => {
    switch(sentiment) {
      case 'positive':
        return '😊';
      case 'negative':
        return '😔';
      case 'neutral':
      default:
        return '😐';
    }
  };
  
  // Get emoji for mapped mood
  const getMappedMoodEmoji = (mappedMood) => {
    const moodIcons = {
      happy: '😊',
      sad: '😢',
      energetic: '⚡',
      relaxed: '😌',
      anxious: '😰',
      romantic: '❤️',
      focused: '🧠',
      nostalgic: '🕰️',
      angry: '😡',
      inspired: '💡'
    };
    return moodIcons[mappedMood] || '😐';
  };

  // Format timestamp to readable date
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
  };

  // Generate a greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Wellness tips array
  const wellnessTips = [
    "Practice deep breathing for 5 minutes when feeling stressed.",
    "Take short breaks to stretch throughout your day.",
    "Try to get 7-8 hours of sleep tonight for better mental clarity.",
    "Spend a few minutes in nature to boost your mood.",
    "Stay hydrated - drink at least 8 glasses of water today.",
    "Practice gratitude by noting three things you're thankful for.",
    "Limit screen time before bed for better sleep quality.",
    "Connect with a friend or loved one today."
  ];

  // Get random wellness tip
  const getRandomTip = () => {
    const randomIndex = Math.floor(Math.random() * wellnessTips.length);
    return wellnessTips[randomIndex];
  };

  // Main Home Screen Render
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[primaryColor, secondaryColor, darkAccent]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.title}>MindMosaic</Text>
          <Text style={styles.subtitle}>Your Mental Wellness Companion</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          {/* Current Mood Section - Simplified to show only basic sentiment */}
          <View style={styles.moodSummaryContainer}>
            <View style={styles.moodEmojiContainer}>
              <Text style={styles.moodEmoji}>
                {getMoodEmoji(currentMood.sentiment)}
              </Text>
            </View>
            <View style={styles.moodTextContainer}>
              <Text style={styles.moodLabel}>CURRENT MOOD</Text>
              <Text style={styles.moodValue}>
                {currentMood.sentiment.charAt(0).toUpperCase() + currentMood.sentiment.slice(1)}
              </Text>
              <Text style={styles.moodDescription}>
                Score: {currentMood.score ? currentMood.score.toFixed(2) : '0.00'}
              </Text>
              {currentMood.timestamp && (
                <Text style={styles.moodTimestamp}>{formatTimestamp(currentMood.timestamp)}</Text>
              )}
            </View>
          </View>
          
          {/* Current Feeling Section - Show mapped specific feeling */}
          {currentMood.mappedMood && (
            <View style={styles.feelingSummaryContainer}>
              <View style={styles.feelingHeader}>
                <Icon name="emoji-emotions" size={20} color={primaryColor} />
                <Text style={styles.feelingHeaderText}>CURRENT FEELING</Text>
              </View>
              <View style={styles.feelingContent}>
                <View style={styles.feelingEmojiContainer}>
                  <Text style={styles.feelingEmoji}>
                    {getMappedMoodEmoji(currentMood.mappedMood)}
                  </Text>
                </View>
                <Text style={styles.feelingText}>
                  {currentMood.mappedMood.charAt(0).toUpperCase() + currentMood.mappedMood.slice(1)}
                </Text>
              </View>
            </View>
          )}
          
          {/* Talk to Assistant Card */}
          <TouchableOpacity 
            onPress={() => setShowChatbot(true)}
            style={styles.chatbotCard}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[primaryColor, secondaryColor]}
              style={styles.gradientBox}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardIconContainer}>
                  <Icon name="psychology" size={32} color="white" style={styles.chatIcon} />
                </View>
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardTitle}>
                    Talk to Your Mental Health Assistant
                  </Text>
                  <Text style={styles.cardSubtext}>
                    Share how you're feeling today
                  </Text>
                </View>
                <Icon name="chevron-right" size={28} color="white" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
          
          {/* Wellness Tip Card */}
          <View style={styles.wellnessTipCard}>
            <View style={styles.cardHeader}>
              <Icon name="lightbulb" size={20} color={primaryColor} />
              <Text style={styles.cardHeaderText}>TODAY'S WELLNESS TIP</Text>
            </View>
            <Text style={styles.tipText}>{getRandomTip()}</Text>
          </View>
          
          {/* Mood History Section */}
          {moodHistory.length > 0 && (
            <View style={styles.moodHistorySection}>
              <View style={styles.sectionTitleContainer}>
                <Icon name="history" size={20} color={primaryColor} />
                <Text style={styles.sectionTitle}>MOOD HISTORY</Text>
              </View>
              <ScrollView 
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.moodHistoryContainer}
                contentContainerStyle={styles.moodHistoryContent}
                snapToInterval={width * 0.35 + 10}
                decelerationRate="fast"
              >
                {moodHistory.map((mood, index) => (
                  <View key={index} style={styles.moodHistoryItem}>
                    <Text style={styles.historyEmoji}>{getMoodEmoji(mood.sentiment)}</Text>
                    <Text style={styles.historyMood}>
                      {mood.sentiment.charAt(0).toUpperCase() + mood.sentiment.slice(1)}
                    </Text>
                    <Text style={styles.historyTimestamp}>
                      {new Date(mood.timestamp).toLocaleDateString([], {month: 'short', day: 'numeric'})}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
          
          {/* Resources Section
          <View style={styles.resourcesSection}>
            <View style={styles.sectionTitleContainer}>
              <Icon name="help" size={20} color={primaryColor} />
              <Text style={styles.sectionTitle}>HELPFUL RESOURCES</Text>
            </View>
            <View style={styles.resourceCard}>
              <Icon name="call" size={24} color={primaryColor} />
              <View style={styles.resourceTextContainer}>
                <Text style={styles.resourceTitle}>Crisis Helpline</Text>
                <Text style={styles.resourceDescription}>24/7 mental health support</Text>
              </View>
            </View>
            <View style={styles.resourceCard}>
              <Icon name="menu-book" size={24} color={primaryColor} />
              <View style={styles.resourceTextContainer}>
                <Text style={styles.resourceTitle}>Self-Help Library</Text>
                <Text style={styles.resourceDescription}>Articles and exercises</Text>
              </View>
            </View>
          </View> */}
        </View>
      </ScrollView>

      {/* Chatbot Modal */}
      <Modal
        visible={showChatbot}
        animationType="slide"
        onRequestClose={() => setShowChatbot(false)}
      >
        <SafeAreaView style={styles.chatbotModalContainer}>
          <LinearGradient
            colors={[primaryColor, secondaryColor]}
            style={styles.chatHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <TouchableOpacity onPress={() => setShowChatbot(false)} style={styles.backButton}>
              <Icon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Mental Health Assistant</Text>
            <TouchableOpacity 
              onPress={() => {
                clearChatHistory()
              }} 
              style={styles.clearButton}
            >
              <Icon name="delete" size={24} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          {loading && chatHistory.length <= 1 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={primaryColor} />
              <Text style={styles.loadingText}>Loading your conversation...</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={chatHistory}
              renderItem={renderChatMessage}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.chatContainer}
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            />
          )}

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={100}
            style={styles.inputContainer}
          >
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={setMessage}
              placeholder="Type your message..."
              placeholderTextColor="#999"
              multiline
            />
            
            <TouchableOpacity
              onPress={isListening ? stopListening : startListening}
              style={[styles.micButton, isListening && styles.listeningButton]}
            >
              <Icon 
                name={isListening ? "mic-off" : "mic"} 
                size={24} 
                color={isListening ? "#fff" : primaryColor} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={!message.trim() || loading}
              style={[
                styles.sendButton,
                (!message.trim() || loading) && styles.disabledButton
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Icon name="send" size={24} color="#fff" />
              )}
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  // Main Container
  container: {
    flex: 1,
    backgroundColor: lightBackground,
  },
  
  // Header Styles
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : 70,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  greeting: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
  },
  
  // Content Styles
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  
  // Mood Summary Card
  moodSummaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodEmojiContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: lightBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  moodEmoji: {
    fontSize: 32,
  },
  moodTextContainer: {
    flex: 1,
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#999',
    marginBottom: 4,
  },
  moodValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  moodDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  moodTimestamp: {
    fontSize: 12,
    color: '#999',
  },
  
  // Current Feeling Section
  feelingSummaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  feelingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  feelingHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: primaryColor,
    marginLeft: 8,
  },
  feelingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feelingEmojiContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(147, 112, 219, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  feelingEmoji: {
    fontSize: 22,
  },
  feelingText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  
  // Chatbot Card
  chatbotCard: {
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  gradientBox: {
    borderRadius: 16,
    padding: 20,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  chatIcon: {
    opacity: 0.9,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSubtext: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
  },
  
  // Wellness Tip Card
  wellnessTipCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: primaryColor,
    marginLeft: 8,
  },
  tipText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  
  // Mood History Section
  moodHistorySection: {
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: primaryColor,
    marginLeft: 8,
  },
  moodHistoryContainer: {
    flexDirection: 'row',
  },
  moodHistoryContent: {
    paddingRight: 20,
  },
  moodHistoryItem: {
    width: width * 0.35,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 15,
    marginRight: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  historyEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  historyMood: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  historyTimestamp: {
    fontSize: 12,
    color: '#999',
  },
  
  // Resources Section
  resourcesSection: {
    marginBottom: 20,
  },
  resourceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  resourceTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 14,
    color: '#666',
  },
  
  // Chatbot Modal
  chatbotModalContainer: {
    flex: 1,
    backgroundColor: lightBackground,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
    textAlign: 'center',
  },
  clearButton: {
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  chatContainer: {
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  
  // Message Styling
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  botMessageContainer: {
    alignSelf: 'flex-start',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    marginRight: 10,
  },
  avatarGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarContainer: {
    marginLeft: 10,
  },
  userAvatarGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  messageBubble: {
    maxWidth: width * 0.7,
    borderRadius: 18,
    padding: 12,
    paddingBottom: 15,
  },
  botMessageBubble: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  userMessageBubble: {
    backgroundColor: primaryColor,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  botMessageText: {
    color: '#333',
  },
  userMessageText: {
    color: '#fff',
  },
  speakButton: {
    position: 'absolute',
    bottom: -8,
    right: 5,
    backgroundColor: '#fff',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  // Input Area
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: lightBackground,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 120,
    fontSize: 16,
    marginRight: 10,
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: lightBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  listeningButton: {
    backgroundColor: accentColor,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  }
});

export default HomeScreen;