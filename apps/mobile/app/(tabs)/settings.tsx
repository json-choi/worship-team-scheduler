import { View, Text, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/providers/AuthProvider";
import { signOut } from "@/lib/auth";

export default function SettingsScreen() {
  const { user } = useAuth();

  async function handleSignOut() {
    Alert.alert("로그아웃", "정말 로그아웃하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
          } catch {
            Alert.alert("오류", "로그아웃에 실패했습니다");
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <View className="flex-1 px-4 pt-4">
        <View className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
          <View className="flex-row items-center">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-primary-100">
              <Text className="text-xl font-bold text-primary">
                {user?.name?.[0] ?? "?"}
              </Text>
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-lg font-semibold text-gray-900">
                {user?.name ?? "이름 없음"}
              </Text>
              <Text className="text-sm text-gray-500">{user?.email}</Text>
            </View>
          </View>
        </View>

        <View className="rounded-2xl bg-white shadow-sm">
          <Pressable className="flex-row items-center border-b border-gray-100 px-5 py-4 active:bg-gray-50">
            <Ionicons name="person-outline" size={20} color="#6B7280" />
            <Text className="ml-3 flex-1 text-base text-gray-900">
              프로필 수정
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
          </Pressable>
          <Pressable className="flex-row items-center border-b border-gray-100 px-5 py-4 active:bg-gray-50">
            <Ionicons
              name="notifications-outline"
              size={20}
              color="#6B7280"
            />
            <Text className="ml-3 flex-1 text-base text-gray-900">
              알림 설정
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
          </Pressable>
          <Pressable className="flex-row items-center px-5 py-4 active:bg-gray-50">
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="#6B7280"
            />
            <Text className="ml-3 flex-1 text-base text-gray-900">
              앱 정보
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
          </Pressable>
        </View>

        <Pressable
          className="mt-4 items-center rounded-2xl bg-white py-4 shadow-sm active:bg-gray-50"
          onPress={handleSignOut}
        >
          <Text className="text-base font-medium text-red-500">로그아웃</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
