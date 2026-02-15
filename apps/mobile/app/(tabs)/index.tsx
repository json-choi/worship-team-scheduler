import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/providers/AuthProvider";
import { api } from "@/lib/api";
import type { Team, TeamMember, Schedule } from "@wts/shared";

interface TeamMembership {
  team: Team;
  membership: TeamMember;
}

export default function HomeScreen() {
  const { user } = useAuth();

  const {
    data: memberships,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["teams"],
    queryFn: () => api<TeamMembership[]>("/teams"),
  });

  const activeTeam = memberships?.find(
    (m) => m.membership.status === "active",
  );
  const pendingTeam = memberships?.find(
    (m) => m.membership.status === "pending",
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <ScrollView
        className="flex-1 px-4 pt-4"
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        <Text className="mb-1 text-2xl font-bold text-gray-900">
          안녕하세요, {user?.name ?? "멤버"}님
        </Text>
        <Text className="mb-6 text-base text-gray-500">
          오늘도 함께 예배해요
        </Text>

        {activeTeam && (
          <View className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-gray-900">
                {activeTeam.team.name}
              </Text>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/team/settings",
                    params: { teamId: activeTeam.team.id },
                  })
                }
              >
                <Ionicons name="settings-outline" size={20} color="#6B7280" />
              </Pressable>
            </View>
            <Text className="text-sm text-gray-500">
              역할: {activeTeam.membership.role === "admin" ? "관리자" : "멤버"}
            </Text>
            {activeTeam.membership.role === "admin" && (
              <Pressable
                className="mt-3 flex-row items-center justify-center rounded-lg bg-primary-50 py-2"
                onPress={() =>
                  router.push({
                    pathname: "/admin/members",
                    params: { teamId: activeTeam.team.id },
                  })
                }
              >
                <Ionicons name="people-outline" size={16} color="#6366F1" />
                <Text className="ml-2 text-sm font-medium text-primary">
                  멤버 관리
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {pendingTeam && (
          <View className="mb-4 rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
            <Text className="text-base font-semibold text-yellow-800">
              가입 승인 대기중
            </Text>
            <Text className="mt-1 text-sm text-yellow-600">
              {pendingTeam.team.name} 팀에 가입 신청 중입니다
            </Text>
          </View>
        )}

        {!memberships?.length && !isLoading && (
          <View className="items-center rounded-2xl bg-white p-8 shadow-sm">
            <Ionicons name="people-outline" size={48} color="#D1D5DB" />
            <Text className="mt-4 text-lg font-semibold text-gray-900">
              팀에 참가하세요
            </Text>
            <Text className="mt-1 text-center text-sm text-gray-500">
              초대 코드로 팀에 참가하거나{"\n"}새로운 팀을 만들어보세요
            </Text>
            <Pressable
              className="mt-4 rounded-xl bg-primary px-6 py-3"
              onPress={() => router.push("/(auth)/onboarding")}
            >
              <Text className="font-semibold text-white">시작하기</Text>
            </Pressable>
          </View>
        )}

        <View className="mb-4 mt-2 rounded-2xl bg-white p-5 shadow-sm">
          <Text className="mb-3 text-lg font-bold text-gray-900">
            다가오는 일정
          </Text>
          <View className="items-center py-4">
            <Ionicons name="calendar-outline" size={32} color="#D1D5DB" />
            <Text className="mt-2 text-sm text-gray-400">
              예정된 일정이 없습니다
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
