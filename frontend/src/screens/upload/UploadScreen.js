import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, Feather } from "@expo/vector-icons";
import { uploadPhoto } from "../../services/api";

export default function UploadScreen({ navigation, route }) {
  const imageFromCamera = route?.params?.imageFromCamera;
  const [image, setImage] = useState(imageFromCamera || null);
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted")
        return Alert.alert("Ruxsat kerak", "Galereya ruxsatini bering");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled) setImage(result.assets[0]);
    } catch (err) {
      console.log(err.message);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted")
        return Alert.alert("Ruxsat kerak", "Kamera ruxsatini bering");
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled) setImage(result.assets[0]);
    } catch (err) {
      console.log(err.message);
    }
  };

  const handleUpload = async () => {
    if (!image)
      return Alert.alert("Rasm tanlang", "Yuklash uchun rasm tanlang");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("photo", {
        uri: image.uri,
        type: image.mimeType || "image/jpeg",
        name: `photo_${Date.now()}.jpg`,
      });
      if (caption) formData.append("caption", caption);
      if (tags) formData.append("tags", tags);
      await uploadPhoto(formData);
      Alert.alert("Yuklandi! 🎉", "Rasm muvaffaqiyatli yuklandi", [
        {
          text: "OK",
          onPress: () => {
            setImage(null);
            setCaption("");
            setTags("");
            navigation.navigate("Feed");
          },
        },
      ]);
    } catch (err) {
      Alert.alert("Xato", err.message || "Yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={s.header}>
          <View style={s.headerIconBox}>
            <Ionicons name="cloud-upload-outline" size={20} color="#6C63FF" />
          </View>
          <Text style={s.headerTitle}>Yangi post</Text>
        </View>

        {/* IMAGE SECTION */}
        {!image ? (
          <View style={s.pickSection}>
            <View style={s.placeholder}>
              <View style={s.placeholderIconWrap}>
                <Ionicons name="image-outline" size={48} color="#c4bfff" />
              </View>
              <Text style={s.placeholderTitle}>Rasm tanlang</Text>
              <Text style={s.placeholderSub}>
                Galereya yoki kameradan yuklang
              </Text>
              <View style={s.pickBtnsRow}>
                <TouchableOpacity
                  style={s.pickBtn}
                  onPress={pickImage}
                  activeOpacity={0.85}
                >
                  <Ionicons name="images-outline" size={18} color="#fff" />
                  <Text style={s.pickBtnText}>Galereya</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.pickBtn, s.pickBtnOutline]}
                  onPress={takePhoto}
                  activeOpacity={0.85}
                >
                  <Ionicons name="camera-outline" size={18} color="#6C63FF" />
                  <Text style={[s.pickBtnText, { color: "#6C63FF" }]}>
                    Kamera
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View style={s.previewSection}>
            <View style={s.previewWrap}>
              <Image source={{ uri: image.uri }} style={s.preview} />
              <View style={s.previewActions}>
                <TouchableOpacity style={s.previewBtn} onPress={pickImage}>
                  <Feather name="refresh-cw" size={15} color="#fff" />
                  <Text style={s.previewBtnText}>Almashtirish</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.previewBtnDanger}
                  onPress={() => setImage(null)}
                >
                  <Ionicons name="trash-outline" size={15} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* FORM */}
        <View style={s.form}>
          {/* Caption */}
          <View style={s.inputWrap}>
            <View style={s.inputLabelRow}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={15}
                color="#6C63FF"
              />
              <Text style={s.inputLabel}>Tavsif</Text>
            </View>
            <TextInput
              style={[s.input, s.inputMulti]}
              placeholder="Rasm haqida yozing..."
              value={caption}
              onChangeText={setCaption}
              multiline
              numberOfLines={3}
              placeholderTextColor="#ccc"
              textAlignVertical="top"
            />
          </View>

          {/* Tags */}
          <View style={s.inputWrap}>
            <View style={s.inputLabelRow}>
              <Ionicons name="pricetag-outline" size={15} color="#6C63FF" />
              <Text style={s.inputLabel}>Teglar</Text>
            </View>
            <TextInput
              style={s.input}
              placeholder="portret, landshaft, sunsent..."
              value={tags}
              onChangeText={setTags}
              placeholderTextColor="#ccc"
            />
            {tags.trim().length > 0 && (
              <View style={s.tagsRow}>
                {tags
                  .split(",")
                  .filter((t) => t.trim())
                  .map((t, i) => (
                    <View key={i} style={s.tagChip}>
                      <Text style={s.tagChipText}>#{t.trim()}</Text>
                    </View>
                  ))}
              </View>
            )}
          </View>

          {/* Upload Button */}
          <TouchableOpacity
            style={[s.uploadBtn, (!image || loading) && s.uploadBtnDisabled]}
            onPress={handleUpload}
            disabled={loading || !image}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View style={s.uploadBtnInner}>
                <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                <Text style={s.uploadBtnText}>Yuklash</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8fc" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    paddingTop: 52,
    paddingBottom: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#f0eeff",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#1a1a1a" },

  pickSection: { padding: 16 },
  placeholder: {
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
    borderRadius: 20,
    paddingVertical: 44,
    alignItems: "center",
    backgroundColor: "#fff",
    gap: 6,
  },
  placeholderIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#f0eeff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  placeholderTitle: { fontSize: 17, fontWeight: "700", color: "#1a1a1a" },
  placeholderSub: { fontSize: 13, color: "#bbb", marginBottom: 6 },
  pickBtnsRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  pickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#6C63FF",
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  pickBtnOutline: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#6C63FF",
  },
  pickBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  previewSection: { paddingHorizontal: 16, paddingTop: 16 },
  previewWrap: { borderRadius: 20, overflow: "hidden", position: "relative" },
  preview: { width: "100%", height: 320 },
  previewActions: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  previewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  previewBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  previewBtnDanger: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(226,75,74,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },

  form: { padding: 16, gap: 4 },
  inputWrap: { marginBottom: 16 },
  inputLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  inputLabel: { fontSize: 13, fontWeight: "700", color: "#444" },
  input: {
    borderWidth: 1.5,
    borderColor: "#ececec",
    borderRadius: 14,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1a1a1a",
  },
  inputMulti: { height: 90, textAlignVertical: "top" },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  tagChip: {
    backgroundColor: "#f0eeff",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tagChipText: { color: "#6C63FF", fontSize: 12, fontWeight: "700" },

  uploadBtn: {
    backgroundColor: "#6C63FF",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  uploadBtnDisabled: { backgroundColor: "#c4bfff" },
  uploadBtnInner: { flexDirection: "row", alignItems: "center", gap: 10 },
  uploadBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
