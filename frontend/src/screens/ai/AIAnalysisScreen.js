import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Dimensions,
} from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { analyzePhoto, getAnalysis } from '../../services/api';

const { width } = Dimensions.get('window');

const ScoreBar = ({ label, score }) => {
  const color = score >= 7 ? '#1D9E75' : score >= 5 ? '#EF9F27' : '#E24B4A';
  return (
    <View style={s.scoreRow}>
      <Text style={s.scoreLabel}>{label}</Text>
      <View style={s.barBg}>
        <View style={[s.barFill, { width: `${score * 10}%`, backgroundColor: color }]} />
      </View>
      <View style={[s.scoreBadge, { backgroundColor: color + '18' }]}>
        <Text style={[s.scoreNum, { color }]}>{score}</Text>
      </View>
    </View>
  );
};

export default function AIAnalysisScreen({ route }) {
  const { photo, photoId } = route.params || {};
  const id = photo?.id || photoId;
  const imageUrl = photo?.image_url;

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => { checkExisting(); }, []);

  const checkExisting = async () => {
    try {
      const data = await getAnalysis(id);
      setAnalysis(data.analysis);
    } catch {}
    setChecked(true);
  };

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const data = await analyzePhoto(id);
      setAnalysis(data.analysis);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const getOverallColor = (score) => {
    if (score >= 8) return '#1D9E75';
    if (score >= 6) return '#6C63FF';
    if (score >= 4) return '#EF9F27';
    return '#E24B4A';
  };

  const getOverallLabel = (score) => {
    if (score >= 9) return 'Ajoyib';
    if (score >= 7) return 'Yaxshi';
    if (score >= 5) return "O'rta";
    return 'Yaxshilash kerak';
  };

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* IMAGE */}
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={s.image} resizeMode="cover" />
      ) : (
        <View style={s.imagePlaceholder}>
          <Ionicons name="image-outline" size={48} color="#ddd" />
        </View>
      )}

      {!checked ? (
        <View style={s.centerBox}>
          <ActivityIndicator color="#6C63FF" size="large" />
          <Text style={s.checkingText}>Tekshirilmoqda...</Text>
        </View>
      ) : !analysis ? (
        /* NO ANALYSIS */
        <View style={s.noAnalysis}>
          <View style={s.noAnalysisIconWrap}>
            <MaterialIcons name="auto-awesome" size={44} color="#6C63FF" />
          </View>
          <Text style={s.noAnalysisTitle}>AI Tahlil</Text>
          <Text style={s.noAnalysisText}>
            Claude AI rasmingizni kompozitsiya, yoritish va rang jihatidan professional tarzda baholaydi
          </Text>
          <View style={s.featureRow}>
            {[
              { icon: 'grid-outline', text: 'Kompozitsiya' },
              { icon: 'sunny-outline', text: 'Yoritish' },
              { icon: 'color-palette-outline', text: 'Ranglar' },
            ].map((f, i) => (
              <View key={i} style={s.featureItem}>
                <View style={s.featureIconBox}>
                  <Ionicons name={f.icon} size={18} color="#6C63FF" />
                </View>
                <Text style={s.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={s.analyzeBtn} onPress={runAnalysis} disabled={loading} activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View style={s.analyzeBtnInner}>
                <MaterialIcons name="auto-awesome" size={18} color="#fff" />
                <Text style={s.analyzeBtnText}>Tahlil boshlash</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        /* ANALYSIS RESULT */
        <View style={s.result}>
          {/* OVERALL SCORE */}
          <View style={[s.overallCard, { backgroundColor: getOverallColor(analysis.overall_score) }]}>
            <Text style={s.overallLabel}>Umumiy baho</Text>
            <Text style={s.overallScore}>{analysis.overall_score}<Text style={s.overallMax}>/10</Text></Text>
            <View style={s.overallBadge}>
              <Text style={[s.overallBadgeText, { color: getOverallColor(analysis.overall_score) }]}>
                {getOverallLabel(analysis.overall_score)}
              </Text>
            </View>
          </View>

          {/* SCORES */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Balllar</Text>
            <ScoreBar label="Kompozitsiya" score={analysis.composition_score} />
            <ScoreBar label="Yoritish" score={analysis.lighting_score} />
          </View>

          {/* FEEDBACK */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Tahlil</Text>
            <View style={s.feedbackItem}>
              <View style={s.feedbackIconBox}>
                <Ionicons name="grid-outline" size={16} color="#6C63FF" />
              </View>
              <View style={s.feedbackContent}>
                <Text style={s.feedbackLabel}>Kompozitsiya</Text>
                <Text style={s.feedbackText}>{analysis.composition_feedback}</Text>
              </View>
            </View>
            <View style={s.feedbackDivider} />
            <View style={s.feedbackItem}>
              <View style={s.feedbackIconBox}>
                <Ionicons name="sunny-outline" size={16} color="#EF9F27" />
              </View>
              <View style={s.feedbackContent}>
                <Text style={s.feedbackLabel}>Yoritish</Text>
                <Text style={s.feedbackText}>{analysis.lighting_feedback}</Text>
              </View>
            </View>
            <View style={s.feedbackDivider} />
            <View style={s.feedbackItem}>
              <View style={s.feedbackIconBox}>
                <Ionicons name="color-palette-outline" size={16} color="#E24B4A" />
              </View>
              <View style={s.feedbackContent}>
                <Text style={s.feedbackLabel}>Rang muvozanati</Text>
                <Text style={s.feedbackText}>{analysis.color_feedback}</Text>
              </View>
            </View>
          </View>

          {/* SUGGESTIONS */}
          {analysis.suggestions?.length > 0 && (
            <View style={s.card}>
              <Text style={s.cardTitle}>Tavsiyalar</Text>
              {analysis.suggestions.map((suggestion, i) => (
                <View key={i} style={s.suggestionItem}>
                  <View style={s.suggestionNum}>
                    <Text style={s.suggestionNumText}>{i + 1}</Text>
                  </View>
                  <Text style={s.suggestionText}>{suggestion}</Text>
                </View>
              ))}
            </View>
          )}

          {/* RE-ANALYZE */}
          <TouchableOpacity style={s.reAnalyzeBtn} onPress={runAnalysis} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#6C63FF" size="small" />
            ) : (
              <View style={s.analyzeBtnInner}>
                <Feather name="refresh-cw" size={15} color="#6C63FF" />
                <Text style={s.reAnalyzeBtnText}>Qayta tahlil</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8fc' },
  image: { width, height: width * 0.75, backgroundColor: '#f0f0f0' },
  imagePlaceholder: { width, height: 240, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },

  centerBox: { padding: 48, alignItems: 'center', gap: 12 },
  checkingText: { color: '#aaa', fontSize: 14 },

  noAnalysis: { padding: 28, alignItems: 'center' },
  noAnalysisIconWrap: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#f0eeff', justifyContent: 'center', alignItems: 'center', marginBottom: 16, marginTop: 8 },
  noAnalysisTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a1a', marginBottom: 8 },
  noAnalysisText: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  featureRow: { flexDirection: 'row', gap: 16, marginBottom: 28 },
  featureItem: { alignItems: 'center', gap: 8 },
  featureIconBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#f0eeff', justifyContent: 'center', alignItems: 'center' },
  featureText: { fontSize: 12, color: '#888', fontWeight: '500' },
  analyzeBtn: { backgroundColor: '#6C63FF', borderRadius: 16, paddingHorizontal: 36, paddingVertical: 15, shadowColor: '#6C63FF', shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
  analyzeBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  analyzeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  result: { padding: 16 },
  overallCard: { borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 14 },
  overallLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginBottom: 6 },
  overallScore: { color: '#fff', fontSize: 52, fontWeight: '800', lineHeight: 58 },
  overallMax: { fontSize: 24, fontWeight: '400', opacity: 0.7 },
  overallBadge: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 5, marginTop: 10 },
  overallBadgeText: { fontSize: 14, fontWeight: '700' },

  card: { backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 14, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 14 },

  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  scoreLabel: { width: 104, fontSize: 13, color: '#555', fontWeight: '500' },
  barBg: { flex: 1, height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  scoreBadge: { width: 36, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  scoreNum: { fontSize: 13, fontWeight: '700' },

  feedbackItem: { flexDirection: 'row', gap: 12, paddingVertical: 4 },
  feedbackIconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#f5f5f8', justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  feedbackContent: { flex: 1 },
  feedbackLabel: { fontSize: 13, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  feedbackText: { fontSize: 13, color: '#555', lineHeight: 20 },
  feedbackDivider: { height: 1, backgroundColor: '#f5f5f5', marginVertical: 12 },

  suggestionItem: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 12 },
  suggestionNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#f0eeff', justifyContent: 'center', alignItems: 'center' },
  suggestionNumText: { fontSize: 12, fontWeight: '700', color: '#6C63FF' },
  suggestionText: { flex: 1, fontSize: 13, color: '#444', lineHeight: 20 },

  reAnalyzeBtn: { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 14, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  reAnalyzeBtnText: { color: '#6C63FF', fontSize: 14, fontWeight: '700' },
});
