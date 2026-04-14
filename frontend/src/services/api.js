import * as SecureStore from "expo-secure-store";

const API_URL = process.env.API_URL || "http://192.168.76.24:5000/api";

const getToken = async () => {
  try {
    return await SecureStore.getItemAsync("token");
  } catch {
    return null;
  }
};

const request = async (method, path, body = null) => {
  const token = await getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  const res = await fetch(`${API_URL}${path}`, config);
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

const requestForm = async (method, path, formData) => {
  const token = await getToken();
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

const api = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  put: (path, body) => request("PUT", path, body),
  delete: (path) => request("DELETE", path),
};

// Auth
export const register = (data) => request("POST", "/auth/register", data);
export const login = (data) => request("POST", "/auth/login", data);
export const googleAuth = (data) => request("POST", "/auth/google", data);
export const getMe = () => request("GET", "/auth/me");
export const savePushToken = (push_token) =>
  request("PUT", "/auth/push-token", { push_token });

// Feed
export const getFeed = (page = 1) => request("GET", `/feed?page=${page}`);
export const getFollowingFeed = (page = 1) =>
  request("GET", `/feed/following?page=${page}`);
export const searchFeed = (q) =>
  request("GET", `/feed/search?q=${encodeURIComponent(q)}`);

// Photos
export const uploadPhoto = (formData) =>
  requestForm("POST", "/photos/upload", formData);
export const deletePhoto = (id) => request("DELETE", `/photos/${id}`);
export const likePhoto = (id) => request("POST", `/photos/${id}/like`);
export const addComment = (id, text) =>
  request("POST", `/photos/${id}/comment`, { text });
export const getComments = (id) => request("GET", `/photos/${id}/comments`);

// Profile
export const getProfile = (id) => request("GET", `/profile/${id}`);
export const followUser = (id) => request("POST", `/profile/${id}/follow`);
export const deleteMyPhoto = (id) => request("DELETE", `/profile/photo/${id}`);
export const updatePhotoCaption = (id, caption) =>
  request("PUT", `/profile/photo/${id}`, { caption });

// AI
export const analyzePhoto = (photoId) =>
  request("POST", `/ai/analyze/${photoId}`);
export const getAnalysis = (photoId) =>
  request("GET", `/ai/analysis/${photoId}`);
export const verifyChallenge = (data) =>
  request("POST", "/ai/verify-challenge", data);
export const getCameraTip = (data) => request("POST", "/ai/camera-tip", data);

// Challenges & XP
export const addXP = (amount) => request("POST", "/profile/xp", { amount });
export const getChallenges = () => request("GET", "/profile/challenges");
export const completeChallenge = (challenge_id) =>
  request("POST", "/profile/challenges", { challenge_id });

// Notifications
export const getNotifications = () => request("GET", "/notifications");
export const markAllRead = () => request("PUT", "/notifications/read-all");
export const markOneRead = (id) => request("PUT", `/notifications/${id}/read`);
export const getUnreadCount = () =>
  request("GET", "/notifications/unread-count");

export default api;
