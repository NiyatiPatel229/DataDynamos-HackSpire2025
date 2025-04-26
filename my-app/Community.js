import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, SafeAreaView, ActivityIndicator, Alert, Platform, Animated, Dimensions } from 'react-native';
import { db, auth } from './firebase'; // your firebase config
import { ref, onValue, off, push, set, update, query, orderByChild, limitToLast, remove } from 'firebase/database';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
const randomNames = ["Fox", "Cat", "Wolf", "Panda", "Rabbit", "Tiger", "Owl", "Eagle", "Koala", "Lion"];

// Get screen dimensions for responsive design
const { width, height } = Dimensions.get('window');

const Community = () => {
  const [tips, setTips] = useState([]);
  const [newTip, setNewTip] = useState('');
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState({}); // New state to store comments
  const [newComment, setNewComment] = useState({}); // New state to store typing comments
  const [showCommentBox, setShowCommentBox] = useState({}); // State to track which tips have comment box visible
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Colors
  const primaryColor = '#9370DB'; // Medium Purple
  const secondaryColor = '#7B68EE'; // Medium Slate Blue
  const accentColor = '#B19CD9'; // Light Purple
  const darkAccent = '#6A5ACD'; // Slate Blue
  const lightBackground = '#F8F7FF'; // Very Light Purple
  const cardBackground = '#FFFFFF'; // White
  
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    const tipsRef = query(ref(db, 'tips'), limitToLast(100));
    const listener = onValue(
      tipsRef,
      snapshot => {
        const data = snapshot.val();
        if (data) {
          const loadedTips = Object.keys(data).map(key => ({
            id: key,
            ...data[key],
            // Add an isOwner field to each tip
            isOwner: data[key].userId === auth.currentUser?.uid
          })).sort((a, b) => b.timestamp - a.timestamp);
          setTips(loadedTips);
        } else {
          setTips([]);
        }
        setLoading(false);
      },
      error => {
        console.error('Database read failed:', error);
        Alert.alert('Database Error', error.message);
        setLoading(false);
      }
    );

    return () => {
      off(tipsRef, 'value', listener);
    };
  }, []);

  const handleAddTip = async () => {
    if (!newTip.trim()) return;
    if (!auth.currentUser) {
      Alert.alert('Authentication Required', 'Please sign in to share tips.');
      return;
    }
    try {
      const newTipRef = push(ref(db, 'tips'));
      const randomName = randomNames[Math.floor(Math.random() * randomNames.length)];
      await set(newTipRef, {
        author: randomName,
        content: newTip.trim(),
        timestamp: Date.now(),
        likes: 0,
        likedBy: {},
        comments: {},
        userId: auth.currentUser.uid, // Store user ID to identify ownership
      });
      setNewTip('');
    } catch (error) {
      console.error('Failed to add tip:', error);
      Alert.alert('Error', 'Could not post tip.');
    }
  };

  const handleDeleteTip = async (tipId) => {
    if (!auth.currentUser) {
      Alert.alert('Authentication Required', 'Please sign in to delete tips.');
      return;
    }
    
    try {
      // Confirm before deleting
      Alert.alert(
        'Delete Tip',
        'Are you sure you want to delete this tip?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete', 
            style: 'destructive',
            onPress: async () => {
              const tipRef = ref(db, `tips/${tipId}`);
              await remove(tipRef);
              Alert.alert('Success', 'Tip deleted successfully.');
            },
          },
        ],
        { cancelable: true }
      );
    } catch (error) {
      console.error('Failed to delete tip:', error);
      Alert.alert('Error', 'Could not delete tip.');
    }
  };

  const handleLike = async (tipId, currentLikes, liked) => {
    if (!auth.currentUser) {
      Alert.alert('Authentication Required', 'Please sign in to like tips.');
      return;
    }
    try {
      const tipRef = ref(db, `tips/${tipId}`);
      const userId = auth.currentUser.uid;
      await update(tipRef, {
        likes: liked ? currentLikes - 1 : currentLikes + 1,
        [`likedBy/${userId}`]: liked ? null : true,
      });
    } catch (error) {
      console.error('Failed to like tip:', error);
    }
  };
  
  const toggleCommentBox = (tipId) => {
    setShowCommentBox(prev => ({
      ...prev,
      [tipId]: !prev[tipId]
    }));
  };

  const handleAddComment = async (tipId) => {
    if (!newComment[tipId]?.trim()) return;
    if (!auth.currentUser) {
      Alert.alert('Authentication Required', 'Please sign in to comment.');
      return;
    }
    try {
      const tipCommentsRef = ref(db, `tips/${tipId}/comments`);
      const commentRef = push(tipCommentsRef);
      await set(commentRef, {
        text: newComment[tipId],
        timestamp: Date.now(),
        author: 'Anonymous', // Always set the author name as Anonymous
        userId: auth.currentUser.uid, // Still store the userId for potential future use
      });
      setNewComment(prev => ({ ...prev, [tipId]: '' }));
      
      // Hide comment box after successful comment
      setShowCommentBox(prev => ({
        ...prev,
        [tipId]: false
      }));
    } catch (error) {
      console.error('Failed to add comment:', error);
      Alert.alert('Error', 'Could not post comment.');
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = Date.now();
    const seconds = Math.floor((now - timestamp) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const renderTip = ({ item, index }) => {
    const liked = !!item.likedBy?.[auth.currentUser?.uid];
    const tipComments = item.comments ? Object.values(item.comments) : [];
    const isCommentBoxVisible = showCommentBox[item.id];
    const isMyTip = item.userId === auth.currentUser?.uid;

    return (
      <Animated.View 
        style={[
          styles.tipCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0]
            })}]
          }
        ]}
      >
        <View style={styles.header}>
          <View style={[styles.avatar, {backgroundColor: getColorForName(item.author)}]}>
            <Text style={styles.avatarText}>{item.author[0]}</Text>
          </View>
          <View style={styles.authorContainer}>
            <Text style={styles.tipAuthor}>{item.author}</Text>
            <Text style={styles.timeAgo}>{formatTimeAgo(item.timestamp)}</Text>
          </View>
          
          {/* Delete button - only visible for user's own tips */}
          {isMyTip && (
            <TouchableOpacity 
              onPress={() => handleDeleteTip(item.id)}
              style={styles.deleteButton}
            >
              <Ionicons name="close" size={16} color="#ff3b30" />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.tipContent}>{item.content}</Text>

        <View style={styles.actions}>
          <TouchableOpacity 
            onPress={() => handleLike(item.id, item.likes, liked)}
            style={styles.actionButton}
          >
            <Ionicons 
              name={liked ? "heart" : "heart-outline"} 
              size={22} 
              color={liked ? "#ff3b30" : "#666"}
            />
            <Text style={styles.actionCount}>{item.likes}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => toggleCommentBox(item.id)}
            style={styles.actionButton}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#666" />
            <Text style={styles.actionCount}>{tipComments.length}</Text>
          </TouchableOpacity>
        </View>

        {/* Comments Section */}
        {tipComments.length > 0 && (
          <View style={styles.commentsContainer}>
            {tipComments.map((cmt, idx) => (
              <View key={idx} style={styles.comment}>
                <Ionicons name="person-circle-outline" size={18} color="#666" style={styles.commentIcon} />
                <View style={styles.commentContent}>
                  <Text style={styles.commentAuthor}>Anonymous</Text>
                  <Text style={styles.commentText}>{cmt.text}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Add Comment Input - Only shown when comment button is clicked */}
        {isCommentBoxVisible && (
          <View style={styles.commentInputRow}>
            <TextInput
              value={newComment[item.id] || ''}
              onChangeText={text => setNewComment(prev => ({ ...prev, [item.id]: text }))}
              placeholder="Write a comment..."
              style={styles.commentInput}
            />
            <TouchableOpacity onPress={() => handleAddComment(item.id)} style={styles.commentButton}>
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    );
  };

  // Get a consistent color based on the name
  const getColorForName = (name) => {
    const colors = ['#FFD6E0', '#FFEFCF', '#D1F0FF', '#C3E5AE', '#D4C1EC', '#FFCBC1', '#C5D8FF'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#9370DB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[primaryColor, secondaryColor, darkAccent]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Text style={styles.title}>Community</Text>
          <Text style={styles.subtitle}>Share and discover wellness tips</Text>
        </View>
      </LinearGradient>
      
      <View style={styles.inputContainer}>
        <TextInput
          value={newTip}
          onChangeText={setNewTip}
          placeholder="Share your wellness tip..."
          style={styles.input}
          multiline
          placeholderTextColor="#A8A8A8"
        />
        <TouchableOpacity 
          onPress={handleAddTip} 
          style={styles.shareButton}
          activeOpacity={0.8}
        >
          <Ionicons name="send" size={18} color="white" style={{marginRight: 8}} />
          <Text style={styles.shareText}>Share Tip</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={tips}
        keyExtractor={item => item.id}
        renderItem={renderTip}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f4ff' 
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : 70,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  subtitle: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
  },
  inputContainer: { 
    padding: 16,
    marginTop: 10,
    marginHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  input: { 
    backgroundColor: '#f9f9f9', 
    padding: 14, 
    borderRadius: 8, 
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    fontSize: 16,
  },
  shareButton: { 
    marginTop: 12, 
    backgroundColor: '#9370DB', 
    padding: 14, 
    borderRadius: 8, 
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#9370DB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  shareText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16
  },
  listContainer: { 
    padding: 16, 
    paddingBottom: 80,
  },
  tipCard: { 
    backgroundColor: '#fff', 
    padding: 18, 
    borderRadius: 14, 
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  avatar: { 
    width: 42, 
    height: 42, 
    borderRadius: 21, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  avatarText: { 
    fontWeight: 'bold', 
    color: '#5e48c4',
    fontSize: 18,
  },
  authorContainer: {
    marginLeft: 12,
    flex: 1,
  },
  tipAuthor: { 
    fontWeight: 'bold', 
    fontSize: 16,
    color: '#333',
  },
  timeAgo: { 
    fontSize: 12, 
    color: '#888',
  },
  deleteButton: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipContent: { 
    marginBottom: 16, 
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
  },
  actions: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    paddingVertical: 8,
  },
  actionCount: {
    color: '#666',
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '500',
  },
  commentsContainer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  comment: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    backgroundColor: '#f9f9f9', 
    padding: 10, 
    borderRadius: 10, 
    marginTop: 8,
  },
  commentIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  commentContent: {
    flex: 1,
  },
  commentAuthor: { 
    fontWeight: 'bold', 
    fontSize: 13,
    color: '#555',
  },
  commentText: { 
    fontSize: 14, 
    color: '#333',
  },
  commentInputRow: { 
    flexDirection: 'row', 
    marginTop: 12,
    alignItems: 'center',
  },
  commentInput: { 
    flex: 1, 
    backgroundColor: '#f5f5f5', 
    padding: 10, 
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 16,
  },
  commentButton: { 
    backgroundColor: '#9370DB', 
    padding: 10,
    width: 40,
    height: 40, 
    borderRadius: 20,
    marginLeft: 8, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  loading: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#f8f4ff',
  },
});

export default Community;