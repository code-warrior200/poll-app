// app/vote.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Animated,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// 🗳️ Extended Dummy Data (with 20+ candidates)
const mockData = [
  {
    position: 'President',
    candidates: [
      { id: '1', name: 'John Doe', dept: 'Computer Science', image: 'https://randomuser.me/api/portraits/men/1.jpg' },
      { id: '2', name: 'Aisha Bello', dept: 'Business Admin', image: 'https://randomuser.me/api/portraits/women/2.jpg' },
    ],
  },
  {
    position: 'Vice President',
    candidates: [
      { id: '3', name: 'Michael Okoro', dept: 'Engineering', image: 'https://randomuser.me/api/portraits/men/3.jpg' },
      { id: '4', name: 'Chiamaka Uche', dept: 'Mass Communication', image: 'https://randomuser.me/api/portraits/women/4.jpg' },
    ],
  },
];

export default function VoteScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedVotes, setSelectedVotes] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showSummary, setShowSummary] = useState(false);

  // ✨ New animated values for category transitions
  const fadeCategory = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const totalCategories = mockData.length;
  const isLastCategory = currentIndex === totalCategories - 1;
  const currentCategory = mockData[currentIndex];

  const handleVote = () => {
    if (!selectedVotes[currentCategory.position]) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowCheck(true);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start(() => {
        setTimeout(() => {
          Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
            setShowCheck(false);

            // 🌟 Animate transition between categories
            Animated.parallel([
              Animated.timing(fadeCategory, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(slideAnim, {
                toValue: -20,
                duration: 300,
                useNativeDriver: true,
              }),
            ]).start(() => {
              if (!isLastCategory) {
                setCurrentIndex((prev) => prev + 1);
              } else {
                setShowSummary(true);
              }

              // reset + animate in
              slideAnim.setValue(20);
              Animated.parallel([
                Animated.timing(fadeCategory, {
                  toValue: 1,
                  duration: 300,
                  useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                  toValue: 0,
                  duration: 300,
                  useNativeDriver: true,
                }),
              ]).start();
            });
          });
        }, 1500);
      });
    }, 1000);
  };

  const handleSelect = (id: string) => {
    setSelectedVotes((prev) => ({
      ...prev,
      [currentCategory.position]: id,
    }));
  };

  const handleFinalSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setShowCheck(true);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      setIsSubmitting(false);
    }, 1500);
  };

  if (showSummary) {
    return (
      <Animated.View
        style={{
          flex: 1,
          opacity: fadeCategory,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <ThemedView style={styles.container}>
          <ThemedText type="title" style={styles.header}>
            Voting Summary
          </ThemedText>

          <ScrollView showsVerticalScrollIndicator={true}>
            {mockData.map((category) => {
              const candidate = category.candidates.find((c) => c.id === selectedVotes[category.position]);
              return (
                <View key={category.position} style={styles.summaryCard}>
                  <ThemedText style={styles.positionText}>{category.position}</ThemedText>
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
            style={[styles.voteButton, { backgroundColor: '#00aa55' }]}
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
      </Animated.View>
    );
  }

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
        </View>
        {selected && <Ionicons name="checkmark-circle" size={26} color="#00aa55" />}
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <Animated.View
        style={{
          opacity: fadeCategory,
          transform: [{ translateY: slideAnim }],
          flex: 1,
        }}
      >
        <FlatList
          data={currentCategory.candidates}
          keyExtractor={(item) => item.id}
          renderItem={renderCandidate}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              <View style={styles.progressContainer}>
                <ThemedText style={styles.progressText}>
                  {currentIndex + 1} of {totalCategories} positions
                </ThemedText>
              </View>
              <ThemedText type="title" style={styles.header}>
                {currentCategory.position}
              </ThemedText>
            </>
          }
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      </Animated.View>

      <TouchableOpacity
        style={[
          styles.voteButton,
          (!selectedVotes[currentCategory.position] || isSubmitting) && { backgroundColor: '#ccc' },
        ]}
        disabled={!selectedVotes[currentCategory.position] || isSubmitting}
        onPress={handleVote}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <ThemedText style={styles.voteText}>
            {isLastCategory ? 'View Summary' : 'Cast Vote'}
          </ThemedText>
        )}
      </TouchableOpacity>

      {showCheck && (
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <Ionicons name="checkmark-circle" size={90} color="#00aa55" />
          <ThemedText style={styles.successText}>Vote Recorded!</ThemedText>
        </Animated.View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafc', padding: 20 },
  progressContainer: { alignItems: 'center', marginBottom: 6 },
  progressText: { fontSize: 14, color: '#666' },
  header: { textAlign: 'center', fontSize: 24, fontWeight: '700', marginBottom: 16, color: '#1a1a1a' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  selectedCard: { borderWidth: 2, borderColor: '#00aa55', shadowColor: '#00aa55', shadowOpacity: 0.15 },
  avatar: { width: 54, height: 54, borderRadius: 27, marginRight: 14 },
  cardText: { flex: 1 },
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
  successText: { marginTop: 12, fontSize: 20, fontWeight: '600', color: '#00aa55' },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginVertical: 8,
    elevation: 1,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  positionText: { fontSize: 16, fontWeight: '700', color: '#00aa55' },
  summaryAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
});
