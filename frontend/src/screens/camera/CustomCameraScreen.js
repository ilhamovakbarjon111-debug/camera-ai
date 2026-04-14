import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  ActivityIndicator,
} from "react-native";
import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from "expo-camera";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import api from "../../services/api";

const DIRECTIONS = {
  "←": { icon: "arrow-back-outline", text: "Chapga suring" },
  "→": { icon: "arrow-forward-outline", text: "O'ngga suring" },
  "↑": { icon: "arrow-up-outline", text: "Yuqoriga suring" },
  "↓": { icon: "arrow-down-outline", text: "Pastga suring" },
  "✓": { icon: "checkmark-circle", text: "Ajoyib holat!" },
};

export default function CustomCameraScreen() {
  const navigation = useNavigation();
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [mediaPermission, requestMediaPermission] =
    MediaLibrary.usePermissions();

  const [isFocused, setIsFocused] = useState(false);
  const [facing, setFacing] = useState("back");
  const [flash, setFlash] = useState("off");
  const [capturing, setCapturing] = useState(false);
  const [isVideo, setIsVideo] = useState(false);
  const [recording, setRecording] = useState(false);

  // AI
  const [aiOn, setAiOn] = useState(false);
  const [aiDir, setAiDir] = useState(null);
  const [aiTip, setAiTip] = useState("");
  const [aiScore, setAiScore] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);

  const recordingRef = useRef(false);
  const aiOnRef = useRef(false);
  const busyRef = useRef(false);
  const aiTimerRef = useRef(null);
  const captureTimerRef = useRef(null);
  const scoreAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    React.useCallback(() => {
      setIsFocused(true);
      return () => {
        setIsFocused(false);
        stopAI();
        if (recordingRef.current) {
          cameraRef.current?.stopRecording();
          recordingRef.current = false;
          setRecording(false);
        }
      };
    }, []),
  );

  const stopAI = () => {
    clearInterval(aiTimerRef.current);
    clearTimeout(captureTimerRef.current);
    busyRef.current = false;
    aiOnRef.current = false;
  };

  const startAI = () => {
    aiOnRef.current = true;
    busyRef.current = false;
    setAiDir(null);
    setAiScore(0);
    setAiTip("Tahlil boshlanmoqda...");
    scoreAnim.setValue(0);
    clearInterval(aiTimerRef.current);
    setTimeout(runAI, 600);
    aiTimerRef.current = setInterval(runAI, 3000);
  };

  const toggleAI = () => {
    if (aiOn) {
      stopAI();
      setAiOn(false);
      setAiDir(null);
      setAiScore(0);
      setAiTip("");
      setAiLoading(false);
    } else {
      setAiOn(true);
      startAI();
    }
  };

  const runAI = async () => {
    if (!cameraRef.current || busyRef.current || !aiOnRef.current) return;
    busyRef.current = true;
    setAiLoading(true);
    try {
      const snap = await cameraRef.current.takePictureAsync({
        quality: 0.04,
        base64: true,
        skipProcessing: true,
        imageType: "jpg",
        width: 256,
      });

      // Hajm tekshirish
      const sizeKB = (snap.base64.length * 3) / 4 / 1024;
      if (sizeKB > 3800) {
        busyRef.current = false;
        setAiLoading(false);
        return;
      }

      const res = await api.post("/ai/camera-tip", {
        imageBase64: snap.base64,
        mimeType: "image/jpeg",
        aiMode: true,
      });

      if (!aiOnRef.current) return;

      const dir = res.direction || "✓";
      const score = Math.round((res.score || 0) * 100);
      setAiDir(dir);
      setAiScore(score);
      setAiTip(res.tip || "");

      Animated.timing(scoreAnim, {
        toValue: score / 100,
        duration: 300,
        useNativeDriver: false,
      }).start();

      if ((score >= 75 || dir === "✓") && !capturing) {
        clearTimeout(captureTimerRef.current);
        captureTimerRef.current = setTimeout(() => {
          if (aiOnRef.current) takePictureAI();
        }, 1500);
      } else {
        clearTimeout(captureTimerRef.current);
      }
    } catch (err) {
      console.log("AI xato:", err.message);
    } finally {
      setAiLoading(false);
      busyRef.current = false;
    }
  };

  const savePhoto = async (uri) => {
    if (!mediaPermission?.granted) {
      const { granted } = await requestMediaPermission();
      if (!granted) {
        Alert.alert("Ruxsat kerak", "Galereya ruxsatini bering");
        return false;
      }
    }
    await MediaLibrary.saveToLibraryAsync(uri);
    return true;
  };

  const takePicture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      const saved = await savePhoto(photo.uri);
      if (saved)
        Alert.alert("Saqlandi!", "Rasm galereyangizdaga saqlandi.", [
          { text: "OK" },
          {
            text: "Yuklash",
            onPress: () =>
              navigation.navigate("Upload", { imageFromCamera: photo }),
          },
        ]);
    } catch (err) {
      Alert.alert("Xato", err.message);
    }
    setCapturing(false);
  };

  const takePictureAI = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      const saved = await savePhoto(photo.uri);
      if (saved)
        Alert.alert("AI rasm oldi!", "Eng yaxshi holat aniqlandi.", [
          { text: "OK" },
          {
            text: "Yuklash",
            onPress: () =>
              navigation.navigate("Upload", { imageFromCamera: photo }),
          },
        ]);
    } catch {}
    setCapturing(false);
  };

  const startRecording = async () => {
    if (!cameraRef.current || recording) return;
    if (!micPermission?.granted) {
      const { granted } = await requestMicPermission();
      if (!granted) {
        Alert.alert("Ruxsat kerak", "Mikrofon ruxsatini bering");
        return;
      }
    }
    setRecording(true);
    recordingRef.current = true;
    try {
      const video = await cameraRef.current.recordAsync({ maxDuration: 60 });
      await savePhoto(video.uri);
      Alert.alert("Video saqlandi!");
    } catch {}
    setRecording(false);
    recordingRef.current = false;
  };

  const stopRecording = () => {
    cameraRef.current?.stopRecording();
    setRecording(false);
    recordingRef.current = false;
  };

  const flashCycle = { off: "on", on: "auto", auto: "off" };
  const flashIcon = {
    off: "flash-off-outline",
    on: "flash-outline",
    auto: "flash-outline",
  };
  const scoreColor =
    aiScore >= 75 ? "#1D9E75" : aiScore >= 50 ? "#EF9F27" : "#E24B4A";
  const dirInfo = aiDir ? DIRECTIONS[aiDir] : null;
  const isReady = aiOn && aiScore >= 75;

  if (!permission?.granted) {
    return (
      <View style={s.permBox}>
        <Ionicons name="camera-outline" size={52} color="#6C63FF" />
        <Text style={s.permText}>Kamera ruxsati kerak</Text>
        <TouchableOpacity style={s.permBtn} onPress={requestPermission}>
          <Text style={s.permBtnText}>Ruxsat berish</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flash}
        mode={isVideo ? "video" : "picture"}
        active={isFocused}
      />

      {/* AI tayyor bo'lganda yashil border */}
      {isReady && <View style={s.readyBorder} pointerEvents="none" />}

      {/* TOP BAR */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={22} color="#fff" />
        </TouchableOpacity>

        {/* AI CHIP */}
        <TouchableOpacity
          style={[s.aiChip, aiOn && s.aiChipOn]}
          onPress={toggleAI}
        >
          {aiLoading ? (
            <ActivityIndicator size="small" color={aiOn ? "#FFD700" : "#fff"} />
          ) : (
            <MaterialIcons
              name="auto-awesome"
              size={15}
              color={aiOn ? "#FFD700" : "rgba(255,255,255,0.6)"}
            />
          )}
          <Text style={[s.aiChipText, aiOn && s.aiChipTextOn]}>
            {aiOn ? "AI YOQIQ" : "AI REJIM"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.iconBtn}
          onPress={() => setFlash(flashCycle[flash])}
        >
          <Ionicons
            name={flashIcon[flash]}
            size={22}
            color={flash === "on" ? "#FFD700" : "#fff"}
          />
        </TouchableOpacity>
      </View>

      {/* AI PANEL */}
      {aiOn && (
        <View style={s.aiPanel}>
          <View style={s.scoreRow}>
            <Text style={s.scoreLabel}>Tayyor holat</Text>
            <Text style={[s.scoreNum, { color: scoreColor }]}>{aiScore}%</Text>
          </View>
          <View style={s.scoreBarBg}>
            <Animated.View
              style={[
                s.scoreBarFill,
                {
                  backgroundColor: scoreColor,
                  width: scoreAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            />
          </View>
          {dirInfo && (
            <View style={s.dirRow}>
              <View style={[s.dirIcon, { backgroundColor: scoreColor + "25" }]}>
                <Ionicons name={dirInfo.icon} size={22} color={scoreColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.dirText, { color: scoreColor }]}>
                  {dirInfo.text}
                </Text>
                {aiTip ? (
                  <Text style={s.dirSub} numberOfLines={1}>
                    {aiTip}
                  </Text>
                ) : null}
              </View>
              {isReady && (
                <View style={s.autoBadge}>
                  <Text style={s.autoBadgeText}>Avtomatik</Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* BOTTOM BAR */}
      <View style={s.bottomBar}>
        <TouchableOpacity
          style={s.sideBtn}
          onPress={async () => {
            const res = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.9,
            });
            if (!res.canceled)
              navigation.navigate("Upload", { imageFromCamera: res.assets[0] });
          }}
        >
          <View style={s.sideBtnWrap}>
            <Ionicons name="images-outline" size={24} color="#fff" />
          </View>
          <Text style={s.sideBtnLabel}>Galereya</Text>
        </TouchableOpacity>

        {isVideo ? (
          <TouchableOpacity
            style={[s.shutter, recording && s.shutterRec]}
            onPress={recording ? stopRecording : startRecording}
          >
            <View style={[s.shutterInner, recording && s.shutterInnerRec]} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              s.shutter,
              isReady && s.shutterReady,
              capturing && s.shutterCapturing,
            ]}
            onPress={takePicture}
            disabled={capturing}
          >
            {capturing ? (
              <ActivityIndicator
                color={isReady ? "#1D9E75" : "#fff"}
                size="large"
              />
            ) : (
              <View style={[s.shutterInner, isReady && s.shutterInnerReady]} />
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={s.sideBtn}
          onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
        >
          <View style={s.sideBtnWrap}>
            <Ionicons name="camera-reverse-outline" size={24} color="#fff" />
          </View>
          <Text style={s.sideBtnLabel}>Flip</Text>
        </TouchableOpacity>
      </View>

      {/* MODE */}
      <View style={s.modeRow}>
        <TouchableOpacity onPress={() => setIsVideo(false)}>
          <Text style={[s.modeText, !isVideo && s.modeActive]}>RASM</Text>
        </TouchableOpacity>
        <Text style={s.modeSep}>|</Text>
        <TouchableOpacity onPress={() => setIsVideo(true)}>
          <Text style={[s.modeText, isVideo && s.modeActive]}>VIDEO</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  permBox: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  permText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  permBtn: {
    backgroundColor: "#6C63FF",
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  permBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  readyBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 3,
    borderColor: "rgba(29,158,117,0.7)",
  },
  topBar: {
    position: "absolute",
    top: 52,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  aiChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  aiChipOn: {
    borderColor: "rgba(255,215,0,0.5)",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  aiChipText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  aiChipTextOn: { color: "#FFD700" },
  aiPanel: {
    position: "absolute",
    top: 110,
    left: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.72)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  scoreLabel: { color: "rgba(255,255,255,0.55)", fontSize: 12 },
  scoreNum: { fontSize: 13, fontWeight: "800" },
  scoreBarBg: {
    height: 5,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 10,
  },
  scoreBarFill: { height: 5, borderRadius: 3 },
  dirRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dirIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  dirText: { fontSize: 15, fontWeight: "700" },
  dirSub: { color: "rgba(255,255,255,0.55)", fontSize: 11, marginTop: 2 },
  autoBadge: {
    backgroundColor: "rgba(29,158,117,0.25)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  autoBadgeText: { color: "#1D9E75", fontSize: 11, fontWeight: "600" },
  bottomBar: {
    position: "absolute",
    bottom: 48,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  sideBtn: { alignItems: "center", gap: 6 },
  sideBtnWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  sideBtnLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11 },
  shutter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  shutterReady: { borderColor: "#1D9E75" },
  shutterCapturing: { opacity: 0.5 },
  shutterRec: { borderColor: "#E24B4A" },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fff",
  },
  shutterInnerReady: { backgroundColor: "#1D9E75" },
  shutterInnerRec: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#E24B4A",
  },
  modeRow: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  modeText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
  },
  modeActive: { color: "#fff" },
  modeSep: { color: "rgba(255,255,255,0.2)", fontSize: 12 },
});
