// app/vote-summaryScreen.tsx
import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function VoteSummaryScreen() {
  const { votes } = useLocalSearchParams();
  const parsedVotes = votes ? JSON.parse(votes as string) : {};
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showCheck, setShowCheck] = React.useState(false);

  const router = useRouter();

  const handleFinalSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setShowCheck(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          setIsSubmitting(false);
          router.replace('/'); // Redirect back home after submission
        }, 2000);
      });
    }, 1500);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.header}>Voting Summary</ThemedText>

      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {Object.keys(parsedVotes).map((position) => {
          const candidate = parsedVotes[position];
          return (
            <View key={position} style={styles.summaryCard}>
              <ThemedText style={styles.positionText}>{position}</ThemedText>
              {candidate ? (
                <View style={styles.summaryRow}>
                  <Image source={{ uri: candidate.image }} style={styles.summaryAvatar} />
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.name}>{candidate.name}</ThemedText>
                    <ThemedText style={styles.dept}>{candidate.dept}</ThemedText>
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
        style={[styles.voteButton, { backgroundColor: '#004a99' }]}
        onPress={handleFinalSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <ThemedText style={styles.voteText}>Submit All Votes</ThemedText>
        )}
      </TouchableOpacity>

      {showCheck && (
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <Ionicons name="checkmark-circle" size={90} color="#00aa55" />
          <ThemedText style={styles.successText}>All Votes Submitted!</ThemedText>
        </Animated.View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafc', padding: 20 },
  header: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginVertical: 8,
    elevation: 1,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  positionText: { fontSize: 16, fontWeight: '700', color: '#004a99' },
  summaryAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  name: { fontSize: 17, fontWeight: '600', color: '#111' },
  dept: { fontSize: 14, color: '#666' },
  voteButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#00aa55',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
  },
  voteText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(249, 250, 252, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successText: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: '600',
    color: '#00aa55',
  },
});
