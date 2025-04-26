import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import MindfulActivitiesComponent from './MindfulActivitiesComponent'; // Import the new component

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

const RecommendationScreen = () => {
  const [selectedMood, setSelectedMood] = useState('happy');
  const [musicRecommendations, setMusicRecommendations] = useState(moodData.happy.music);
  const [movieRecommendations, setMovieRecommendations] = useState(moodData.happy.movies);
  
  const moods = [
    'happy', 'sad', 'energetic', 'relaxed', 'anxious',
    'romantic', 'focused', 'nostalgic', 'angry', 'inspired'
  ];
  
  // Update recommendations when mood changes
  useEffect(() => {
    if (moodData[selectedMood]) {
      setMusicRecommendations(moodData[selectedMood].music);
      setMovieRecommendations(moodData[selectedMood].movies);
    }
  }, [selectedMood]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recommendations</Text>
        <Text style={styles.subtitle}>Personalized wellness suggestions</Text>
      </View>
      
      <View style={styles.contentContainer}>
        {/* Mood Selector */}
        <Text style={styles.moodPrompt}>How are you feeling today?</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.moodScrollView}
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
        
        {/* Music Recommendations */}
        <Text style={styles.sectionTitle}>Music Recommendations</Text>
        <View style={styles.recommendationsBox}>
          {musicRecommendations.map((item, index) => (
            <View key={index} style={styles.recommendationItem}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemSubtitle}>{item.artist}</Text>
            </View>
          ))}
        </View>
        
        {/* Movie Recommendations */}
        <Text style={styles.sectionTitle}>Movies & Shows</Text>
        <View style={styles.recommendationsBox}>
          {movieRecommendations.map((item, index) => (
            <View key={index} style={styles.recommendationItem}>
              <Text style={styles.itemTitle}>{item.title} ({item.year})</Text>
              <Text style={styles.itemSubtitle}>{item.genre}</Text>
            </View>
          ))}
        </View>
        
        {/* Placeholder sections */}
        <Text style={styles.sectionTitle}>Books & Reading</Text>
        <View style={styles.placeholderBox}>
          <Text style={styles.placeholderText}>
            Book recommendations will appear here.
          </Text>
        </View>
        
        {/* Mindful Activities - replaced placeholder with the new component */}
        <Text style={styles.sectionTitle}>Mindful Activities</Text>
        <MindfulActivitiesComponent selectedMood={selectedMood} />
        
        <Text style={styles.sectionTitle}>Nearby Places</Text>
        <View style={styles.placeholderBox}>
          <Text style={styles.placeholderText}>
            Recommended locations near you will be listed in this section.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
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
  moodPrompt: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 12,
  },
  moodScrollView: {
    marginBottom: 20,
  },
  moodButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },
  selectedMoodButton: {
    backgroundColor: '#6200ee',
  },
  moodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  selectedMoodButtonText: {
    color: 'white',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  recommendationsBox: {
    marginBottom: 15,
  },
  recommendationItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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
});

export default RecommendationScreen;