import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function NotificationsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <ScrollView className="flex-1 px-4 pt-4">
        <View className="items-center rounded-2xl bg-white p-8 shadow-sm">
          <Ionicons name="notifications-outline" size={48} color="#D1D5DB" />
          <Text className="mt-4 text-lg font-semibold text-gray-900">
            알림이 없습니다
          </Text>
          <Text className="mt-1 text-center text-sm text-gray-500">
            새로운 알림이 오면 여기에 표시됩니다
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
