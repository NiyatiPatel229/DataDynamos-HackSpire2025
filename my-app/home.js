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
  SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Speech from 'expo-speech';
import Voice from '@react-native-voice/voice';
import { auth, db } from './firebase';
import { ref, push, set, onValue, remove, query, orderByChild, equalTo, limitToLast } from 'firebase/database';
import axios from 'axios';

// You'll need to install: expo-linear-gradient, expo-speech, @react-native-voice/voice, axios

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
      timestamp
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
                color="#6200ee" 
              />
            </TouchableOpacity>
          )}
        </View>
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

  // Format timestamp to readable date
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  // Main Home Screen Render
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to MindMosaic</Text>
          <Text style={styles.subtitle}>How are you feeling today?</Text>
        </View>
        
        <View style={styles.contentContainer}>
          <Text style={styles.sectionTitle}>Daily Check-in</Text>
          
          <TouchableOpacity 
            onPress={() => setShowChatbot(true)}
            style={styles.chatbotContainer}
          >
            <LinearGradient
              colors={['#6200ee', '#9c27b0', '#e91e63']}
              style={styles.gradientBox}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Icon name="chat" size={24} color="white" style={styles.chatIcon} />
              <Text style={styles.chatbotText}>
                Talk to your Mental Health Assistant
              </Text>
              <Text style={styles.chatbotSubtext}>
                Share how you're feeling today
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <Text style={styles.sectionTitle}>Today's Wellness Tip</Text>
          <View style={styles.placeholderBox}>
            <Text style={styles.placeholderText}>
              Daily wellness tips and suggestions will be displayed in this section.
            </Text>
          </View>
          
          <Text style={styles.sectionTitle}>Your Current Mood</Text>
          <View style={styles.moodContainer}>
            <Text style={styles.moodEmoji}>{getMoodEmoji(currentMood.sentiment)}</Text>
            <View style={styles.moodDetails}>
              <Text style={styles.moodText}>
                You're feeling <Text style={styles.moodHighlight}>{currentMood.sentiment}</Text>
              </Text>
              {currentMood.timestamp && (
                <Text style={styles.moodTimestamp}>Last updated: {formatTimestamp(currentMood.timestamp)}</Text>
              )}
            </View>
          </View>
          
          {moodHistory.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Mood History</Text>
              <ScrollView 
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.moodHistoryContainer}
              >
                {moodHistory.map((mood, index) => (
                  <View key={index} style={styles.moodHistoryItem}>
                    <Text style={styles.historyEmoji}>{getMoodEmoji(mood.sentiment)}</Text>
                    <Text style={styles.historyTimestamp}>{formatTimestamp(mood.timestamp)}</Text>
                  </View>
                ))}
              </ScrollView>
            </>
          )}
        </View>
      </ScrollView>

      {/* Chatbot Modal */}
      <Modal
        visible={showChatbot}
        animationType="slide"
        onRequestClose={() => setShowChatbot(false)}
      >
        <SafeAreaView style={styles.chatbotModalContainer}>
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => setShowChatbot(false)} style={styles.backButton}>
              <Icon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Mental Health Assistant</Text>
            <TouchableOpacity 
              onPress={() => {
                console.log("Delete button clicked");
                clearChatHistory();
                // Alert.alert(
                //   "Clear Chat",
                //   "Are you sure you want to clear all chat history?",
                //   [
                //     { text: "Cancel", style: "cancel" },
                //     { 
                //       text: "Clear", 
                //       style: "destructive", 
                //       onPress: () => {
                //         console.log("User confirmed chat deletion");
                //         clearChatHistory();
                //       }
                //     }
                //   ]
                // );
              }} 
              style={styles.clearButton}
            >
              <Icon name="delete" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {loading && chatHistory.length <= 1 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6200ee" />
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
              style={styles.micButton}
            >
              <Icon 
                name={isListening ? "mic-off" : "mic"} 
                size={24} 
                color={isListening ? "#e91e63" : "#6200ee"} 
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
  // Home Screen Styles
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: '#6200ee',
    padding: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    marginTop: 5,
  },
  contentContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
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
  chatbotContainer: {
    marginBottom: 15,
  },
  gradientBox: {
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  chatIcon: {
    marginBottom: 8,
  },
  chatbotText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  chatbotSubtext: {
    color: 'white',
    fontSize: 14,
    opacity: 0.9,
  },
  
  // Chatbot Modal Styles
  chatbotModalContainer: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  chatHeader: {
    backgroundColor: '#6200ee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'android' ? 50 : 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  backButton: {
    padding: 8,
  },
  clearButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  chatContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  botMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  userMessageBubble: {
    backgroundColor: '#6200ee',
    borderBottomRightRadius: 4,
  },
  botMessageBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#fff',
  },
  botMessageText: {
    color: '#333',
  },
  speakButton: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    padding: 4,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  micButton: {
    padding: 12,
  },
  sendButton: {
    backgroundColor: '#6200ee',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#c8c8c8',
  },
  moodContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  moodDetails: {
    flex: 1,
  },
  moodText: {
    fontSize: 16,
    color: '#333',
  },
  moodHighlight: {
    fontWeight: 'bold',
    color: '#6200ee',
  },
  moodTimestamp: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  moodHistoryContainer: {
    marginBottom: 20,
  },
  moodHistoryItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
    width: 100,
  },
  historyEmoji: {
    fontSize: 30,
    marginBottom: 8,
  },
  historyTimestamp: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
});

export default HomeScreen;