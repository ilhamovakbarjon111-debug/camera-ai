import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import api from "../../services/api";

const NOTIF_TYPES = {
  like:     { icon: "heart",         color: "#E24B4A", bg: "#fff0f0" },
  comment:  { icon: "chatbubble",    color: "#6C63FF", bg: "#f0eeff" },
  follow:   { icon: "person-add",    color: "#1D9E75", bg: "#f0faf5" },
  analysis: { icon: "auto-awesome",  color: "#EF9F27", bg: "#fff8ed", material: true },
  xp:       { icon: "star",          color: "#6C63FF", bg: "#f0eeff" },
};

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return "Hozir";
  if (diff < 3600) return `${Math.floor(diff / 60)} daq oldin`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} soat oldin`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} kun oldin`;
  return new Date(dateStr).toLocaleDateString("uz");
};

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const data = await api.get("/notifications");
      setNotifs(data.notifications || []);
    } catch (err) {
      console.log("Notifications xato:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const markRead = async (id) => {
    setNotifs(n => n.map(x => x.id === id ? { ...x, read: true } : x));
    try { await api.put(`/notifications/${id}/read`); } catch {}
  };

  const markAllRead = async () => {
    setNotifs(n => n.map(x => ({ ...x, read: true })));
    try { await api.put("/notifications/read-all"); } catch {}
  };

  const unreadCount = notifs.filter(n => !n.read).length;

  const renderItem = ({ item }) => {
    const t = NOTIF_TYPES[item.type] || NOTIF_TYPES.like;
    const displayName = item.username || item.name || "Foydalanuvchi";

    return (
      <TouchableOpacity
        style={[s.item, !item.read && s.itemUnread]}
        activeOpacity={0.75}
        onPress={() => markRead(item.id)}
      >
        <View style={[s.iconBox, { backgroundColor: t.bg }]}>
          {t.material
            ? <MaterialIcons name={t.icon} size={20} color={t.color} />
            : <Ionicons name={t.icon} size={20} color={t.color} />
          }
        </View>
        <View style={s.itemContent}>
          <Text style={s.itemText}>
            {item.type !== "xp" && item.from_user_id && (
              <Text style={s.itemName}>{displayName} </Text>
            )}
            <Text style={s.itemDesc}>{item.text}</Text>
          </Text>
          <Text style={s.itemTime}>{formatTime(item.created_at)}</Text>
        </View>
        {!item.read && <View style={s.unreadDot} />}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={s.loadingBox}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* HEADER */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Bildirishnomalar</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity style={s.readAllBtn} onPress={markAllRead}>
            <Text style={s.readAllText}>Barchasini o'qi</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 90 }} />
        )}
      </View>

      {unreadCount > 0 && (
        <View style={s.unreadBanner}>
          <Ionicons name="ellipse" size={8} color="#6C63FF" />
          <Text style={s.unreadBannerText}>{unreadCount} ta o'qilmagan</Text>
        </View>
      )}

      <FlatList
        data={notifs}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#6C63FF"]} tintColor="#6C63FF" />
        }
        ItemSeparatorComponent={() => <View style={s.separator} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={notifs.length === 0 && s.emptyContainer}
        ListEmptyComponent={
          <View style={s.emptyBox}>
            <View style={s.emptyIconWrap}>
              <Ionicons name="notifications-outline" size={40} color="#d0cdff" />
            </View>
            <Text style={s.emptyTitle}>Bildirishnoma yo'q</Text>
            <Text style={s.emptySub}>Yangi faollik bo'lganda bu yerda ko'rinadi</Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8fc" },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingTop: 52, paddingBottom: 12, paddingHorizontal: 16,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0",
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#f5f5f5", justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a1a" },
  readAllBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: "#f0eeff" },
  readAllText: { color: "#6C63FF", fontSize: 12, fontWeight: "600" },
  unreadBanner: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#f5f3ff" },
  unreadBannerText: { fontSize: 12, color: "#6C63FF", fontWeight: "500" },
  item: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#fff" },
  itemUnread: { backgroundColor: "#fdfcff" },
  iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  itemContent: { flex: 1 },
  itemText: { fontSize: 14, color: "#1a1a1a", lineHeight: 20, marginBottom: 3 },
  itemName: { fontWeight: "700" },
  itemDesc: { fontWeight: "400", color: "#444" },
  itemTime: { fontSize: 11, color: "#bbb" },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#6C63FF" },
  separator: { height: 1, backgroundColor: "#f5f5f5", marginLeft: 72 },
  emptyContainer: { flexGrow: 1 },
  emptyBox: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 80, gap: 10 },
  emptyIconWrap: { width: 88, height: 88, borderRadius: 44, backgroundColor: "#f0eeff", justifyContent: "center", alignItems: "center", marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#555" },
  emptySub: { fontSize: 13, color: "#bbb", textAlign: "center", paddingHorizontal: 32 },
});
