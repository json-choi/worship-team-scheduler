import { View, Text, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";

export default function ScheduleScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <ScrollView className="flex-1 px-4 pt-4">
        <Text className="mb-6 text-2xl font-bold text-gray-900">스케줄</Text>

        <View className="items-center rounded-2xl bg-white p-8 shadow-sm">
          <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
          <Text className="mt-4 text-lg font-semibold text-gray-900">
            아직 스케줄이 없습니다
          </Text>
          <Text className="mt-1 text-center text-sm text-gray-500">
            관리자가 스케줄을 생성하면{"\n"}여기에 표시됩니다
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
