import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';

const RecommendationScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recommendations</Text>
        <Text style={styles.subtitle}>Personalized wellness suggestions</Text>
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.sectionTitle}>Music Recommendations</Text>
        <View style={styles.placeholderBox}>
          <Text style={styles.placeholderText}>
            Music recommendations based on your mood will appear here.
          </Text>
        </View>
        
        <Text style={styles.sectionTitle}>Movies & Shows</Text>
        <View style={styles.placeholderBox}>
          <Text style={styles.placeholderText}>
            Movie and show recommendations will be displayed in this section.
          </Text>
        </View>
        
        <Text style={styles.sectionTitle}>Books & Reading</Text>
        <View style={styles.placeholderBox}>
          <Text style={styles.placeholderText}>
            Book recommendations will appear here.
          </Text>
        </View>
        
        <Text style={styles.sectionTitle}>Mindful Activities</Text>
        <View style={styles.placeholderBox}>
          <Text style={styles.placeholderText}>
            Suggested mindfulness exercises and activities will be shown here.
          </Text>
        </View>
        
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
});

export default RecommendationScreen;