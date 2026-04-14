import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password)
      return Alert.alert("Xato", "Barcha maydonlarni to'ldiring");
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err) {
      Alert.alert("Xato", err.message || "Kirishda xatolik");
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
        contentContainerStyle={s.inner}
        keyboardShouldPersistTaps="handled"
      >
        {/* LOGO */}
        <View style={s.logoSection}>
          <View style={s.logoBadge}>
            <Ionicons name="camera" size={36} color="#fff" />
          </View>
          <Text style={s.logoTitle}>
            Camera <Text style={s.logoAI}>AI</Text>
          </Text>
          <Text style={s.logoSub}>Fotografiya dunyosiga xush kelibsiz</Text>
        </View>

        {/* FORM */}
        <View style={s.form}>
          <Text style={s.formTitle}>Kirish</Text>

          {/* Email */}
          <View
            style={[
              s.inputWrap,
              focusedInput === "email" && s.inputWrapFocused,
            ]}
          >
            <Ionicons
              name="mail-outline"
              size={18}
              color={focusedInput === "email" ? "#6C63FF" : "#bbb"}
            />
            <TextInput
              style={s.input}
              placeholder="Email manzil"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#ccc"
              onFocus={() => setFocusedInput("email")}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          {/* Password */}
          <View
            style={[s.inputWrap, focusedInput === "pass" && s.inputWrapFocused]}
          >
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color={focusedInput === "pass" ? "#6C63FF" : "#bbb"}
            />
            <TextInput
              style={s.input}
              placeholder="Parol"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              placeholderTextColor="#ccc"
              onFocus={() => setFocusedInput("pass")}
              onBlur={() => setFocusedInput(null)}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
              <Ionicons
                name={showPass ? "eye-outline" : "eye-off-outline"}
                size={18}
                color="#bbb"
              />
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[s.btn, loading && s.btnLoading]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View style={s.btnInner}>
                <Text style={s.btnText}>Kirish</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </View>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>yoki</Text>
            <View style={s.dividerLine} />
          </View>

          {/* Register */}
          <TouchableOpacity
            style={s.registerBtn}
            onPress={() => navigation.navigate("Register")}
            activeOpacity={0.85}
          >
            <Text style={s.registerBtnText}>Ro'yxatdan o'tish</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.footer}>
          Kirib, <Text style={s.footerLink}>foydalanish shartlariga</Text>{" "}
          rozilik bildirasiz
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: "#f8f8fc" },
  inner: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 32 },

  logoSection: { alignItems: "center", paddingTop: 72, paddingBottom: 36 },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "#6C63FF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6C63FF",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
    marginBottom: 16,
  },
  logoTitle: { fontSize: 32, fontWeight: "800", color: "#1a1a1a" },
  logoAI: { color: "#6C63FF" },
  logoSub: { fontSize: 14, color: "#aaa", marginTop: 6 },

  form: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 20,
  },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderColor: "#ececec",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: "#fafafa",
    marginBottom: 14,
  },
  inputWrapFocused: { borderColor: "#6C63FF", backgroundColor: "#fff" },
  input: { flex: 1, fontSize: 15, color: "#1a1a1a" },

  btn: {
    backgroundColor: "#6C63FF",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
    shadowColor: "#6C63FF",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  btnLoading: { opacity: 0.8 },
  btnInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#f0f0f0" },
  dividerText: { fontSize: 13, color: "#ccc" },

  registerBtn: {
    borderWidth: 1.5,
    borderColor: "#6C63FF",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  registerBtnText: { color: "#6C63FF", fontSize: 16, fontWeight: "700" },

  footer: { textAlign: "center", fontSize: 12, color: "#ccc", marginTop: 24 },
  footerLink: { color: "#6C63FF" },
});
