import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, Alert, Switch, Modal, TextInput, Animated,
  Dimensions, ActivityIndicator, KeyboardAvoidingView,
  Platform, RefreshControl,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const AVATAR_SIZE = 88;

export default function ProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, signOut } = useAuth();
  const userId = route.params?.userId || user?.id;
  const isMe = userId === user?.id;

  const [profile, setProfile] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("photos");
  const [isFollowing, setIsFollowing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [aiTips, setAiTips] = useState(true);
  const [privateAccount, setPrivateAccount] = useState(false);

  const [showEdit, setShowEdit] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editFullName, setEditFullName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { fetchProfile(); }, [userId]);
  useEffect(() => { if (isMe) fetchSettings(); }, [isMe]);

  const fetchProfile = async () => {
    try {
      const data = await api.get(`/profile/${userId}`);
      setProfile(data.user);
      setPhotos(data.photos || []);
      setIsFollowing(data.isFollowing || false);
      if (data.user) {
        setEditUsername(data.user.username || data.user.name || "");
        setEditFullName(data.user.full_name || "");
        setEditBio(data.user.bio || "");
      }
    } catch (err) { console.log("Profil xato:", err.message); }
    finally { setLoading(false); }
  };

  const fetchSettings = async () => {
    try {
      const data = await api.get("/profile/settings");
      if (data.settings) {
        setNotifications(data.settings.notifications ?? true);
        setAiTips(data.settings.ai_tips ?? true);
        setPrivateAccount(data.settings.private_account ?? false);
      }
    } catch {}
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    if (isMe) await fetchSettings();
    setRefreshing(false);
  };

  const saveSettings = async (key, value) => {
    const updated = {
      notifications: key === "notifications" ? value : notifications,
      ai_tips: key === "ai_tips" ? value : aiTips,
      private_account: key === "private_account" ? value : privateAccount,
    };
    try { await api.put("/profile/settings", updated); }
    catch { Alert.alert("Xato", "Sozlamalar saqlanmadi"); }
  };

  const openSettings = () => {
    setShowSettings(true);
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  };

  const closeSettings = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 300, duration: 300, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setShowSettings(false));
  };

  const handleAvatarUpload = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Ruxsat kerak", "Galereya ruxsatini bering"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true });
    if (result.canceled) return;
    setUploadingAvatar(true);
    try {
      const asset = result.assets[0];
      const data = await api.post("/profile/upload-avatar", { imageBase64: asset.base64, mimeType: asset.mimeType || "image/jpeg" });
      setProfile((p) => ({ ...p, avatar_url: data.avatar_url }));
      Alert.alert("Bajarildi", "Profil rasmi yangilandi!");
    } catch (err) { Alert.alert("Xato", "Rasm yuklanmadi: " + err.message); }
    finally { setUploadingAvatar(false); }
  };

  const handleSaveEdit = async () => {
    if (!editUsername.trim()) { Alert.alert("Xato", "Username bo'sh bo'lmasin"); return; }
    setSavingEdit(true);
    try {
      const data = await api.put("/profile/edit", { username: editUsername.trim(), full_name: editFullName.trim(), bio: editBio.trim() });
      setProfile((p) => ({ ...p, ...data.user }));
      setShowEdit(false);
      Alert.alert("Bajarildi", "Profil yangilandi!");
    } catch (err) { Alert.alert("Xato", err.message); }
    finally { setSavingEdit(false); }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) { Alert.alert("Xato", "Barcha maydonlarni to'ldiring"); return; }
    if (newPassword !== confirmPassword) { Alert.alert("Xato", "Yangi parollar mos emas"); return; }
    if (newPassword.length < 6) { Alert.alert("Xato", "Parol kamida 6 ta belgi bo'lsin"); return; }
    setSavingPassword(true);
    try {
      await api.put("/profile/password", { currentPassword, newPassword });
      setShowPassword(false);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      Alert.alert("Bajarildi", "Parol muvaffaqiyatli o'zgartirildi!");
    } catch (err) { Alert.alert("Xato", err.message); }
    finally { setSavingPassword(false); }
  };

  const handleFollow = async () => {
    try {
      await api.post(`/profile/${userId}/follow`);
      setIsFollowing(!isFollowing);
      setProfile((p) => ({ ...p, followers_count: isFollowing ? p.followers_count - 1 : p.followers_count + 1 }));
    } catch (err) { Alert.alert("Xato", err.message); }
  };

  const handleLogout = () => {
    Alert.alert("Chiqish", "Hisobdan chiqmoqchimisiz?", [
      { text: "Bekor", style: "cancel" },
      { text: "Chiqish", style: "destructive", onPress: () => {
        Animated.parallel([
          Animated.timing(slideAnim, { toValue: 300, duration: 300, useNativeDriver: true }),
          Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => { setShowSettings(false); signOut(); });
      }},
    ]);
  };

  const handleDeleteAccount = async () => {
    if (deleteText !== "O'CHIRISH") { Alert.alert("Xato", "To'g'ri matn kiriting"); return; }
    setDeleting(true);
    try {
      await api.delete("/profile/account");
      setShowDeleteModal(false);
      setTimeout(() => signOut(), 300);
    } catch (err) { Alert.alert("Xato", err.message || "Xatolik yuz berdi"); }
    finally { setDeleting(false); }
  };

  const handleChallengeReset = () => {
    Alert.alert("Vazifalarni qaytarish", "Barcha vazifalar bajarilmagan holatga qaytariladi.", [
      { text: "Bekor", style: "cancel" },
      { text: "Qaytarish", style: "destructive", onPress: async () => {
        try { await api.delete("/profile/challenges"); Alert.alert("Bajarildi", "Vazifalar qaytarildi!"); }
        catch { Alert.alert("Xato", "Qaytarishda xatolik"); }
      }},
    ]);
  };

  if (loading) {
    return <View style={s.loadingBox}><ActivityIndicator size="large" color="#6C63FF" /></View>;
  }

  const p = profile || {};

  return (
    <View style={s.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#6C63FF"]} tintColor="#6C63FF" />}
      >
        {/* HEADER */}
        <View style={s.header}>
          <View style={s.headerTop}>
            {!isMe ? (
              <TouchableOpacity style={s.iconBtn} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
              </TouchableOpacity>
            ) : <View style={{ width: 40 }} />}
            <Text style={s.headerUsername}>@{p.username || p.name || "foydalanuvchi"}</Text>
            {isMe ? (
              <TouchableOpacity style={s.iconBtn} onPress={openSettings}>
                <Ionicons name="settings-outline" size={22} color="#1a1a1a" />
              </TouchableOpacity>
            ) : <View style={{ width: 40 }} />}
          </View>
        </View>

        {/* PROFILE CARD */}
        <View style={s.profileCard}>
          <View style={s.avatarRow}>
            <TouchableOpacity onPress={isMe ? handleAvatarUpload : undefined} disabled={!isMe || uploadingAvatar}>
              <View style={s.avatarWrap}>
                {p.avatar_url ? (
                  <Image source={{ uri: p.avatar_url }} style={s.avatar} />
                ) : (
                  <View style={s.avatarPlaceholder}>
                    <Text style={s.avatarLetter}>{(p.username || p.name || "U")[0].toUpperCase()}</Text>
                  </View>
                )}
                {uploadingAvatar && <View style={s.avatarLoading}><ActivityIndicator color="#fff" size="small" /></View>}
                {isMe && !uploadingAvatar && (
                  <View style={s.avatarEditBadge}><Ionicons name="camera" size={13} color="#fff" /></View>
                )}
              </View>
            </TouchableOpacity>
            <View style={s.statsRow}>
              <View style={s.statItem}>
                <Text style={s.statNum}>{photos.length || 0}</Text>
                <Text style={s.statLabel}>Post</Text>
              </View>
              <TouchableOpacity style={s.statItem} onPress={() => navigation.navigate("Followers", { userId, type: "followers" })}>
                <Text style={s.statNum}>{p.followers_count || 0}</Text>
                <Text style={s.statLabel}>Obunachilar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.statItem} onPress={() => navigation.navigate("Followers", { userId, type: "following" })}>
                <Text style={s.statNum}>{p.following_count || 0}</Text>
                <Text style={s.statLabel}>Obunalar</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={s.bioSection}>
            <Text style={s.displayName}>{p.full_name || p.name || p.username}</Text>
            {p.bio ? <Text style={s.bio}>{p.bio}</Text> : isMe && <Text style={s.bioPlaceholder}>Bio qo'shing...</Text>}
            <View style={s.badgeRow}>
              <View style={s.xpBadge}>
                <Ionicons name="star" size={13} color="#6C63FF" />
                <Text style={s.xpText}>{p.xp || 0} XP</Text>
              </View>
            </View>
          </View>
          <View style={s.progressWrap}>
            <View style={s.progressBar}>
              <View style={[s.progressFill, { width: `${Math.min((p.xp || 0) % 100, 100)}%` }]} />
            </View>
            <Text style={s.progressLabel}>Keyingi darajagacha: {100 - ((p.xp || 0) % 100)} XP</Text>
          </View>
          {isMe ? (
            <TouchableOpacity style={s.editBtn} onPress={() => setShowEdit(true)}>
              <Feather name="edit-2" size={15} color="#6C63FF" />
              <Text style={s.editBtnText}>Profilni tahrirlash</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[s.followBtn, isFollowing && s.followBtnActive]} onPress={handleFollow}>
              {isFollowing && <Ionicons name="checkmark" size={16} color="#555" style={{ marginRight: 4 }} />}
              <Text style={[s.followBtnText, isFollowing && s.followBtnTextActive]}>
                {isFollowing ? "Obunasiz" : "Obuna bo'lish"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* TABS */}
        <View style={s.tabs}>
          <TouchableOpacity style={[s.tab, activeTab === "photos" && s.tabActive]} onPress={() => setActiveTab("photos")}>
            <Ionicons name="grid-outline" size={16} color={activeTab === "photos" ? "#fff" : "#888"} />
            <Text style={[s.tabText, activeTab === "photos" && s.tabTextActive]}>Rasmlar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tab, activeTab === "analyses" && s.tabActive]} onPress={() => setActiveTab("analyses")}>
            <MaterialIcons name="analytics" size={16} color={activeTab === "analyses" ? "#fff" : "#888"} />
            <Text style={[s.tabText, activeTab === "analyses" && s.tabTextActive]}>AI Tahlillar</Text>
          </TouchableOpacity>
        </View>

        {/* PHOTOS GRID */}
        {activeTab === "photos" && (
          <View style={s.grid}>
            {photos.length === 0 ? (
              <View style={s.emptyBox}>
                <Ionicons name="camera-outline" size={56} color="#ddd" />
                <Text style={s.emptyText}>Hali rasm yo'q</Text>
                {isMe && (
                  <TouchableOpacity style={s.uploadBtn} onPress={() => navigation.navigate("Upload")}>
                    <Text style={s.uploadBtnText}>+ Rasm yuklash</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={s.gridInner}>
                {photos.map((photo, i) => (
                  <TouchableOpacity
                    key={photo.id || i}
                    style={s.gridItem}
                    onPress={() => setSelectedPhoto(photo)}
                  >
                    <Image source={{ uri: photo.image_url }} style={s.gridImg} />
                    {photo.ai_analyzed && (
                      <View style={s.gridBadge}>
                        <MaterialIcons name="auto-awesome" size={12} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {activeTab === "analyses" && (
          <View style={s.analysesList}>
            {photos.filter((ph) => ph.ai_analyzed).length === 0 ? (
              <View style={s.emptyBox}>
                <MaterialIcons name="analytics" size={56} color="#ddd" />
                <Text style={s.emptyText}>Hali AI tahlil yo'q</Text>
              </View>
            ) : (
              photos.filter((ph) => ph.ai_analyzed).map((photo, i) => (
                <TouchableOpacity
                  key={photo.id || i}
                  style={s.analysisCard}
                  onPress={() => navigation.navigate("AIAnalysis", { photo })}
                >
                  <Image source={{ uri: photo.image_url }} style={s.analysisImg} />
                  <View style={s.analysisInfo}>
                    <Text style={s.analysisTitle}>AI Tahlil #{i + 1}</Text>
                    <Text style={s.analysisDate}>{photo.created_at ? new Date(photo.created_at).toLocaleDateString("uz") : ""}</Text>
                    <View style={s.scoreRow}>
                      <View style={s.scoreChip}><Text style={s.scoreChipText}>Kompozitsiya</Text></View>
                      <View style={s.scoreChip}><Text style={s.scoreChipText}>Yorug'lik</Text></View>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color="#ccc" />
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ===== PHOTO DETAIL MODAL ===== */}
      <Modal visible={!!selectedPhoto} transparent animationType="fade">
        <View style={s.photoModalOverlay}>
          <TouchableOpacity style={s.photoModalClose} onPress={() => setSelectedPhoto(null)}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          {selectedPhoto && (
            <>
              <Image
                source={{ uri: selectedPhoto.image_url }}
                style={s.photoModalImage}
                resizeMode="contain"
              />
              {selectedPhoto.ai_analyzed && (
                <TouchableOpacity
                  style={s.photoModalAIBtn}
                  onPress={() => { setSelectedPhoto(null); navigation.navigate("AIAnalysis", { photo: selectedPhoto }); }}
                >
                  <MaterialIcons name="auto-awesome" size={16} color="#fff" />
                  <Text style={s.photoModalAIBtnText}>AI Tahlilni ko'rish</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </Modal>

      {/* ===== SETTINGS PANEL ===== */}
      {showSettings && (
        <Modal transparent animationType="none" visible>
          <Animated.View style={[s.overlay, { opacity: fadeAnim }]}>
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeSettings} />
            <Animated.View style={[s.settingsPanel, { transform: [{ translateX: slideAnim }] }]}>
              <View style={s.settingsHeader}>
                <Text style={s.settingsTitle}>Sozlamalar</Text>
                <TouchableOpacity style={s.closeBtn} onPress={closeSettings}>
                  <Ionicons name="close" size={20} color="#555" />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={s.sectionLabel}>PROFIL</Text>
                <View style={s.settingsCard}>
                  <TouchableOpacity style={s.settingsRow} onPress={() => { closeSettings(); setTimeout(() => setShowEdit(true), 400); }}>
                    <View style={s.rowLeft}><View style={s.rowIconBox}><Feather name="edit-2" size={16} color="#6C63FF" /></View><Text style={s.rowText}>Profilni tahrirlash</Text></View>
                    <Ionicons name="chevron-forward" size={18} color="#ccc" />
                  </TouchableOpacity>
                  <View style={s.divider} />
                  <TouchableOpacity style={s.settingsRow} onPress={() => { closeSettings(); setTimeout(() => setShowPassword(true), 400); }}>
                    <View style={s.rowLeft}><View style={s.rowIconBox}><Ionicons name="key-outline" size={16} color="#6C63FF" /></View><Text style={s.rowText}>Parolni o'zgartirish</Text></View>
                    <Ionicons name="chevron-forward" size={18} color="#ccc" />
                  </TouchableOpacity>
                  <View style={s.divider} />
                  <TouchableOpacity style={s.settingsRow} onPress={handleAvatarUpload}>
                    <View style={s.rowLeft}><View style={s.rowIconBox}><Ionicons name="image-outline" size={16} color="#6C63FF" /></View><Text style={s.rowText}>Profil rasmini o'zgartirish</Text></View>
                    {uploadingAvatar ? <ActivityIndicator size="small" color="#6C63FF" /> : <Ionicons name="chevron-forward" size={18} color="#ccc" />}
                  </TouchableOpacity>
                </View>

                <Text style={s.sectionLabel}>ILOVA</Text>
                <View style={s.settingsCard}>
                  <View style={s.settingsRow}>
                    <View style={s.rowLeft}><View style={s.rowIconBox}><Ionicons name="notifications-outline" size={16} color="#6C63FF" /></View><Text style={s.rowText}>Bildirishnomalar</Text></View>
                    <Switch value={notifications} onValueChange={(val) => { setNotifications(val); saveSettings("notifications", val); }} trackColor={{ false: "#e0e0e0", true: "#c4bfff" }} thumbColor={notifications ? "#6C63FF" : "#fff"} />
                  </View>
                  <View style={s.divider} />
                  <View style={s.settingsRow}>
                    <View style={s.rowLeft}><View style={s.rowIconBox}><MaterialIcons name="auto-awesome" size={16} color="#6C63FF" /></View><Text style={s.rowText}>AI Kamera Maslahatlar</Text></View>
                    <Switch value={aiTips} onValueChange={(val) => { setAiTips(val); saveSettings("ai_tips", val); }} trackColor={{ false: "#e0e0e0", true: "#c4bfff" }} thumbColor={aiTips ? "#6C63FF" : "#fff"} />
                  </View>
                  <View style={s.divider} />
                  <View style={s.settingsRow}>
                    <View style={s.rowLeft}><View style={s.rowIconBox}><Ionicons name="lock-closed-outline" size={16} color="#6C63FF" /></View><Text style={s.rowText}>Yopiq hisob</Text></View>
                    <Switch value={privateAccount} onValueChange={(val) => { setPrivateAccount(val); saveSettings("private_account", val); }} trackColor={{ false: "#e0e0e0", true: "#c4bfff" }} thumbColor={privateAccount ? "#6C63FF" : "#fff"} />
                  </View>
                </View>

                <Text style={s.sectionLabel}>VAZIFALAR</Text>
                <View style={s.settingsCard}>
                  <TouchableOpacity style={s.settingsRow} onPress={handleChallengeReset}>
                    <View style={s.rowLeft}><View style={s.rowIconBox}><Ionicons name="refresh" size={16} color="#6C63FF" /></View><Text style={s.rowText}>Vazifalarni qaytarish</Text></View>
                    <Ionicons name="chevron-forward" size={18} color="#ccc" />
                  </TouchableOpacity>
                </View>

                <Text style={s.sectionLabel}>HISOB</Text>
                <View style={s.settingsCard}>
                  <TouchableOpacity style={s.settingsRow} onPress={handleLogout}>
                    <View style={s.rowLeft}><View style={[s.rowIconBox, { backgroundColor: "#fff0f0" }]}><Ionicons name="log-out-outline" size={16} color="#E24B4A" /></View><Text style={[s.rowText, { color: "#E24B4A" }]}>Chiqish</Text></View>
                    <Ionicons name="chevron-forward" size={18} color="#ccc" />
                  </TouchableOpacity>
                  <View style={s.divider} />
                  <TouchableOpacity style={s.settingsRow} onPress={() => { closeSettings(); setTimeout(() => setShowDeleteModal(true), 400); }}>
                    <View style={s.rowLeft}><View style={[s.rowIconBox, { backgroundColor: "#fff0f0" }]}><Ionicons name="trash-outline" size={16} color="#E24B4A" /></View><Text style={[s.rowText, { color: "#E24B4A", fontWeight: "700" }]}>Hisobni o'chirish</Text></View>
                    <Ionicons name="chevron-forward" size={18} color="#ccc" />
                  </TouchableOpacity>
                </View>
                <Text style={s.version}>Camera AI v1.0.0</Text>
                <View style={{ height: 40 }} />
              </ScrollView>
            </Animated.View>
          </Animated.View>
        </Modal>
      )}

      {/* ===== EDIT PROFILE MODAL ===== */}
      <Modal transparent animationType="slide" visible={showEdit}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <View style={s.modalOverlay}>
            <View style={s.modalBox}>
              <View style={s.modalHeader}>
                <Text style={s.modalTitle}>Profilni tahrirlash</Text>
                <TouchableOpacity style={s.closeBtn} onPress={() => setShowEdit(false)}>
                  <Ionicons name="close" size={20} color="#555" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={s.editAvatarBtn} onPress={handleAvatarUpload} disabled={uploadingAvatar}>
                <View style={s.editAvatarWrap}>
                  {profile?.avatar_url ? <Image source={{ uri: profile.avatar_url }} style={s.editAvatar} /> : <View style={s.editAvatarPlaceholder}><Text style={s.editAvatarLetter}>{(p.username || p.name || "U")[0].toUpperCase()}</Text></View>}
                  {uploadingAvatar ? <View style={s.editAvatarLoading}><ActivityIndicator color="#fff" size="small" /></View> : <View style={s.editAvatarOverlay}><Ionicons name="camera" size={20} color="#fff" /></View>}
                </View>
                <Text style={s.editAvatarText}>Rasmni o'zgartirish</Text>
              </TouchableOpacity>
              <Text style={s.inputLabel}>Username</Text>
              <View style={s.inputWrap}><Feather name="at-sign" size={16} color="#aaa" style={s.inputIcon} /><TextInput style={s.inputField} value={editUsername} onChangeText={setEditUsername} placeholder="username" placeholderTextColor="#bbb" autoCapitalize="none" /></View>
              <Text style={s.inputLabel}>To'liq ism</Text>
              <View style={s.inputWrap}><Feather name="user" size={16} color="#aaa" style={s.inputIcon} /><TextInput style={s.inputField} value={editFullName} onChangeText={setEditFullName} placeholder="Ism Familiya" placeholderTextColor="#bbb" /></View>
              <Text style={s.inputLabel}>Bio</Text>
              <View style={[s.inputWrap, { alignItems: "flex-start", paddingTop: 12 }]}><Feather name="file-text" size={16} color="#aaa" style={[s.inputIcon, { marginTop: 2 }]} /><TextInput style={[s.inputField, s.inputMulti]} value={editBio} onChangeText={setEditBio} placeholder="O'zingiz haqingizda..." placeholderTextColor="#bbb" multiline numberOfLines={3} /></View>
              <TouchableOpacity style={[s.saveBtn, savingEdit && s.saveBtnDisabled]} onPress={handleSaveEdit} disabled={savingEdit}>
                {savingEdit ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveBtnText}>Saqlash</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ===== CHANGE PASSWORD MODAL ===== */}
      <Modal transparent animationType="slide" visible={showPassword}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <View style={s.modalOverlay}>
            <View style={s.modalBox}>
              <View style={s.modalHeader}>
                <Text style={s.modalTitle}>Parolni o'zgartirish</Text>
                <TouchableOpacity style={s.closeBtn} onPress={() => { setShowPassword(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }}>
                  <Ionicons name="close" size={20} color="#555" />
                </TouchableOpacity>
              </View>
              <Text style={s.inputLabel}>Joriy parol</Text>
              <View style={s.inputWrap}><Ionicons name="lock-closed-outline" size={16} color="#aaa" style={s.inputIcon} /><TextInput style={s.inputField} value={currentPassword} onChangeText={setCurrentPassword} placeholder="••••••••" placeholderTextColor="#bbb" secureTextEntry /></View>
              <Text style={s.inputLabel}>Yangi parol</Text>
              <View style={s.inputWrap}><Ionicons name="lock-open-outline" size={16} color="#aaa" style={s.inputIcon} /><TextInput style={s.inputField} value={newPassword} onChangeText={setNewPassword} placeholder="••••••••" placeholderTextColor="#bbb" secureTextEntry /></View>
              <Text style={s.inputLabel}>Yangi parolni tasdiqlang</Text>
              <View style={[s.inputWrap, newPassword && confirmPassword && newPassword !== confirmPassword && s.inputWrapError]}>
                <Ionicons name="shield-checkmark-outline" size={16} color="#aaa" style={s.inputIcon} />
                <TextInput style={s.inputField} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="••••••••" placeholderTextColor="#bbb" secureTextEntry />
              </View>
              {newPassword && confirmPassword && newPassword !== confirmPassword && <Text style={s.errorText}>Parollar mos emas</Text>}
              <TouchableOpacity style={[s.saveBtn, savingPassword && s.saveBtnDisabled]} onPress={handleChangePassword} disabled={savingPassword}>
                {savingPassword ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveBtnText}>O'zgartirish</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ===== DELETE ACCOUNT MODAL ===== */}
      <Modal transparent animationType="fade" visible={showDeleteModal}>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.deleteIconWrap}><Ionicons name="warning" size={40} color="#E24B4A" /></View>
            <Text style={s.deleteTitle}>Hisobni o'chirish</Text>
            <Text style={s.deleteDesc}>Bu amalni qaytarib bo'lmaydi. Barcha rasmlar, tahlillar va ma'lumotlar butunlay o'chib ketadi.</Text>
            <View style={s.deleteWarning}><Text style={s.deleteWarningText}>Davom etish uchun kiriting:{"\n"}<Text style={s.deleteCode}>O'CHIRISH</Text></Text></View>
            <TextInput style={s.deleteInput} placeholder="O'CHIRISH" value={deleteText} onChangeText={setDeleteText} placeholderTextColor="#ccc" autoCapitalize="characters" />
            <View style={s.deleteBtns}>
              <TouchableOpacity style={s.deleteCancelBtn} onPress={() => { setShowDeleteModal(false); setDeleteText(""); }}>
                <Text style={s.deleteCancelText}>Bekor</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.deleteConfirmBtn, deleteText !== "O'CHIRISH" && s.deleteConfirmDisabled]} onPress={handleDeleteAccount} disabled={deleting || deleteText !== "O'CHIRISH"}>
                {deleting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.deleteConfirmText}>O'chirish</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8fc" },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { backgroundColor: "#fff", paddingTop: 52, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#f5f5f5", justifyContent: "center", alignItems: "center" },
  headerUsername: { fontSize: 17, fontWeight: "700", color: "#1a1a1a" },
  profileCard: { backgroundColor: "#fff", margin: 16, borderRadius: 20, padding: 20, elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 12 },
  avatarRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  avatarWrap: { position: "relative", marginRight: 20, width: AVATAR_SIZE, height: AVATAR_SIZE },
  avatar: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, borderWidth: 3, borderColor: "#6C63FF" },
  avatarPlaceholder: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, backgroundColor: "#6C63FF", justifyContent: "center", alignItems: "center" },
  avatarLetter: { fontSize: 36, fontWeight: "700", color: "#fff" },
  avatarLoading: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderRadius: AVATAR_SIZE / 2, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  avatarEditBadge: { position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: "#6C63FF", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#fff" },
  statsRow: { flex: 1, flexDirection: "row", justifyContent: "space-around" },
  statItem: { alignItems: "center" },
  statNum: { fontSize: 20, fontWeight: "700", color: "#1a1a1a" },
  statLabel: { fontSize: 11, color: "#888", marginTop: 2 },
  bioSection: { marginBottom: 12 },
  displayName: { fontSize: 17, fontWeight: "700", color: "#1a1a1a", marginBottom: 4 },
  bio: { fontSize: 14, color: "#555", lineHeight: 20, marginBottom: 8 },
  bioPlaceholder: { fontSize: 14, color: "#ccc", marginBottom: 8 },
  badgeRow: { flexDirection: "row", gap: 8 },
  xpBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#f0eeff", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  xpText: { fontSize: 13, fontWeight: "700", color: "#6C63FF" },
  progressWrap: { marginBottom: 14 },
  progressBar: { height: 6, backgroundColor: "#f0f0f0", borderRadius: 3, overflow: "hidden", marginBottom: 4 },
  progressFill: { height: 6, backgroundColor: "#6C63FF", borderRadius: 3 },
  progressLabel: { fontSize: 11, color: "#aaa" },
  editBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5, borderColor: "#6C63FF", borderRadius: 12, paddingVertical: 11 },
  editBtnText: { color: "#6C63FF", fontSize: 15, fontWeight: "600" },
  followBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#6C63FF", borderRadius: 12, paddingVertical: 12 },
  followBtnActive: { backgroundColor: "#f5f5f5", borderWidth: 1, borderColor: "#e0e0e0" },
  followBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  followBtnTextActive: { color: "#555" },
  tabs: { flexDirection: "row", backgroundColor: "#fff", marginHorizontal: 16, borderRadius: 14, padding: 4, marginBottom: 12, elevation: 1 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10 },
  tabActive: { backgroundColor: "#6C63FF" },
  tabText: { fontSize: 13, color: "#888", fontWeight: "600" },
  tabTextActive: { color: "#fff" },
  grid: { paddingHorizontal: 16 },
  gridInner: { flexDirection: "row", flexWrap: "wrap", gap: 3 },
  gridItem: { width: (width - 32 - 6) / 3, height: (width - 32 - 6) / 3, position: "relative" },
  gridImg: { width: "100%", height: "100%", borderRadius: 8 },
  gridBadge: { position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(108,99,255,0.9)", justifyContent: "center", alignItems: "center" },
  emptyBox: { alignItems: "center", paddingVertical: 48 },
  emptyText: { fontSize: 16, color: "#aaa", marginBottom: 16, marginTop: 12 },
  uploadBtn: { backgroundColor: "#6C63FF", borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  uploadBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  analysesList: { paddingHorizontal: 16, gap: 10 },
  analysisCard: { backgroundColor: "#fff", borderRadius: 16, padding: 12, flexDirection: "row", alignItems: "center", gap: 12, elevation: 1 },
  analysisImg: { width: 64, height: 64, borderRadius: 10 },
  analysisInfo: { flex: 1 },
  analysisTitle: { fontSize: 15, fontWeight: "700", color: "#1a1a1a", marginBottom: 2 },
  analysisDate: { fontSize: 12, color: "#aaa", marginBottom: 6 },
  scoreRow: { flexDirection: "row", gap: 6 },
  scoreChip: { backgroundColor: "#f0eeff", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  scoreChipText: { fontSize: 10, color: "#6C63FF", fontWeight: "600" },

  // PHOTO DETAIL MODAL
  photoModalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center", alignItems: "center" },
  photoModalClose: { position: "absolute", top: 52, right: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center", zIndex: 10 },
  photoModalImage: { width, height: width, },
  photoModalAIBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#6C63FF", borderRadius: 16, paddingHorizontal: 24, paddingVertical: 14, marginTop: 20 },
  photoModalAIBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", flexDirection: "row", justifyContent: "flex-end" },
  settingsPanel: { width: width * 0.84, backgroundColor: "#fff", paddingTop: 56, paddingHorizontal: 20 },
  settingsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  settingsTitle: { fontSize: 22, fontWeight: "700", color: "#1a1a1a" },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#f5f5f5", justifyContent: "center", alignItems: "center" },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: "#aaa", letterSpacing: 1, marginBottom: 6, marginTop: 16 },
  settingsCard: { backgroundColor: "#f8f8fc", borderRadius: 16, overflow: "hidden" },
  settingsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  rowIconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#f0eeff", justifyContent: "center", alignItems: "center" },
  rowText: { fontSize: 15, color: "#1a1a1a" },
  divider: { height: 1, backgroundColor: "#efefef", marginLeft: 60 },
  version: { textAlign: "center", color: "#ccc", fontSize: 12, marginTop: 24 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalBox: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#1a1a1a" },
  editAvatarBtn: { alignItems: "center", marginBottom: 20 },
  editAvatarWrap: { position: "relative", width: 80, height: 80, marginBottom: 8 },
  editAvatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: "#6C63FF" },
  editAvatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#6C63FF", justifyContent: "center", alignItems: "center" },
  editAvatarLetter: { fontSize: 32, fontWeight: "700", color: "#fff" },
  editAvatarLoading: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderRadius: 40, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  editAvatarOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderRadius: 40, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", alignItems: "center" },
  editAvatarText: { color: "#6C63FF", fontSize: 14, fontWeight: "600" },
  inputLabel: { fontSize: 13, fontWeight: "600", color: "#555", marginBottom: 6 },
  inputWrap: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: "#e0e0e0", borderRadius: 12, backgroundColor: "#fafafa", marginBottom: 14, paddingHorizontal: 14 },
  inputWrapError: { borderColor: "#E24B4A" },
  inputIcon: { marginRight: 8 },
  inputField: { flex: 1, paddingVertical: 14, fontSize: 15, color: "#1a1a1a" },
  inputMulti: { height: 72, textAlignVertical: "top", paddingTop: 0 },
  errorText: { color: "#E24B4A", fontSize: 12, marginTop: -10, marginBottom: 10 },
  saveBtn: { backgroundColor: "#6C63FF", borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 4 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  deleteIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#fff0f0", justifyContent: "center", alignItems: "center", alignSelf: "center", marginBottom: 12 },
  deleteTitle: { fontSize: 22, fontWeight: "700", color: "#E24B4A", textAlign: "center", marginBottom: 8 },
  deleteDesc: { fontSize: 14, color: "#555", textAlign: "center", lineHeight: 20, marginBottom: 16 },
  deleteWarning: { backgroundColor: "#fff5f5", borderRadius: 12, padding: 12, width: "100%", marginBottom: 16 },
  deleteWarningText: { fontSize: 13, color: "#555", textAlign: "center", lineHeight: 20 },
  deleteCode: { fontWeight: "700", color: "#E24B4A" },
  deleteInput: { borderWidth: 2, borderColor: "#E24B4A", borderRadius: 12, padding: 14, fontSize: 16, fontWeight: "700", textAlign: "center", color: "#E24B4A", marginBottom: 20 },
  deleteBtns: { flexDirection: "row", gap: 12 },
  deleteCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: "#e0e0e0", alignItems: "center" },
  deleteCancelText: { fontSize: 15, color: "#555" },
  deleteConfirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: "#E24B4A", alignItems: "center" },
  deleteConfirmDisabled: { backgroundColor: "#ffb3b3" },
  deleteConfirmText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
