import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Worship Team Scheduler",
  slug: "worship-team-scheduler",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "wts",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    bundleIdentifier: "com.wts.app",
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#6366F1",
      foregroundImage: "./assets/images/adaptive-icon.png",
    },
    edgeToEdgeEnabled: true,
    package: "com.wts.app",
  },
  web: {
    bundler: "metro",
    favicon: "./assets/images/favicon.png",
    output: "single",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#6366F1",
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    googleClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  },
});
