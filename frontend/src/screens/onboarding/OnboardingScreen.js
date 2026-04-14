import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, Dimensions, Animated
} from 'react-native';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1', emoji: '📸',
    title: 'Rasm olishni o\'rgan',
    desc: 'Kompozitsiya, yoritish, rang muvozanati — barchasini amalda o\'rganing',
  },
  {
    id: '2', emoji: '🤖',
    title: 'AI sizni baholaydi',
    desc: 'Rasmlaringizni yuklang, Claude AI professional tahlil va tavsiyalar beradi',
  },
  {
    id: '3', emoji: '🌟',
    title: 'Hamjamiyatga qo\'shiling',
    desc: 'Boshqa fotograflar bilan bog\'laning, ilhomlaning va o\'sib boring',
  },
];

export default function OnboardingScreen({ navigation }) {
  const [current, setCurrent] = useState(0);
  const flatRef = useRef(null);

  const next = () => {
    if (current < SLIDES.length - 1) {
      flatRef.current.scrollToIndex({ index: current + 1 });
      setCurrent(current + 1);
    } else {
      navigation.replace('Register');
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatRef}
        data={SLIDES}
        horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        keyExtractor={(i) => i.id}
        onMomentumScrollEnd={(e) => setCurrent(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.desc}>{item.desc}</Text>
          </View>
        )}
      />

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === current && styles.dotActive]} />
        ))}
      </View>

      <TouchableOpacity style={styles.btn} onPress={next}>
        <Text style={styles.btnText}>
          {current === SLIDES.length - 1 ? 'Boshlash' : 'Keyingisi'}
        </Text>
      </TouchableOpacity>

      {current < SLIDES.length - 1 && (
        <TouchableOpacity onPress={() => navigation.replace('Register')}>
          <Text style={styles.skip}>O'tkazib yuborish</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingBottom: 48 },
  slide: {
    width, flex: 1, justifyContent: 'center',
    alignItems: 'center', padding: 40
  },
  emoji: { fontSize: 80, marginBottom: 28 },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center', color: '#1a1a1a', marginBottom: 14 },
  desc: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 28 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ddd' },
  dotActive: { backgroundColor: '#6C63FF', width: 24 },
  btn: {
    backgroundColor: '#6C63FF', borderRadius: 14, marginHorizontal: 28,
    padding: 16, alignItems: 'center', marginBottom: 12
  },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  skip: { textAlign: 'center', color: '#aaa', fontSize: 14, padding: 8 },
});
