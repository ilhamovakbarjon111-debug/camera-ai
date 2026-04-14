import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { Ionicons, Feather } from "@expo/vector-icons";
import api from "../../services/api";
import { addXP, verifyChallenge } from "../../services/api";

const LEVEL_INFO = {
  beginner: {
    label: "Yangi boshlovchi",
    color: "#1D9E75",
    bg: "#f0faf5",
    icon: "leaf-outline",
  },
  intermediate: {
    label: "O'rta daraja",
    color: "#6C63FF",
    bg: "#f0eeff",
    icon: "camera-outline",
  },
  pro: {
    label: "Professional",
    color: "#EF9F27",
    bg: "#fff8ed",
    icon: "trophy-outline",
  },
};

const TipIcon = ({ tip }) => {
  if (tip.iconLib === "Feather")
    return <Feather name={tip.icon} size={20} color={tip.color} />;
  return <Ionicons name={tip.icon} size={20} color={tip.color} />;
};

export default function CameraScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("tips");
  const [expandedTip, setExpandedTip] = useState(null);

  // Tips
  const [tips, setTips] = useState([]);
  const [tipsLoading, setTipsLoading] = useState(true);

  // Daily challenges
  const [challenges, setChallenges] = useState([]);
  const [challengesLoading, setChallengesLoading] = useState(true);
  const [challengeDate, setChallengeDate] = useState("");

  // Reward modal
  const [rewardModal, setRewardModal] = useState(false);
  const [currentReward, setCurrentReward] = useState(null);
  const [scaleAnim] = useState(new Animated.Value(0));
  const [verifying, setVerifying] = useState(false);

  const level = user?.level || "beginner";
  const levelInfo = LEVEL_INFO[level] || LEVEL_INFO.beginner;

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        loadTips();
        loadChallenges();
      }
    }, [user?.id]),
  );

  const loadTips = async () => {
    setTipsLoading(true);
    try {
      const data = await api.get("/challenges/tips");
      setTips(data.tips || []);
    } catch {
      setTips(getDefaultTips(level));
    } finally {
      setTipsLoading(false);
    }
  };

  const loadChallenges = async () => {
    setChallengesLoading(true);
    try {
      const data = await api.get("/challenges/daily");
      setChallenges(data.challenges || []);
      setChallengeDate(data.date || "");
    } catch {
      setChallenges([]);
    } finally {
      setChallengesLoading(false);
    }
  };

  const handleChallenge = async (challenge) => {
    if (challenge.completed) {
      Alert.alert("Bajarilgan ✅", "Bu vazifani allaqachon bajardingiz!");
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Ruxsat kerak", "Kamera ruxsatini bering");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      setVerifying(true);
      try {
        const asset = result.assets[0];
        const verification = await verifyChallenge({
          imageBase64: asset.base64,
          mimeType: asset.mimeType || "image/jpeg",
          challengeTitle: challenge.title,
          challengeDesc: challenge.description,
        });

        if (verification.approved) {
          // Backend ga yuborish
          try {
            await api.post(`/challenges/daily/${challenge.id}/complete`);
          } catch {}
          try {
            await addXP(challenge.xp);
          } catch {}

          setChallenges((prev) =>
            prev.map((c) =>
              c.id === challenge.id ? { ...c, completed: true } : c,
            ),
          );
          showReward(challenge);
        } else {
          Alert.alert(
            "Qabul qilinmadi",
            (verification.reason || "") + "\n\nQaytadan urinib ko'ring!",
          );
        }
      } catch {
        Alert.alert("Xato", "Tekshirishda xatolik");
      } finally {
        setVerifying(false);
      }
    }
  };

  const showReward = (challenge) => {
    setCurrentReward(challenge);
    setRewardModal(true);
    scaleAnim.setValue(0);
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const closeReward = () => {
    scaleAnim.setValue(0);
    setRewardModal(false);
  };

  const completedCount = challenges.filter((c) => c.completed).length;
  const totalXP = challenges
    .filter((c) => c.completed)
    .reduce((sum, c) => sum + (c.xp || 0), 0);
  const today = new Date().toLocaleDateString("uz-UZ", {
    day: "numeric",
    month: "long",
  });

  return (
    <View style={s.container}>
      {/* HEADER */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.headerIconBox}>
            <Ionicons name="school-outline" size={18} color="#6C63FF" />
          </View>
          <View>
            <Text style={s.headerTitle}>Kamera Maktabi</Text>
            <View style={[s.levelBadge, { backgroundColor: levelInfo.bg }]}>
              <Ionicons
                name={levelInfo.icon}
                size={10}
                color={levelInfo.color}
              />
              <Text style={[s.levelBadgeText, { color: levelInfo.color }]}>
                {levelInfo.label}
              </Text>
            </View>
          </View>
        </View>
        <View style={s.xpBadge}>
          <Ionicons name="star" size={13} color="#6C63FF" />
          <Text style={s.xpText}>{totalXP} XP</Text>
        </View>
      </View>

      {/* TABS */}
      <View style={s.tabs}>
        <TouchableOpacity
          style={[s.tab, activeTab === "tips" && s.tabActive]}
          onPress={() => setActiveTab("tips")}
        >
          <Ionicons
            name="bulb-outline"
            size={15}
            color={activeTab === "tips" ? "#fff" : "#888"}
          />
          <Text style={[s.tabText, activeTab === "tips" && s.tabTextActive]}>
            Maslahatlar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, activeTab === "challenges" && s.tabActive]}
          onPress={() => setActiveTab("challenges")}
        >
          <Ionicons
            name="trophy-outline"
            size={15}
            color={activeTab === "challenges" ? "#fff" : "#888"}
          />
          <Text
            style={[s.tabText, activeTab === "challenges" && s.tabTextActive]}
          >
            Bugungi vazifalar{" "}
            {completedCount > 0 ? `${completedCount}/${challenges.length}` : ""}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        {activeTab === "tips" ? (
          <View style={s.section}>
            <View style={[s.levelCard, { backgroundColor: levelInfo.bg }]}>
              <Ionicons
                name={levelInfo.icon}
                size={22}
                color={levelInfo.color}
              />
              <View style={{ flex: 1 }}>
                <Text style={[s.levelCardTitle, { color: levelInfo.color }]}>
                  {levelInfo.label} maslahatlar
                </Text>
                <Text style={s.levelCardSub}>Darajangizga mos texnikalar</Text>
              </View>
            </View>

            {tipsLoading ? (
              <ActivityIndicator color="#6C63FF" style={{ marginTop: 24 }} />
            ) : (
              tips.map((tip) => (
                <TouchableOpacity
                  key={tip.id}
                  style={s.tipCard}
                  onPress={() =>
                    setExpandedTip(expandedTip === tip.id ? null : tip.id)
                  }
                  activeOpacity={0.8}
                >
                  <View style={s.tipHeader}>
                    <View
                      style={[
                        s.tipIconBox,
                        { backgroundColor: tip.color + "15" },
                      ]}
                    >
                      <TipIcon tip={tip} />
                    </View>
                    <View style={s.tipTitleBox}>
                      <Text style={s.tipTitle}>{tip.title}</Text>
                      <Text
                        style={s.tipShort}
                        numberOfLines={expandedTip === tip.id ? 0 : 1}
                      >
                        {tip.desc}
                      </Text>
                    </View>
                    <Ionicons
                      name={
                        expandedTip === tip.id ? "chevron-up" : "chevron-down"
                      }
                      size={16}
                      color="#ccc"
                    />
                  </View>
                  {expandedTip === tip.id && (
                    <View style={s.tipExpanded}>
                      <View
                        style={[
                          s.exampleBox,
                          { backgroundColor: tip.color + "12" },
                        ]}
                      >
                        <Text style={[s.exampleLabel, { color: tip.color }]}>
                          Misol:
                        </Text>
                        <Text style={s.exampleText}>{tip.example}</Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        ) : (
          <View style={s.section}>
            {/* DATE CARD */}
            <View style={s.dateCard}>
              <Ionicons name="calendar-outline" size={18} color="#6C63FF" />
              <View style={{ flex: 1 }}>
                <Text style={s.dateTitle}>Bugungi vazifalar</Text>
                <Text style={s.dateText}>{today} — har kuni yangilanadi</Text>
              </View>
              <TouchableOpacity onPress={loadChallenges}>
                <Ionicons name="refresh-outline" size={20} color="#6C63FF" />
              </TouchableOpacity>
            </View>

            {/* PROGRESS */}
            <View style={s.progressCard}>
              <View style={s.progressRow}>
                <View style={s.progressStat}>
                  <Text style={s.progressNum}>
                    {completedCount}/{challenges.length}
                  </Text>
                  <Text style={s.progressLabel}>Bajarildi</Text>
                </View>
                <View style={s.progressDivider} />
                <View style={s.progressStat}>
                  <Text style={s.progressNum}>{totalXP}</Text>
                  <Text style={s.progressLabel}>XP qozonildi</Text>
                </View>
                <View style={s.progressDivider} />
                <View style={s.progressStat}>
                  <Text style={s.progressNum}>
                    {challenges.length > 0
                      ? Math.round((completedCount / challenges.length) * 100)
                      : 0}
                    %
                  </Text>
                  <Text style={s.progressLabel}>Faollik</Text>
                </View>
              </View>
              <View style={s.progressBarWrap}>
                <View style={s.progressBar}>
                  <View
                    style={[
                      s.progressFill,
                      {
                        width:
                          challenges.length > 0
                            ? `${(completedCount / challenges.length) * 100}%`
                            : "0%",
                      },
                    ]}
                  />
                </View>
              </View>
            </View>

            {challengesLoading ? (
              <View style={s.loadingBox}>
                <ActivityIndicator color="#6C63FF" size="large" />
                <Text style={s.loadingText}>
                  AI bugungi vazifalarni tayyorlamoqda...
                </Text>
              </View>
            ) : (
              challenges.map((ch) => (
                <TouchableOpacity
                  key={ch.id}
                  style={[s.challengeCard, ch.completed && s.challengeCardDone]}
                  onPress={() => handleChallenge(ch)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      s.challengeIconBox,
                      { backgroundColor: (ch.color || "#6C63FF") + "20" },
                    ]}
                  >
                    <Ionicons
                      name={ch.icon || "camera-outline"}
                      size={24}
                      color={ch.completed ? "#1D9E75" : ch.color || "#6C63FF"}
                    />
                  </View>
                  <View style={s.challengeInfo}>
                    <View style={s.challengeTitleRow}>
                      <Text
                        style={[
                          s.challengeTitle,
                          ch.completed && s.challengeTitleDone,
                        ]}
                      >
                        {ch.title}
                      </Text>
                      <View
                        style={[
                          s.difficultyBadge,
                          getDifficultyStyle(ch.difficulty),
                        ]}
                      >
                        <Text
                          style={[
                            s.difficultyText,
                            getDifficultyTextStyle(ch.difficulty),
                          ]}
                        >
                          {ch.difficulty || "oson"}
                        </Text>
                      </View>
                    </View>
                    <Text style={s.challengeDesc}>{ch.description}</Text>
                    <View style={s.xpRow}>
                      <View style={[s.xpChip, ch.completed && s.xpChipDone]}>
                        <Ionicons
                          name="star"
                          size={10}
                          color={ch.completed ? "#1D9E75" : "#6C63FF"}
                        />
                        <Text
                          style={[
                            s.xpChipText,
                            ch.completed && s.xpChipTextDone,
                          ]}
                        >
                          +{ch.xp} XP
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View
                    style={[
                      s.challengeStatus,
                      ch.completed && s.challengeStatusDone,
                    ]}
                  >
                    <Ionicons
                      name={ch.completed ? "checkmark" : "camera-outline"}
                      size={18}
                      color={ch.completed ? "#fff" : "#aaa"}
                    />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* VERIFYING */}
      {verifying && (
        <View style={s.verifyingOverlay}>
          <View style={s.verifyingBox}>
            <ActivityIndicator size="large" color="#6C63FF" />
            <Text style={s.verifyingTitle}>AI tekshirmoqda...</Text>
            <Text style={s.verifyingSubText}>
              Rasm vazifaga mosligini tahlil qilyapmiz
            </Text>
          </View>
        </View>
      )}

      {/* REWARD MODAL */}
      <Modal visible={rewardModal} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <Animated.View
            style={[s.rewardModal, { transform: [{ scale: scaleAnim }] }]}
          >
            <View style={s.rewardIconWrap}>
              <Ionicons name="trophy" size={44} color="#EF9F27" />
            </View>
            <Text style={s.rewardTitle}>Tabriklaymiz! 🎉</Text>
            <Text style={s.rewardChallenge}>
              "{currentReward?.title}" bajarildi!
            </Text>
            <View style={s.rewardXPBox}>
              <Text style={s.rewardXPLabel}>Qozonildi</Text>
              <View style={s.rewardXPRow}>
                <Ionicons name="star" size={22} color="#6C63FF" />
                <Text style={s.rewardXP}>+{currentReward?.xp} XP</Text>
              </View>
            </View>
            <TouchableOpacity
              style={s.rewardBtn}
              onPress={closeReward}
              activeOpacity={0.85}
            >
              <Text style={s.rewardBtnText}>Davom etish</Text>
              <Ionicons name="rocket-outline" size={18} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const getDifficultyStyle = (d) => {
  if (d === "qiyin") return { backgroundColor: "#fff0f0" };
  if (d === "o'rta") return { backgroundColor: "#fff8ed" };
  return { backgroundColor: "#f0faf5" };
};
const getDifficultyTextStyle = (d) => {
  if (d === "qiyin") return { color: "#E24B4A" };
  if (d === "o'rta") return { color: "#EF9F27" };
  return { color: "#1D9E75" };
};

const getDefaultTips = (level) => {
  return [
    {
      id: "1",
      icon: "grid-outline",
      title: "Uchinchilar qoidasi",
      desc: "Rasmni 9 teng qismga bo'ling.",
      example: "Portretda ko'zlar yuqori chiziqda.",
      color: "#6C63FF",
    },
    {
      id: "2",
      icon: "sunny-outline",
      title: "Yorug'lik yo'nalishi",
      desc: "Yorug'lik oldidan tushsa aniq ko'rinadi.",
      example: "Ertalab yoki kechqurun oling.",
      color: "#EF9F27",
    },
    {
      id: "3",
      icon: "remove-outline",
      title: "Gorizontal chiziq",
      desc: "Ufq chizig'i doim to'g'ri bo'lsin.",
      example: "Dengiz rasmlarida e'tibor bering.",
      color: "#1D9E75",
    },
  ];
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8fc" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 52,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f0eeff",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#1a1a1a" },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 2,
  },
  levelBadgeText: { fontSize: 10, fontWeight: "700" },
  xpBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#f0eeff",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  xpText: { fontSize: 13, fontWeight: "700", color: "#6C63FF" },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 6,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabActive: { backgroundColor: "#6C63FF" },
  tabText: { fontSize: 12, color: "#888", fontWeight: "600" },
  tabTextActive: { color: "#fff" },
  content: { flex: 1 },
  section: { padding: 16 },
  levelCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  levelCardTitle: { fontSize: 14, fontWeight: "700" },
  levelCardSub: { fontSize: 12, color: "#999", marginTop: 2 },
  tipCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  tipHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  tipIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  tipTitleBox: { flex: 1 },
  tipTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 3,
  },
  tipShort: { fontSize: 12, color: "#aaa", lineHeight: 17 },
  tipExpanded: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f5f5f5",
  },
  exampleBox: { borderRadius: 10, padding: 12 },
  exampleLabel: { fontSize: 11, fontWeight: "700", marginBottom: 4 },
  exampleText: { fontSize: 13, color: "#444", lineHeight: 18 },
  dateCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  dateTitle: { fontSize: 14, fontWeight: "700", color: "#1a1a1a" },
  dateText: { fontSize: 12, color: "#aaa", marginTop: 2 },
  progressCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  progressStat: { alignItems: "center", gap: 4 },
  progressNum: { fontSize: 20, fontWeight: "800", color: "#6C63FF" },
  progressLabel: { fontSize: 11, color: "#aaa" },
  progressDivider: { width: 1, backgroundColor: "#f0f0f0" },
  progressBarWrap: {},
  progressBar: {
    height: 6,
    backgroundColor: "#f0f0f0",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: { height: 6, backgroundColor: "#6C63FF", borderRadius: 3 },
  loadingBox: { alignItems: "center", paddingVertical: 40, gap: 12 },
  loadingText: { fontSize: 13, color: "#aaa" },
  challengeCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  challengeCardDone: { backgroundColor: "#f0faf5" },
  challengeIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  challengeInfo: { flex: 1 },
  challengeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  challengeTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    flex: 1,
  },
  challengeTitleDone: { color: "#1D9E75" },
  difficultyBadge: {
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  difficultyText: { fontSize: 10, fontWeight: "600" },
  challengeDesc: {
    fontSize: 12,
    color: "#aaa",
    lineHeight: 17,
    marginBottom: 7,
  },
  xpRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  xpChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#f0eeff",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  xpChipDone: { backgroundColor: "#f0faf5" },
  xpChipText: { fontSize: 11, fontWeight: "700", color: "#6C63FF" },
  xpChipTextDone: { color: "#1D9E75" },
  challengeStatus: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  challengeStatusDone: { backgroundColor: "#1D9E75" },
  verifyingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  verifyingBox: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    gap: 12,
    width: "75%",
  },
  verifyingTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  verifyingSubText: { fontSize: 12, color: "#aaa", textAlign: "center" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  rewardModal: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 28,
    alignItems: "center",
    width: "100%",
  },
  rewardIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#fff8ed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  rewardTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  rewardChallenge: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginBottom: 20,
  },
  rewardXPBox: {
    backgroundColor: "#f0eeff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  rewardXPLabel: { fontSize: 12, color: "#aaa", marginBottom: 6 },
  rewardXPRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  rewardXP: { fontSize: 28, fontWeight: "800", color: "#6C63FF" },
  rewardBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#6C63FF",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  rewardBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
