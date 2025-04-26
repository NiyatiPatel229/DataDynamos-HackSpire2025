import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; // ✅ Correct import for Expo
import { Ionicons } from '@expo/vector-icons'; // ✅ No change needed
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Check if user is already signed in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, navigate to home screen
        navigation?.navigate('Home');
      }
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [navigation]);

  const handleLogin = async () => {
    // Clear previous errors
    setError('');
    
    // Validate input
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    
    // Show loading indicator
    setIsLoading(true);
    
    try {
      // Attempt to sign in
      await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful');
      
      // Navigation will happen automatically due to the onAuthStateChanged listener
    } catch (error) {
      // Handle specific error codes
      let errorMessage = 'An error occurred during sign in. Please try again.';
      
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address format.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed login attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection.';
          break;
      }
      
      console.error('Login error:', error.code, error.message);
      setError(errorMessage);
      Alert.alert('Sign In Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    navigation?.navigate('Signup');
  };

  return (
    <LinearGradient
      colors={['#9370DB', '#9f83e1', '#b4a1e8']}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to your account</Text>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#9370DB" style={styles.icon} />
                <TextInput
                  placeholder="Email"
                  placeholderTextColor="#aaa"
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#9370DB" style={styles.icon} />
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#aaa"
                  style={styles.input}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
              
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>

            <TouchableOpacity 
              style={styles.button} 
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity>
              <Text style={styles.forgotPassword}>Forgot password?</Text>
            </TouchableOpacity>
            
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={handleRegister}>
                <Text style={styles.registerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 25,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    marginBottom: 25,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#9370DB',
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    position: 'relative',
    marginBottom: 15,
  },
  icon: {
    position: 'absolute',
    left: 15,
    top: 18,
    zIndex: 1,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    paddingVertical: 15,
    paddingLeft: 45,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#eee',
  },
  button: {
    backgroundColor: '#9370DB',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  forgotPassword: {
    color: '#9370DB',
    textAlign: 'center',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  errorText: {
    color: 'red',
    marginTop: 5,
    marginBottom: 10,
    textAlign: 'center',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  registerText: {
    color: '#555',
    fontSize: 14,
  },
  registerLink: {
    color: '#9370DB',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
