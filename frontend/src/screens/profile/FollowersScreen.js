import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

export default function FollowersScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, type } = route.params;
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const endpoint = type === 'followers' ? `/${userId}/followers` : `/${userId}/following`;
    api.get(`/profile${endpoint}`)
      .then(data => setUsers(data.users || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={s.center}><ActivityIndicator color="#6C63FF" size="large" /></View>;

  return (
    <View style={s.container}>
      <FlatList
        data={users}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<View style={s.empty}><Text style={s.emptyText}>Hali hech kim yo'q</Text></View>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.item}
            onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
          >
            {item.avatar_url
              ? <Image source={{ uri: item.avatar_url }} style={s.avatar} />
              : <View style={s.avatarPlaceholder}><Text style={s.avatarLetter}>{(item.name || 'U')[0].toUpperCase()}</Text></View>
            }
            <View style={s.info}>
              <Text style={s.name}>{item.full_name || item.name}</Text>
              <Text style={s.username}>@{item.username || item.name}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={s.sep} />}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8fc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', padding: 14, borderRadius: 14 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#6C63FF', justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { color: '#fff', fontSize: 20, fontWeight: '700' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  username: { fontSize: 12, color: '#aaa', marginTop: 2 },
  sep: { height: 8 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#aaa', fontSize: 16 },
});
