import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MindfulActivitiesComponent from './MindfulActivitiesComponent';
import { auth, db } from './firebase'; // Import Firebase
import { ref, onValue } from 'firebase/database'; // Import database methods

// Dataset for mood-based recommendations
const moodData = {
  happy: {
    music: [
      { title: "Happy", artist: "Pharrell Williams" },
      { title: "Can't Stop the Feeling!", artist: "Justin Timberlake" },
      { title: "Good as Hell", artist: "Lizzo" },
      { title: "Walking on Sunshine", artist: "Katrina & The Waves" },
      { title: "Uptown Funk", artist: "Mark Ronson ft. Bruno Mars" },
    ],
    movies: [
      { title: "La La Land", year: "2016", genre: "Musical/Romance" },
      { title: "Coco", year: "2017", genre: "Animation/Adventure" },
      { title: "The Greatest Showman", year: "2017", genre: "Biography/Musical" },
      { title: "Mamma Mia!", year: "2008", genre: "Comedy/Musical" },
      { title: "Sing Street", year: "2016", genre: "Comedy/Drama" },
    ]
  },
  // ...other mood data remains the same
  sad: {
    music: [
      { title: "Here Comes the Sun", artist: "The Beatles" },
      { title: "Don't Worry, Be Happy", artist: "Bobby McFerrin" },
      { title: "Walking on Sunshine", artist: "Katrina & The Waves" },
      { title: "Three Little Birds", artist: "Bob Marley" },
      { title: "Don't Stop Believin'", artist: "Journey" },
    ],
    movies: [
      { title: "The Pursuit of Happyness", year: "2006", genre: "Biography/Drama" },
      { title: "Silver Linings Playbook", year: "2012", genre: "Comedy/Drama/Romance" },
      { title: "Good Will Hunting", year: "1997", genre: "Drama/Romance" },
      { title: "The Intouchables", year: "2011", genre: "Biography/Comedy/Drama" },
      { title: "Little Miss Sunshine", year: "2006", genre: "Comedy/Drama" },
    ]
  },
  energetic: {
    music: [
      { title: "Levels", artist: "Avicii" },
      { title: "Stronger", artist: "Kanye West" },
      { title: "Don't Stop Me Now", artist: "Queen" },
      { title: "Eye of the Tiger", artist: "Survivor" },
      { title: "Lose Yourself", artist: "Eminem" },
    ],
    movies: [
      { title: "Baby Driver", year: "2017", genre: "Action/Crime" },
      { title: "John Wick", year: "2014", genre: "Action/Thriller" },
      { title: "Mad Max: Fury Road", year: "2015", genre: "Action/Adventure" },
      { title: "Fast & Furious", year: "2001", genre: "Action/Crime" },
      { title: "The Avengers", year: "2012", genre: "Action/Adventure" },
    ]
  },
  relaxed: {
    music: [
      { title: "Weightless", artist: "Marconi Union" },
      { title: "Clair de Lune", artist: "Claude Debussy" },
      { title: "Watermark", artist: "Enya" },
      { title: "Gymnopedie No.1", artist: "Erik Satie" },
      { title: "The Hours", artist: "Philip Glass" },
    ],
    movies: [
      { title: "The Secret Life of Walter Mitty", year: "2013", genre: "Adventure/Comedy" },
      { title: "Amélie", year: "2001", genre: "Comedy/Romance" },
      { title: "The Grand Budapest Hotel", year: "2014", genre: "Adventure/Comedy" },
      { title: "Chef", year: "2014", genre: "Adventure/Comedy" },
      { title: "Lost in Translation", year: "2003", genre: "Comedy/Drama" },
    ]
  },
  anxious: {
    music: [
      { title: "Breathe Me", artist: "Sia" },
      { title: "Weightless", artist: "Marconi Union" },
      { title: "Strawberry Swing", artist: "Coldplay" },
      { title: "Everything's Not Lost", artist: "Coldplay" },
      { title: "Ocean", artist: "John Butler Trio" },
    ],
    movies: [
      { title: "Inside Out", year: "2015", genre: "Animation/Adventure" },
      { title: "The Secret Life of Walter Mitty", year: "2013", genre: "Adventure/Comedy" },
      { title: "Big Hero 6", year: "2014", genre: "Animation/Action" },
      { title: "Paddington", year: "2014", genre: "Adventure/Comedy" },
      { title: "The Peanuts Movie", year: "2015", genre: "Animation/Comedy" },
    ]
  },
  romantic: {
    music: [
      { title: "All of Me", artist: "John Legend" },
      { title: "Perfect", artist: "Ed Sheeran" },
      { title: "At Last", artist: "Etta James" },
      { title: "Can't Help Falling in Love", artist: "Elvis Presley" },
      { title: "Thinking Out Loud", artist: "Ed Sheeran" },
    ],
    movies: [
      { title: "The Notebook", year: "2004", genre: "Drama/Romance" },
      { title: "Pride & Prejudice", year: "2005", genre: "Drama/Romance" },
      { title: "Before Sunrise", year: "1995", genre: "Drama/Romance" },
      { title: "La La Land", year: "2016", genre: "Drama/Musical" },
      { title: "Eternal Sunshine of the Spotless Mind", year: "2004", genre: "Drama/Romance" },
    ]
  },
  focused: {
    music: [
      { title: "Experience", artist: "Ludovico Einaudi" },
      { title: "Time", artist: "Hans Zimmer" },
      { title: "Divenire", artist: "Ludovico Einaudi" },
      { title: "Strobe", artist: "Deadmau5" },
      { title: "Intro", artist: "The xx" },
    ],
    movies: [
      { title: "The Theory of Everything", year: "2014", genre: "Biography/Drama" },
      { title: "A Beautiful Mind", year: "2001", genre: "Biography/Drama" },
      { title: "The Imitation Game", year: "2014", genre: "Biography/Drama" },
      { title: "The Social Network", year: "2010", genre: "Biography/Drama" },
      { title: "Whiplash", year: "2014", genre: "Drama/Music" },
    ]
  },
  nostalgic: {
    music: [
      { title: "Landslide", artist: "Fleetwood Mac" },
      { title: "Hotel California", artist: "Eagles" },
      { title: "Vienna", artist: "Billy Joel" },
      { title: "Dreams", artist: "Fleetwood Mac" },
      { title: "In My Life", artist: "The Beatles" },
    ],
    movies: [
      { title: "The Breakfast Club", year: "1985", genre: "Comedy/Drama" },
      { title: "Stand By Me", year: "1986", genre: "Adventure/Drama" },
      { title: "Back to the Future", year: "1985", genre: "Adventure/Comedy" },
      { title: "Forrest Gump", year: "1994", genre: "Drama/Romance" },
      { title: "Cinema Paradiso", year: "1988", genre: "Drama/Romance" },
    ]
  },
  angry: {
    music: [
      { title: "Shake It Out", artist: "Florence + The Machine" },
      { title: "Eye of the Tiger", artist: "Survivor" },
      { title: "Roar", artist: "Katy Perry" },
      { title: "Till I Collapse", artist: "Eminem" },
      { title: "Stronger", artist: "Kelly Clarkson" },
    ],
    movies: [
      { title: "Fight Club", year: "1999", genre: "Drama/Thriller" },
      { title: "Warrior", year: "2011", genre: "Drama/Sport" },
      { title: "The Dark Knight", year: "2008", genre: "Action/Crime" },
      { title: "John Wick", year: "2014", genre: "Action/Crime" },
      { title: "Creed", year: "2015", genre: "Drama/Sport" },
    ]
  },
  inspired: {
    music: [
      { title: "Hall of Fame", artist: "The Script ft. will.i.am" },
      { title: "Rise Up", artist: "Andra Day" },
      { title: "This Is Me", artist: "Keala Settle" },
      { title: "Brave", artist: "Sara Bareilles" },
      { title: "Glorious", artist: "Macklemore ft. Skylar Grey" },
    ],
    movies: [
      { title: "The Pursuit of Happyness", year: "2006", genre: "Biography/Drama" },
      { title: "Dead Poets Society", year: "1989", genre: "Comedy/Drama" },
      { title: "Hidden Figures", year: "2016", genre: "Biography/Drama" },
      { title: "The King's Speech", year: "2010", genre: "Biography/Drama" },
      { title: "Rudy", year: "1993", genre: "Biography/Drama" },
    ]
  }
};

