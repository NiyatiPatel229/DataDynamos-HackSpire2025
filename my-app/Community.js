import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';

const CommunityScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Community</Text>
        <Text style={styles.subtitle}>Connect with others on their wellness journey</Text>
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.sectionTitle}>Community Posts</Text>
        <View style={styles.placeholderBox}>
          <Text style={styles.placeholderText}>
            Anonymous community posts will appear here.
          </Text>
        </View>
        
        <Text style={styles.sectionTitle}>Wellness Tips</Text>
        <View style={styles.placeholderBox}>
          <Text style={styles.placeholderText}>
            User-shared wellness tips will be displayed in this section.
          </Text>
        </View>
        
        <Text style={styles.sectionTitle}>Support Groups</Text>
        <View style={styles.placeholderBox}>
          <Text style={styles.placeholderText}>
            Available support groups will be listed here.
          </Text>
        </View>
        
        <Text style={styles.sectionTitle}>Local Events</Text>
        <View style={styles.placeholderBox}>
          <Text style={styles.placeholderText}>
            Mental wellness events in your area will appear in this section.
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

export default CommunityScreen;