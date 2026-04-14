import React, { useState, useRef } from 'react';
import {
  View, Text, Image, TouchableOpacity,
  StyleSheet, Dimensions, Animated,
} from 'react-native';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { likePhoto } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

export default function PhotoCard({ photo, navigation, onLikeUpdate }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(photo.is_liked);
  const [likesCount, setLikesCount] = useState(photo.likes_count);
  const [loading, setLoading] = useState(false);
  const heartAnim = useRef(new Animated.Value(1)).current;

  const handleLike = async () => {
    if (loading) return;
    setLoading(true);
    const prev = liked;
    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);

    // Heart animation
    Animated.sequence([
      Animated.spring(heartAnim, { toValue: 1.4, useNativeDriver: true, speed: 50 }),
      Animated.spring(heartAnim, { toValue: 1, useNativeDriver: true, speed: 50 }),
    ]).start();

    try {
      await likePhoto(photo.id);
      onLikeUpdate?.();
    } catch {
      setLiked(prev);
      setLikesCount(photo.likes_count);
    } finally {
      setLoading(false);
    }
  };

  const handleDoubleTap = () => {
    if (!liked) handleLike();
  };

  const goProfile = () => {
    if (photo.user_id === user?.id) {
      navigation.navigate('Profile');
    } else {
      navigation.navigate('UserProfile', { userId: photo.user_id });
    }
  };

  return (
    <View style={s.card}>
      {/* HEADER */}
      <TouchableOpacity style={s.header} onPress={goProfile} activeOpacity={0.8}>
        {photo.avatar_url ? (
          <Image source={{ uri: photo.avatar_url }} style={s.avatar} />
        ) : (
          <View style={s.avatarPlaceholder}>
            <Text style={s.avatarText}>{(photo.name || 'U')[0].toUpperCase()}</Text>
          </View>
        )}
        <View style={s.headerInfo}>
          <Text style={s.userName}>{photo.name || photo.username}</Text>
          {photo.created_at && (
            <Text style={s.timeText}>{formatTime(photo.created_at)}</Text>
          )}
        </View>
        <TouchableOpacity style={s.moreBtn}>
          <Feather name="more-horizontal" size={18} color="#aaa" />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* IMAGE */}
      <TouchableOpacity activeOpacity={1} onPress={handleDoubleTap}>
        <Image source={{ uri: photo.image_url }} style={s.image} resizeMode="cover" />
      </TouchableOpacity>

      {/* ACTIONS */}
      <View style={s.actions}>
        <View style={s.actionsLeft}>
          <TouchableOpacity onPress={handleLike} style={s.actionBtn} activeOpacity={0.7}>
            <Animated.View style={{ transform: [{ scale: heartAnim }] }}>
              <Ionicons
                name={liked ? 'heart' : 'heart-outline'}
                size={26}
                color={liked ? '#E24B4A' : '#1a1a1a'}
              />
            </Animated.View>
            {likesCount > 0 && <Text style={[s.actionCount, liked && s.actionCountLiked]}>{likesCount}</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={s.actionBtn}
            onPress={() => navigation.navigate('Comments', { photoId: photo.id })}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-outline" size={24} color="#1a1a1a" />
            {photo.comments_count > 0 && (
              <Text style={s.actionCount}>{photo.comments_count}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={s.actionBtn} activeOpacity={0.7}>
            <Feather name="send" size={22} color="#1a1a1a" />
          </TouchableOpacity>
        </View>

        <View style={s.actionsRight}>
          {!photo.ai_analyzed ? (
            <TouchableOpacity
              style={s.aiBtn}
              onPress={() => navigation.navigate('AIAnalysis', { photo })}
              activeOpacity={0.85}
            >
              <MaterialIcons name="auto-awesome" size={13} color="#fff" />
              <Text style={s.aiBtnText}>AI Tahlil</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={s.aiDoneBtn}
              onPress={() => navigation.navigate('AIAnalysis', { photo })}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle" size={13} color="#fff" />
              <Text style={s.aiBtnText}>Tahlil</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* CAPTION */}
      {photo.caption ? (
        <View style={s.captionWrap}>
          <Text style={s.captionName}>{photo.name || photo.username} </Text>
          <Text style={s.captionText}>{photo.caption}</Text>
        </View>
      ) : null}

      {/* BOTTOM BORDER */}
      <View style={s.cardDivider} />
    </View>
  );
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'Hozir';
  if (diff < 3600) return `${Math.floor(diff / 60)} daq oldin`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} soat oldin`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} kun oldin`;
  return d.toLocaleDateString('uz');
}

const s = StyleSheet.create({
  card: { backgroundColor: '#fff', marginBottom: 8 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10, gap: 10,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#f0eeff' },
  avatarPlaceholder: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#6C63FF', justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  headerInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  timeText: { fontSize: 11, color: '#bbb', marginTop: 1 },
  moreBtn: { padding: 4 },

  image: { width, height: width, backgroundColor: '#f5f5f5' },

  actions: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10,
  },
  actionsLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  actionsRight: {},
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionCount: { fontSize: 14, color: '#1a1a1a', fontWeight: '600' },
  actionCountLiked: { color: '#E24B4A' },

  aiBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#6C63FF', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  aiDoneBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#1D9E75', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  aiBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  captionWrap: { paddingHorizontal: 14, paddingBottom: 10, flexDirection: 'row', flexWrap: 'wrap' },
  captionName: { fontSize: 13, fontWeight: '700', color: '#1a1a1a' },
  captionText: { fontSize: 13, color: '#333', lineHeight: 18 },

  cardDivider: { height: 1, backgroundColor: '#f5f5f5' },
});
