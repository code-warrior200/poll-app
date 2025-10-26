import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Animated,
  ActivityIndicator,
  ScrollView,
  Alert,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

export default function VoteScreen() {
  const [candidatesData, setCandidatesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedVotes, setSelectedVotes] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // 🧭 Fetch candidates
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const response = await fetch('https://fue-vote-backend-1.onrender.com/api/candidates');
        if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
        const data = await response.json();

        const grouped = Object.values(
          data.reduce((acc: any, candidate: any) => {
            if (!acc[candidate.position]) {
              acc[candidate.position] = { position: candidate.position, candidates: [] };
            }
            acc[candidate.position].candidates.push(candidate);
            return acc;
          }, {})
        );

        setCandidatesData(grouped);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCandidates();
  }, []);

  const totalCategories = candidatesData.length;
  const currentCategory = candidatesData[currentIndex];

  if (loading)
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color="#00aa55" />
        <ThemedText style={{ marginTop: 10 }}>Loading candidates...</ThemedText>
      </ThemedView>
    );

  if (error)
    return (
      <ThemedView style={styles.centered}>
        <Ionicons name="alert-circle" size={50} color="red" />
        <ThemedText style={{ marginTop: 10, color: 'red' }}>{error}</ThemedText>
      </ThemedView>
    );

  if (candidatesData.length === 0)
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>No candidates found.</ThemedText>
      </ThemedView>
    );

  // ✅ Send vote request
  const sendVoteRequest = async (payload: any) => {
    const token = await SecureStore.getItemAsync('jwt_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    return await fetch('https://fue-vote-backend-1.onrender.com/api/vote', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  };

const handleVote = async () => {
  const position = currentCategory.position;
  const candidateId = selectedVotes[position];
  if (!candidateId) return;

  try {
    setIsSubmitting(true);
    const response = await sendVoteRequest({ position, candidateId });
    const text = await response.text();

    if (!response.ok) {
      if (text.includes('already voted')) {
        // Skip to next position if already voted
        if (currentIndex === totalCategories - 1) {
          setShowSummary(true);
        } else {
          setCurrentIndex(currentIndex + 1);
        }
        return;
      } else {
        Alert.alert('Error', text || 'Vote failed.');
        return;
      }
    }

    // Success: show check animation and move to next position
    setShowCheck(true);
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start(() => {
      setTimeout(() => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
          setShowCheck(false);
          if (currentIndex === totalCategories - 1) setShowSummary(true);
          else setCurrentIndex(currentIndex + 1);
        });
      }, 1200);
    });

  } catch (err) {
    console.error('Vote submission error:', err);
    Alert.alert('Error', 'Could not submit vote. Try again.');
  } finally {
    setIsSubmitting(false);
  }
};



  const handleBiometricVote = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to cast your vote',
      });
      if (result.success) await handleVote();
      else Alert.alert('Authentication Failed', 'Fingerprint not recognized.');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Biometric authentication failed.');
    }
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('jwt_token');
    router.replace('/');
  };

  const handleSelect = (id: string) => {
    setSelectedVotes((prev) => ({
      ...prev,
      [currentCategory.position]: id,
    }));
  };

  // 🧾 Summary
  if (showSummary)
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.header}>
          Voting Summary
        </ThemedText>
        <ScrollView showsVerticalScrollIndicator={false}>
          {candidatesData.map((category) => {
            const candidate = category.candidates.find(
              (c: any) => c.id === selectedVotes[category.position]
            );
            return (
              <View key={category.position} style={styles.summaryCard}>
                <ThemedText style={styles.positionText}>{category.position}</ThemedText>
                {candidate ? (
                  <View style={styles.summaryRow}>
                    <Image source={{ uri: candidate.image }} style={styles.summaryAvatar} />
                    <View style={{ flex: 1 }}>
                      <ThemedText style={styles.name}>{candidate.name}</ThemedText>
                      <ThemedText style={styles.dept}>{candidate.dept}</ThemedText>
                      <ThemedText style={styles.voteCount}>Total Votes: {candidate.totalVotes || 0}</ThemedText>
                    </View>
                  </View>
                ) : (
                  <ThemedText style={{ color: '#999', marginTop: 8 }}>No candidate selected</ThemedText>
                )}
              </View>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          style={[styles.voteButton, { backgroundColor: '#00aa55' }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
          <ThemedText style={styles.voteText}>Logout</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );

  // 🧍 Candidate render
  const renderCandidate = ({ item }: { item: any }) => {
    const selected = selectedVotes[currentCategory.position] === item.id;
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.card, selected && styles.selectedCard]}
        onPress={() => handleSelect(item.id)}
        disabled={isSubmitting}
      >
        <Image source={{ uri: item.image }} style={styles.avatar} />
        <View style={styles.cardText}>
          <ThemedText style={styles.name}>{item.name}</ThemedText>
          <ThemedText style={styles.dept}>{item.dept}</ThemedText>
          {item.totalVotes !== undefined && (
            <ThemedText style={styles.voteCount}>Votes: {item.totalVotes}</ThemedText>
          )}
        </View>
        {selected && <Ionicons name="checkmark-circle" size={26} color="#00aa55" />}
      </TouchableOpacity>
    );
  };

  // 🗳️ Main voting screen
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.header}>
        {currentCategory.position}
      </ThemedText>

      <View style={styles.progressContainer}>
        <ThemedText style={styles.progressText}>
          {currentIndex + 1} of {totalCategories} positions
        </ThemedText>
      </View>

      <FlatList
        data={currentCategory.candidates}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderCandidate}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      />

      {/* Navigation */}
      <View style={styles.navContainer}>
        <TouchableOpacity
          disabled={currentIndex === 0}
          onPress={() => setCurrentIndex(currentIndex - 1)}
          style={[styles.navButton, currentIndex === 0 && { opacity: 0.5 }]}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          disabled={currentIndex === totalCategories - 1}
          onPress={() => setCurrentIndex(currentIndex + 1)}
          style={[styles.navButton, currentIndex === totalCategories - 1 && { opacity: 0.5 }]}
        >
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.voteButton, (!selectedVotes[currentCategory.position] || isSubmitting) && { backgroundColor: '#ccc' }]}
        disabled={!selectedVotes[currentCategory.position] || isSubmitting}
        onPress={handleBiometricVote}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="finger-print" size={22} color="#fff" style={{ marginRight: 8 }} />
            <ThemedText style={styles.voteText}>Cast Vote (Fingerprint)</ThemedText>
          </View>
        )}
      </TouchableOpacity>

      {toastMessage && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {showCheck && (
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <Ionicons name="checkmark-circle" size={90} color="#00aa55" />
          <ThemedText style={styles.successText}>Vote Recorded!</ThemedText>
        </Animated.View>
      )}
    </ThemedView>
  );
}

