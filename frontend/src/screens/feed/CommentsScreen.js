import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, Image,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { getComments, addComment } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function CommentsScreen({ route }) {
  const { photoId } = route.params;
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [focused, setFocused] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    getComments(photoId)
      .then((data) => setComments(data.comments || []))
      .finally(() => setLoading(false));
  }, []);

  const sendComment = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const data = await addComment(photoId, text.trim());
      setComments((prev) => [...prev, data.comment]);
      setText('');
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {}
    setSending(false);
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'Hozir';
    if (diff < 3600) return `${Math.floor(diff / 60)} daq`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} soat`;
    return `${Math.floor(diff / 86400)} kun`;
  };

  if (loading) {
    return (
      <View style={s.loadingBox}>
        <ActivityIndicator color="#6C63FF" size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        ref={flatListRef}
        data={comments}
        keyExtractor={(i) => i.id}
        contentContainerStyle={[s.listContent, comments.length === 0 && s.listEmpty]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isMe = item.user_id === user?.id;
          return (
            <View style={[s.commentRow, isMe && s.commentRowMe]}>
              {!isMe && (
                <View style={s.avatarWrap}>
                  {item.avatar_url ? (
                    <Image source={{ uri: item.avatar_url }} style={s.avatar} />
                  ) : (
                    <View style={s.avatarPlaceholder}>
                      <Text style={s.avatarText}>{(item.name || 'U')[0].toUpperCase()}</Text>
                    </View>
                  )}
                </View>
              )}
              <View style={[s.bubble, isMe && s.bubbleMe]}>
                {!isMe && (
                  <Text style={s.commentName}>{item.name || item.username}</Text>
                )}
                <Text style={[s.commentText, isMe && s.commentTextMe]}>{item.text}</Text>
                <Text style={[s.commentTime, isMe && s.commentTimeMe]}>{formatTime(item.created_at)}</Text>
              </View>
              {isMe && (
                <View style={s.avatarWrap}>
                  {item.avatar_url ? (
                    <Image source={{ uri: item.avatar_url }} style={s.avatar} />
                  ) : (
                    <View style={[s.avatarPlaceholder, { backgroundColor: '#1D9E75' }]}>
                      <Text style={s.avatarText}>{(item.name || 'U')[0].toUpperCase()}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={s.emptyBox}>
            <View style={s.emptyIconWrap}>
              <Ionicons name="chatbubble-outline" size={36} color="#d0cdff" />
            </View>
            <Text style={s.emptyTitle}>Hali izoh yo'q</Text>
            <Text style={s.emptyText}>Birinchi izoh qoldiring!</Text>
          </View>
        }
        ListHeaderComponent={
          comments.length > 0 ? (
            <View style={s.countBar}>
              <Ionicons name="chatbubbles-outline" size={14} color="#aaa" />
              <Text style={s.countText}>{comments.length} ta izoh</Text>
            </View>
          ) : null
        }
      />

      {/* INPUT */}
      <View style={[s.inputArea, focused && s.inputAreaFocused]}>
        <View style={s.inputWrap}>
          {user?.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={s.myAvatar} />
          ) : (
            <View style={s.myAvatarPlaceholder}>
              <Text style={s.myAvatarText}>{(user?.name || 'U')[0].toUpperCase()}</Text>
            </View>
          )}
          <TextInput
            style={s.input}
            placeholder="Izoh yozing..."
            value={text}
            onChangeText={setText}
            placeholderTextColor="#bbb"
            multiline
            maxLength={500}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!text.trim() || sending) && s.sendBtnDisabled]}
            onPress={sendComment}
            disabled={!text.trim() || sending}
          >
            {sending
              ? <ActivityIndicator color="#fff" size="small" />
              : <Ionicons name="send" size={16} color="#fff" />
            }
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8fc' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  listContent: { padding: 16, paddingBottom: 8 },
  listEmpty: { flexGrow: 1 },

  countBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 16,
  },
  countText: { fontSize: 13, color: '#aaa', fontWeight: '500' },

  commentRow: { flexDirection: 'row', gap: 10, marginBottom: 14, alignItems: 'flex-end' },
  commentRowMe: { flexDirection: 'row-reverse' },

  avatarWrap: { width: 36 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarPlaceholder: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#6C63FF', justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  bubble: {
    maxWidth: '75%', backgroundColor: '#fff', borderRadius: 18,
    borderBottomLeftRadius: 4, padding: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  bubbleMe: {
    backgroundColor: '#6C63FF', borderBottomLeftRadius: 18, borderBottomRightRadius: 4,
  },
  commentName: { fontSize: 12, fontWeight: '700', color: '#6C63FF', marginBottom: 4 },
  commentText: { fontSize: 14, color: '#1a1a1a', lineHeight: 20 },
  commentTextMe: { color: '#fff' },
  commentTime: { fontSize: 10, color: '#bbb', marginTop: 4, textAlign: 'right' },
  commentTimeMe: { color: 'rgba(255,255,255,0.6)' },

  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#f0eeff', justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#555', marginBottom: 4 },
  emptyText: { fontSize: 14, color: '#bbb' },

  inputArea: {
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0',
    paddingHorizontal: 12, paddingVertical: 10,
  },
  inputAreaFocused: { borderTopColor: '#e8e6ff' },
  inputWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  myAvatar: { width: 34, height: 34, borderRadius: 17 },
  myAvatarPlaceholder: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#6C63FF', justifyContent: 'center', alignItems: 'center',
  },
  myAvatarText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  input: {
    flex: 1, borderWidth: 1.5, borderColor: '#e8e8e8', borderRadius: 22,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14,
    maxHeight: 100, color: '#1a1a1a', backgroundColor: '#fafafa',
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#6C63FF', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#6C63FF', shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  sendBtnDisabled: { backgroundColor: '#c4bfff', shadowOpacity: 0 },
});
