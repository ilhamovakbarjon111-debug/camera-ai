import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import FeedScreen from '../screens/feed/FeedScreen';
import UploadScreen from '../screens/upload/UploadScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import AIAnalysisScreen from '../screens/ai/AIAnalysisScreen';
import CommentsScreen from '../screens/feed/CommentsScreen';
import CameraScreen from '../screens/camera/CameraScreen';
import CustomCameraScreen from '../screens/camera/CustomCameraScreen';

let FollowersScreen, NotificationsScreen;
try { FollowersScreen = require('../screens/profile/FollowersScreen').default; } catch {}
try { NotificationsScreen = require('../screens/notifications/NotificationsScreen').default; } catch {}

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const CameraTabButton = ({ onPress }) => (
  <TouchableOpacity style={ts.cameraTab} onPress={onPress} activeOpacity={0.85}>
    <View style={ts.cameraBtn}>
      <Ionicons name="camera" size={26} color="#fff" />
    </View>
  </TouchableOpacity>
);

const ts = StyleSheet.create({
  cameraTab: { flex: 1, alignItems: 'center', justifyContent: 'center', top: -18 },
  cameraBtn: {
    width: 62, height: 62, borderRadius: 31,
    backgroundColor: '#6C63FF', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#6C63FF', shadowOpacity: 0.45, shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 }, elevation: 10,
    borderWidth: 3, borderColor: '#fff',
  },
});

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: '#6C63FF',
      tabBarInactiveTintColor: '#bbb',
      headerShown: false,
      tabBarStyle: {
        height: 72, paddingBottom: 10, paddingTop: 8,
        backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0',
        elevation: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12,
      },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
    }}
  >
    <Tab.Screen
      name="Feed"
      component={FeedScreen}
      options={{ title: 'Lenta', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} /> }}
    />
    <Tab.Screen
      name="Mashqlar"
      component={CameraScreen}
      options={{ title: 'Mashqlar', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'school' : 'school-outline'} size={24} color={color} /> }}
    />
    <Tab.Screen
      name="CameraMain"
      component={CustomCameraScreen}
      options={{ title: '', tabBarButton: (props) => <CameraTabButton {...props} /> }}
    />
    <Tab.Screen
      name="Upload"
      component={UploadScreen}
      options={{ title: 'Yuklash', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'cloud-upload' : 'cloud-upload-outline'} size={24} color={color} /> }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ title: 'Profil', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} /> }}
    />
  </Tab.Navigator>
);

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: '#6C63FF', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
          <Ionicons name="camera" size={32} color="#fff" />
        </View>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="AIAnalysis"
            component={AIAnalysisScreen}
            options={{ headerShown: true, title: 'AI Tahlil', headerStyle: { backgroundColor: '#fff' }, headerTintColor: '#1a1a1a', headerTitleStyle: { fontWeight: '700', fontSize: 17 }, headerShadowVisible: false, headerBackTitleVisible: false }}
          />
          <Stack.Screen
            name="Comments"
            component={CommentsScreen}
            options={{ headerShown: true, title: 'Izohlar', headerStyle: { backgroundColor: '#fff' }, headerTintColor: '#1a1a1a', headerTitleStyle: { fontWeight: '700', fontSize: 17 }, headerShadowVisible: false, headerBackTitleVisible: false }}
          />
          <Stack.Screen name="UserProfile" component={ProfileScreen} options={{ headerShown: false }} />
          {FollowersScreen && (
            <Stack.Screen
              name="Followers"
              component={FollowersScreen}
              options={({ route }) => ({ headerShown: true, title: route.params?.type === 'followers' ? 'Obunachilar' : 'Obunalar', headerStyle: { backgroundColor: '#fff' }, headerTintColor: '#1a1a1a', headerTitleStyle: { fontWeight: '700', fontSize: 17 }, headerShadowVisible: false, headerBackTitleVisible: false })}
            />
          )}
          {NotificationsScreen && (
            <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
          )}
        </>
      )}
    </Stack.Navigator>
  );
}
