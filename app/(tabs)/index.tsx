/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { 
  StyleSheet, 
  Alert, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  View, 
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 🔹 Fingerprint Login Handler
  const handleFingerprintLogin = async () => {
    if (!studentId.trim()) {
      Alert.alert('Missing Info', 'Please enter your Student ID.');
      return;
    }

    setLoading(true);
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      if (!compatible || !enrolled) {
        Alert.alert('Unavailable', 'Fingerprint authentication not available on this device.');
        setLoading(false);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access voting system',
      });

      if (result.success) {
        Alert.alert('Login Successful', `Welcome, ${studentId}`);
        router.push('/home');
      } else {
        Alert.alert('Authentication Failed', 'Fingerprint did not match.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Manual Login Handler
  const handleManualLogin = () => {
    if (!studentId.trim()) {
      Alert.alert('Missing Info', 'Please enter your Student ID.');
      return;
    }
    Alert.alert('Login Successful', `Welcome, ${studentId}`);
    router.push('/home');
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}
      >
        {/* 🔹 Logo + Title Section */}
        <View style={styles.logoContainer}>
          {/* <Image 
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/8371/8371769.png' }} 
            style={styles.logo}
          /> */}
          <ThemedText type="title" style={styles.title}>
            FUEZ Smart Voting
          </ThemedText>
        </View>

        {/* 🔹 Login Form */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Enter Student ID"
            placeholderTextColor="#807878ff"
            value={studentId}
            onChangeText={setStudentId}
          />

          {/* 🔸 Manual Login Button */}
          <TouchableOpacity
            style={[styles.button, styles.manualButton]}
            onPress={handleManualLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.buttonContent}>
                <MaterialCommunityIcons name="account" size={22} color="#fff" />
                <ThemedText style={styles.buttonText}>Login</ThemedText>
              </View>
            )}
          </TouchableOpacity>

          {/* 🔸 Biometric Login Button */}
          <TouchableOpacity
            style={[styles.button, styles.fingerprintButton]}
            onPress={handleFingerprintLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.buttonContent}>
                <ThemedText style={styles.buttonText}>Fingerprint login</ThemedText>
                <MaterialCommunityIcons name="fingerprint" size={24} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* 🔹 Footer */}
        <ThemedText style={styles.footerText}>
          © {new Date().getFullYear()} FUEZ Student Election
        </ThemedText>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8faff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    alignItems: 'center',
    color: '#00aa55',
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  form: {
    width: '100%',
    gap: 14,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
    color: '#333',
    elevation: 1,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  manualButton: {
    backgroundColor: '#00aa55',
    shadowColor: '#fff',
  },
  fingerprintButton: {
    backgroundColor: '#00aa55',
    shadowColor: '#ffF',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  footerText: {
    marginTop: 40,
    color: '#777',
    fontSize: 12,
  },
});