// Sentiment to mood mapping
const sentimentToMood = {
  positive: ['happy', 'energetic', 'inspired'],
  neutral: ['relaxed', 'focused', 'nostalgic'],
  negative: ['sad', 'anxious', 'angry']
};

// Map sentiment score to specific mood (simplified ML approach)
const mapSentimentToMood = (sentiment, score) => {
  if (!sentiment || !sentimentToMood[sentiment]) {
    return 'happy'; // Default fallback
  }
  
  const moods = sentimentToMood[sentiment];
  
  // Use the score to determine which specific mood within the sentiment category
  // For positive sentiment: higher score = more energetic/inspired
  // For negative sentiment: lower score = more anxious/angry
  // For neutral: score near 0 = relaxed, slight positive = focused, slight negative = nostalgic
  
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

// Mood icons mapping - can be replaced with proper icon imports
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

const RecommendationScreen = () => {
  const [selectedMood, setSelectedMood] = useState('happy');
  const [detectedMood, setDetectedMood] = useState(null);
  const [currentSentiment, setCurrentSentiment] = useState({ sentiment: 'neutral', score: 0 });
  const [musicRecommendations, setMusicRecommendations] = useState(moodData.happy.music);
  const [movieRecommendations, setMovieRecommendations] = useState(moodData.happy.movies);
  const [autoMode, setAutoMode] = useState(true); // Default to automatic mode
  
  const moods = [
    'happy', 'sad', 'energetic', 'relaxed', 'anxious',
    'romantic', 'focused', 'nostalgic', 'angry', 'inspired'
  ];
  
  // Load current mood from Firebase when component mounts
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    
    const currentMoodRef = ref(db, `userMoods/${currentUser.uid}/currentMood`);
    const unsubscribe = onValue(currentMoodRef, (snapshot) => {
      if (snapshot.exists()) {
        const moodData = snapshot.val();
        setCurrentSentiment(moodData);
        
        // Determine mood based on sentiment data
        const mappedMood = mapSentimentToMood(moodData.sentiment, moodData.score);
        setDetectedMood(mappedMood);
        
        // In auto mode, update the selected mood
        if (autoMode) {
          setSelectedMood(mappedMood);
        }
      }
    });
    
    // Cleanup the listener when component unmounts
    return () => unsubscribe();
  }, [autoMode]);
  
  // Update recommendations when selected mood changes
  useEffect(() => {
    if (moodData[selectedMood]) {
      setMusicRecommendations(moodData[selectedMood].music);
      setMovieRecommendations(moodData[selectedMood].movies);
    }
  }, [selectedMood]);

  // Function to generate subtle gradient colors based on selected mood
  const getMoodGradient = () => {
    const baseColor = '#9370DB'; // Medium Purple theme color
    
    // Lighter and darker variants for different moods
    const moodColorMaps = {
      happy: ['#9370DB', '#A67EEA'],
      sad: ['#9370DB', '#8160C4'],
      energetic: ['#9370DB', '#B28AEF'],
      relaxed: ['#9370DB', '#856AC7'],
      anxious: ['#9370DB', '#7D5CCA'],
      romantic: ['#9370DB', '#A989E3'],
      focused: ['#9370DB', '#7F5CD1'],
      nostalgic: ['#9370DB', '#8E6BD6'],
      angry: ['#9370DB', '#7C5BB9'],
      inspired: ['#9370DB', '#AB87EB']
    };
    
    return moodColorMaps[selectedMood] || ['#9370DB', '#B395FF'];
  };

  // Toggle between auto and manual mood selection
  const toggleMoodSelectionMode = () => {
    setAutoMode(!autoMode);
    if (!autoMode && detectedMood) {
      // When switching to auto mode, update selected mood to detected mood
      setSelectedMood(detectedMood);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#9370DB" />
      
      {/* Header with gradient */}
      <LinearGradient
        colors={getMoodGradient()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.title}>Mood Wellness</Text>
          <Text style={styles.subtitle}>Personalized recommendations for your well-being</Text>
        </View>
      </LinearGradient>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          {/* Auto-detected Mood Display */}
          <View style={styles.detectedMoodContainer}>
            <View style={styles.detectedMoodHeader}>
              <Text style={styles.detectedMoodTitle}>
                {autoMode ? "Currently Recommending For Your Mood:" : "Current Detected Mood:"}
              </Text>
              <TouchableOpacity onPress={toggleMoodSelectionMode} style={styles.modeToggleButton}>
                <Text style={styles.modeToggleText}>
                  {autoMode ? "Switch to Manual" : "Use Detected Mood"}
                </Text>
              </TouchableOpacity>
            </View>
            
            {detectedMood && (
              <View style={styles.detectedMoodContent}>
                <View style={[
                  styles.moodEmojiContainer, 
                  { backgroundColor: getMoodGradient()[0] }
                ]}>
                  <Text style={styles.moodEmoji}>{moodIcons[detectedMood]}</Text>
                </View>
                <Text style={styles.detectedMoodText}>
                  {detectedMood.charAt(0).toUpperCase() + detectedMood.slice(1)}
                </Text>
              </View>
            )}
          </View>
          
          {/* Mood Selector - Only visible in manual mode */}
          {!autoMode && (
            <View style={styles.moodSection}>
              <Text style={styles.moodPrompt}>Select a different mood:</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.moodScrollView}
                contentContainerStyle={styles.moodButtonsContainer}
              >
                {moods.map((mood) => (
                  <TouchableOpacity
                    key={mood}
                    style={[
                      styles.moodButton,
                      selectedMood === mood && styles.selectedMoodButton
                    ]}
                    onPress={() => setSelectedMood(mood)}
                  >
                    <Text style={styles.moodIcon}>{moodIcons[mood]}</Text>
                    <Text 
                      style={[
                        styles.moodButtonText,
                        selectedMood === mood && styles.selectedMoodButtonText
                      ]}
                    >
                      {mood.charAt(0).toUpperCase() + mood.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          
          {/* Music Recommendations */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Music For You</Text>
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.recommendationsBox}>
              {musicRecommendations.map((item, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <View style={styles.musicIconContainer}>
                    <Text style={styles.musicIcon}>🎵</Text>
                  </View>
                  <View style={styles.itemContent}>
                    <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.itemSubtitle} numberOfLines={1}>{item.artist}</Text>
                  </View>
                  <TouchableOpacity style={styles.playButton}>
                    <Text>▶️</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
          
          {/* Movie Recommendations */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Movies & Shows</Text>
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.recommendationsBox}>
              {movieRecommendations.map((item, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <View style={styles.movieIconContainer}>
                    <Text style={styles.movieIcon}>🎬</Text>
                  </View>
                  <View style={styles.itemContent}>
                    <Text style={styles.itemTitle} numberOfLines={1}>{item.title} ({item.year})</Text>
                    <Text style={styles.itemSubtitle} numberOfLines={1}>{item.genre}</Text>
                  </View>
                  <TouchableOpacity style={styles.infoButton}>
                    <Text>ℹ️</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
          
          {/* Books Section with Enhanced UI */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Books & Reading</Text>
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>Coming Soon</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.comingSoonBox}>
              <Text style={styles.comingSoonIcon}>📚</Text>
              <Text style={styles.comingSoonText}>
                Book recommendations tailored to your mood are coming soon.
              </Text>
              <TouchableOpacity style={styles.notifyButton}>
                <Text style={styles.notifyButtonText}>Notify Me</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Mindful Activities */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Mindful Activities</Text>
            <MindfulActivitiesComponent selectedMood={selectedMood} />
          </View>
          
          {/* Daily Quote - New Addition */}
          <View style={styles.quoteContainer}>
            <LinearGradient
              colors={['rgba(147, 112, 219, 0.7)', 'rgba(147, 112, 219, 0.3)']}
              style={styles.quoteGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.quoteText}>
                "Happiness can be found even in the darkest of times, if one only remembers to turn on the light."
              </Text>
              <Text style={styles.quoteAuthor}>- Albus Dumbledore</Text>
            </LinearGradient>
          </View>
          
        </View>
      </ScrollView>
      
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  // New styles for auto-detected mood
  detectedMoodContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#9370DB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  detectedMoodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detectedMoodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
  },
  modeToggleButton: {
    backgroundColor: 'rgba(147, 112, 219, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  modeToggleText: {
    color: '#9370DB',
    fontSize: 12,
    fontWeight: '600',
  },
  detectedMoodContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodEmojiContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  moodEmoji: {
    fontSize: 24,
    color: 'white',
  },
  detectedMoodText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  // Original mood selection styles
  moodSection: {
    marginTop: 5,
    marginBottom: 20,
  },
  moodPrompt: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    marginLeft: 5,
  },
  moodScrollView: {
    marginBottom: 5,
  },
  moodButtonsContainer: {
    paddingVertical: 5,
    paddingHorizontal: 5,
  },
  moodButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedMoodButton: {
    backgroundColor: '#9370DB',
  },
  moodIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  moodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
  },
  selectedMoodButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllButton: {
    padding: 5,
  },
  viewAllText: {
    color: '#9370DB',
    fontWeight: '500',
    fontSize: 14,
  },
  recommendationsBox: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  recommendationItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#9370DB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  musicIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(147, 112, 219, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  musicIcon: {
    fontSize: 20,
  },
  movieIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(147, 112, 219, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  movieIcon: {
    fontSize: 20,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(147, 112, 219, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(147, 112, 219, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoonBox: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#9370DB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  comingSoonIcon: {
    fontSize: 40,
    marginBottom: 15,
  },
  comingSoonText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  notifyButton: {
    backgroundColor: '#9370DB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  notifyButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  quoteContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  quoteGradient: {
    borderRadius: 15,
    padding: 20,
    shadowColor: '#9370DB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 24,
  },
  quoteAuthor: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'right',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#9370DB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  fabIcon: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
});

export default RecommendationScreen;