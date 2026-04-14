import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";

const LEVELS = [
  {
    id: "beginner",
    label: "Yangi boshlovchi",
    sub: "Hobbist",
    icon: "leaf-outline",
    color: "#1D9E75",
    bg: "#f0faf5",
  },
  {
    id: "intermediate",
    label: "O'rta daraja",
    sub: "Bir muncha tajribam bor",
    icon: "camera-outline",
    color: "#6C63FF",
    bg: "#f0eeff",
  },
  {
    id: "pro",
    label: "Professional",
    sub: "Keng tajribaga egaman",
    icon: "trophy-outline",
    color: "#EF9F27",
    bg: "#fff8ed",
  },
];

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [level, setLevel] = useState("beginner");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);
  const { signUp } = useAuth();

  const handleRegister = async () => {
    if (!name || !email || !password)
      return Alert.alert("Xato", "Barcha maydonlarni to'ldiring");
    if (password.length < 6)
      return Alert.alert("Xato", "Parol kamida 6 ta belgi bo'lishi kerak");
    setLoading(true);
    try {
      await signUp(name, email, password, level);
    } catch (err) {
      Alert.alert("Xato", err.message || "Ro'yxatdan o'tishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={s.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* HEADER */}
        <View style={s.header}>
          <View style={s.logoBadge}>
            <Ionicons name="camera" size={28} color="#fff" />
          </View>
          <View>
            <Text style={s.headerTitle}>Hisob yaratish</Text>
            <Text style={s.headerSub}>Bir necha soniyada boshlang</Text>
          </View>
        </View>

        {/* FORM */}
        <View style={s.form}>
          {/* Name */}
          <View style={[s.inputWrap, focused === "name" && s.inputWrapFocused]}>
            <Ionicons
              name="person-outline"
              size={17}
              color={focused === "name" ? "#6C63FF" : "#bbb"}
            />
            <TextInput
              style={s.input}
              placeholder="Ism Familiya"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#ccc"
              onFocus={() => setFocused("name")}
              onBlur={() => setFocused(null)}
            />
          </View>

          {/* Email */}
          <View
            style={[s.inputWrap, focused === "email" && s.inputWrapFocused]}
          >
            <Ionicons
              name="mail-outline"
              size={17}
              color={focused === "email" ? "#6C63FF" : "#bbb"}
            />
            <TextInput
              style={s.input}
              placeholder="Email manzil"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#ccc"
              onFocus={() => setFocused("email")}
              onBlur={() => setFocused(null)}
            />
          </View>

          {/* Password */}
          <View style={[s.inputWrap, focused === "pass" && s.inputWrapFocused]}>
            <Ionicons
              name="lock-closed-outline"
              size={17}
              color={focused === "pass" ? "#6C63FF" : "#bbb"}
            />
            <TextInput
              style={s.input}
              placeholder="Parol (kamida 6 belgi)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              placeholderTextColor="#ccc"
              onFocus={() => setFocused("pass")}
              onBlur={() => setFocused(null)}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
              <Ionicons
                name={showPass ? "eye-outline" : "eye-off-outline"}
                size={17}
                color="#bbb"
              />
            </TouchableOpacity>
          </View>

          {/* Level */}
          <Text style={s.levelTitle}>Darajangizni tanlang</Text>
          <View style={s.levelList}>
            {LEVELS.map((l) => (
              <TouchableOpacity
                key={l.id}
                style={[
                  s.levelCard,
                  level === l.id && {
                    borderColor: l.color,
                    backgroundColor: l.bg,
                  },
                ]}
                onPress={() => setLevel(l.id)}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    s.levelIconBox,
                    {
                      backgroundColor:
                        level === l.id ? l.color + "20" : "#f5f5f5",
                    },
                  ]}
                >
                  <Ionicons
                    name={l.icon}
                    size={20}
                    color={level === l.id ? l.color : "#bbb"}
                  />
                </View>
                <View style={s.levelInfo}>
                  <Text
                    style={[s.levelLabel, level === l.id && { color: l.color }]}
                  >
                    {l.label}
                  </Text>
                  <Text style={s.levelSub}>{l.sub}</Text>
                </View>
                {level === l.id && (
                  <View style={[s.levelCheck, { backgroundColor: l.color }]}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[s.btn, loading && s.btnLoading]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View style={s.btnInner}>
                <Text style={s.btnText}>Ro'yxatdan o'tish</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </View>
            )}
          </TouchableOpacity>

          {/* Login link */}
          <TouchableOpacity
            style={s.loginLink}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={s.loginLinkText}>
              Hisobingiz bormi? <Text style={s.loginLinkBold}>Kirish</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: "#f8f8fc" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#fff",
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    marginBottom: 16,
  },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#6C63FF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6C63FF",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#1a1a1a" },
  headerSub: { fontSize: 13, color: "#aaa", marginTop: 2 },

  form: {
    backgroundColor: "#fff",
    borderRadius: 24,
    margin: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderColor: "#ececec",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#fafafa",
    marginBottom: 12,
  },
  inputWrapFocused: { borderColor: "#6C63FF", backgroundColor: "#fff" },
  input: { flex: 1, fontSize: 15, color: "#1a1a1a" },

  levelTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#444",
    marginTop: 8,
    marginBottom: 12,
  },
  levelList: { gap: 10, marginBottom: 20 },
  levelCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderColor: "#ececec",
    borderRadius: 14,
    padding: 14,
    backgroundColor: "#fafafa",
  },
  levelIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  levelInfo: { flex: 1 },
  levelLabel: { fontSize: 14, fontWeight: "700", color: "#1a1a1a" },
  levelSub: { fontSize: 12, color: "#bbb", marginTop: 2 },
  levelCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },

  btn: {
    backgroundColor: "#6C63FF",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    shadowColor: "#6C63FF",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  btnLoading: { opacity: 0.8 },
  btnInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  loginLink: { alignItems: "center", marginTop: 16 },
  loginLinkText: { fontSize: 14, color: "#aaa" },
  loginLinkBold: { color: "#6C63FF", fontWeight: "700" },
});