// 🎨 Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafc', padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  progressContainer: { alignItems: 'center', marginBottom: 6 },
  progressText: { fontSize: 14, color: '#666' },
  header: { textAlign: 'center', fontSize: 24, fontWeight: '700', marginBottom: 10, marginTop: 46, color: '#1a1a1a' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginVertical: 8,
    elevation: 2,
  },
  selectedCard: { borderWidth: 2, borderColor: '#00aa55' },
  avatar: { width: 54, height: 54, borderRadius: 27, marginRight: 14 },
  cardText: { flex: 1 },
  name: { fontSize: 17, fontWeight: '600', color: '#111' },
  dept: { fontSize: 14, color: '#666' },
  voteCount: { fontSize: 12, color: '#888', marginTop: 4 },
  voteButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#00aa55',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  voteText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(249, 250, 252, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successText: { marginTop: 12, fontSize: 20, fontWeight: '600', color: '#00aa55' },
  summaryCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginVertical: 8 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  positionText: { fontSize: 16, fontWeight: '700', color: '#00aa55' },
  summaryAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  toastContainer: { position: 'absolute', bottom: 100, left: 20, right: 20, backgroundColor: '#333', paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  toastText: { color: '#fff', fontWeight: '600' },
  navContainer: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10 },
  navButton: { backgroundColor: '#00aa55', padding: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
