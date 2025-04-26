import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { db, auth } from './firebase'; // your firebase config
import { ref, onValue, off, push, set, update, query, limitToLast, remove } from 'firebase/database';

const randomNames = ["Fox", "Cat", "Wolf", "Panda", "Rabbit", "Tiger", "Owl", "Eagle", "Koala", "Lion"];

const Community = () => {
  const [tips, setTips] = useState([]);
  const [newTip, setNewTip] = useState('');
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState({}); // New state to store comments
  const [newComment, setNewComment] = useState({}); // New state to store typing comments
  const [showCommentBox, setShowCommentBox] = useState({}); // State to track which tips have comment box visible

  useEffect(() => {
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

  const renderTip = ({ item }) => {
    const liked = !!item.likedBy?.[auth.currentUser?.uid];
    const tipComments = item.comments ? Object.values(item.comments) : [];
    const isCommentBoxVisible = showCommentBox[item.id];
    const isMyTip = item.userId === auth.currentUser?.uid;

    return (
      <View style={styles.tipCard}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.author[0]}</Text>
          </View>
          <Text style={styles.tipAuthor}>{item.author}</Text>
          <Text style={styles.timeAgo}>
            {Math.floor((Date.now() - item.timestamp) / 60000)} min ago
          </Text>
          
          {/* Delete button - only visible for user's own tips */}
          {isMyTip && (
            <TouchableOpacity 
              onPress={() => handleDeleteTip(item.id)}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.tipContent}>{item.content}</Text>

        <View style={styles.actions}>
          <TouchableOpacity 
            onPress={() => handleLike(item.id, item.likes, liked)}
            style={styles.actionButton}
          >
            <Text style={[styles.heartIcon, liked && styles.likedHeart]}>
              {liked ? '♥️' : '♡'}
            </Text>
            <Text style={styles.actionCount}>{item.likes}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => toggleCommentBox(item.id)}
            style={styles.actionButton}
          >
            <Text style={styles.commentIcon}>💬</Text>
            <Text style={styles.actionCount}>{tipComments.length}</Text>
          </TouchableOpacity>
        </View>

        {/* Comments Section */}
        {tipComments.map((cmt, idx) => (
          <View key={idx} style={styles.comment}>
            <Text style={styles.commentAuthor}>Anonymous:</Text>
            <Text style={styles.commentText}>{cmt.text}</Text>
          </View>
        ))}

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
              <Text style={{ color: '#fff' }}>Send</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#9370DB" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inputContainer}>
      <View style={styles.pageHeader}>
  <Text style={styles.pageTitle}>Community</Text>
  <Text style={styles.pageSubtitle}>Share and discover wellness tips</Text>
</View>
        <TextInput
          value={newTip}
          onChangeText={setNewTip}
          placeholder="Share your tip..."
          style={styles.input}
          multiline
        />
        <TouchableOpacity onPress={handleAddTip} style={styles.shareButton}>
          <Text style={styles.shareText}>Post Tip</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={tips}
        keyExtractor={item => item.id}
        renderItem={renderTip}
        contentContainerStyle={{ padding: 16 }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f4ff' },
  inputContainer: { padding: 16 },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, minHeight: 80 },
  shareButton: { marginTop: 10, backgroundColor: '#9370DB', padding: 12, borderRadius: 8, alignItems: 'center' },
  shareText: { color: '#fff', fontWeight: 'bold' },
  tipCard: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: { backgroundColor: '#d9d6f6', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: 'bold', color: '#5e48c4' },
  tipAuthor: { fontWeight: 'bold', marginLeft: 8 },
  timeAgo: { marginLeft: 'auto', fontSize: 12, color: 'gray', marginRight: 8 },
  deleteButton: { 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    color: '#ff3b30',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tipContent: { marginBottom: 8, marginTop: 4 },
  actions: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    paddingVertical: 5,
  },
  heartIcon: {
    fontSize: 20,
    color: '#999',
    marginRight: 4
  },
  likedHeart: {
    color: '#ff3b30',
  },
  commentIcon: {
    fontSize: 18,
    color: '#999',
    marginRight: 4
  },
  actionCount: {
    color: '#666',
    fontSize: 14
  },
  comment: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0edff', padding: 8, borderRadius: 8, marginTop: 6 },
  commentAuthor: { fontWeight: 'bold', marginRight: 4 },
  commentText: { flexShrink: 1 },
  commentInputRow: { flexDirection: 'row', marginTop: 8 },
  commentInput: { flex: 1, backgroundColor: '#f0edff', padding: 8, borderRadius: 8 },
  commentButton: { backgroundColor: '#9370DB', padding: 10, marginLeft: 8, borderRadius: 8 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default Community;