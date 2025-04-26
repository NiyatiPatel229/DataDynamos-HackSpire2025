import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';

const HomeScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to MindMosaic</Text>
        <Text style={styles.subtitle}>How are you feeling today?</Text>
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.sectionTitle}>Daily Check-in</Text>
        <View style={styles.placeholderBox}>
          <Text style={styles.placeholderText}>
            This is where the mood check-in feature will be implemented.
          </Text>
        </View>
        
        <Text style={styles.sectionTitle}>Your Mood Insights</Text>
        <View style={styles.placeholderBox}>
          <Text style={styles.placeholderText}>
            Mood tracking and insights will appear here.
          </Text>
        </View>
        
        <Text style={styles.sectionTitle}>Today's Wellness Tip</Text>
        <View style={styles.placeholderBox}>
          <Text style={styles.placeholderText}>
            Daily wellness tips and suggestions will be displayed in this section.
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

export default HomeScreen;