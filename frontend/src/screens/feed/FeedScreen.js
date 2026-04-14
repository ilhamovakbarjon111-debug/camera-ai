import React, { useState, useEffect, useCallback } from 'react';
import {
  View, FlatList, StyleSheet, ActivityIndicator,
  Text, RefreshControl, TextInput, TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { getFeed, searchFeed } from '../../services/api';
import PhotoCard from '../../components/feed/PhotoCard';

export default function FeedScreen() {
  const navigation = useNavigation();
  const [photos, setPhotos] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const loadFeed = useCallback(async (pageNum = 1, refresh = false) => {
    try {
      const data = await getFeed(pageNum);
      const newPhotos = data.photos || [];
      if (refresh || pageNum === 1) setPhotos(newPhotos);
      else setPhotos(prev => [...prev, ...newPhotos]);
      setHasMore(newPhotos.length === 20);
      setPage(pageNum);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { loadFeed(1).finally(() => setLoading(false)); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setSearchQuery('');
    setSearching(false);
    await loadFeed(1, true);
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore || searching) return;
    setLoadingMore(true);
    await loadFeed(page + 1);
    setLoadingMore(false);
  };

  const handleSearch = async (text) => {
    setSearchQuery(text);
    if (!text.trim()) { setSearching(false); loadFeed(1, true); return; }
    setSearching(true);
    try { const data = await searchFeed(text); setPhotos(data.photos || []); } catch {}
  };

  const clearSearch = () => { setSearchQuery(''); setSearching(false); loadFeed(1, true); };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#6C63FF" /></View>;

  return (
    <View style={s.container}>
      {/* HEADER */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.logoBadge}><Ionicons name="camera" size={18} color="#fff" /></View>
          <Text style={s.logoText}>Camera <Text style={s.logoAI}>AI</Text></Text>
        </View>
        <TouchableOpacity style={s.headerBtn} onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications-outline" size={22} color="#1a1a1a" />
        </TouchableOpacity>
      </View>

      {/* SEARCH */}
      <View style={s.searchWrap}>
        <View style={[s.searchBox, searchFocused && s.searchBoxFocused]}>
          <Feather name="search" size={16} color={searchFocused ? "#6C63FF" : "#aaa"} />
          <TextInput
            style={s.searchInput}
            placeholder="Rasm yoki foydalanuvchi..."
            value={searchQuery}
            onChangeText={handleSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholderTextColor="#bbb"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={18} color="#ccc" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {searching && (
        <View style={s.searchingBar}>
          <Feather name="search" size={13} color="#6C63FF" />
          <Text style={s.searchingText}>"{searchQuery}" bo'yicha natijalar</Text>
        </View>
      )}

      <FlatList
        data={photos}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <PhotoCard photo={item} navigation={navigation} onLikeUpdate={() => {}} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#6C63FF"]} tintColor="#6C63FF" />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={photos.length === 0 && s.emptyContainer}
        ListFooterComponent={loadingMore ? <View style={s.footerLoader}><ActivityIndicator color="#6C63FF" size="small" /></View> : null}
        ListEmptyComponent={
          <View style={s.emptyBox}>
            <View style={s.emptyIconWrap}>
              <Ionicons name={searching ? "search-outline" : "camera-outline"} size={40} color="#d0cdff" />
            </View>
            <Text style={s.emptyTitle}>{searching ? "Natija topilmadi" : "Hali rasmlar yo'q"}</Text>
            <Text style={s.emptySubText}>{searching ? `"${searchQuery}" bo'yicha hech narsa yo'q` : "Birinchi rasm yuklang!"}</Text>
            {searching && (
              <TouchableOpacity style={s.emptyBtn} onPress={clearSearch}>
                <Text style={s.emptyBtnText}>Barchasini ko'rish</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8fc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 52, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBadge: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#6C63FF', justifyContent: 'center', alignItems: 'center' },
  logoText: { fontSize: 20, fontWeight: '800', color: '#1a1a1a' },
  logoAI: { color: '#6C63FF' },
  headerBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  searchWrap: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f5f5f8', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1.5, borderColor: 'transparent' },
  searchBoxFocused: { borderColor: '#6C63FF', backgroundColor: '#fff' },
  searchInput: { flex: 1, fontSize: 14, color: '#1a1a1a' },
  searchingBar: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#f0eeff' },
  searchingText: { fontSize: 13, color: '#6C63FF', fontWeight: '500' },
  footerLoader: { padding: 16, alignItems: 'center' },
  emptyContainer: { flexGrow: 1 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyIconWrap: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#f0eeff', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#555' },
  emptySubText: { fontSize: 14, color: '#bbb' },
  emptyBtn: { marginTop: 12, backgroundColor: '#6C63FF', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10 },
  emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
