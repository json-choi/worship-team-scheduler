import { useState } from "react";
import { View, Text, ScrollView, RefreshControl, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import type { Schedule, Team, TeamMember } from "@wts/shared";

interface TeamMembership {
  team: Team;
  membership: TeamMember;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; textColor: string }
> = {
  draft: { label: "초안", color: "bg-gray-100", textColor: "text-gray-600" },
  voting: { label: "투표중", color: "bg-blue-100", textColor: "text-blue-700" },
  closed: { label: "마감", color: "bg-orange-100", textColor: "text-orange-700" },
  confirmed: { label: "확정", color: "bg-green-100", textColor: "text-green-700" },
};

export default function ScheduleScreen() {
  const { user } = useAuth();
  const now = new Date();
  const [selectedMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
  );

  const { data: memberships } = useQuery({
    queryKey: ["teams"],
    queryFn: () => api<TeamMembership[]>("/teams"),
  });

  const activeTeam = memberships?.find(
    (m) => m.membership.status === "active",
  );

  const {
    data: scheduleList,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["schedules", activeTeam?.team.id, selectedMonth],
    queryFn: () =>
      api<Schedule[]>("/schedules", {
        params: {
          teamId: activeTeam!.team.id,
          month: selectedMonth,
        },
      }),
    enabled: !!activeTeam,
  });

  const isAdmin = activeTeam?.membership.role === "admin";

  const monthLabel = (() => {
    const [y, m] = selectedMonth.split("-");
    return `${y}년 ${parseInt(m)}월`;
  })();

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <ScrollView
        className="flex-1 px-4 pt-4"
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-gray-900">
            {monthLabel} 스케줄
          </Text>
          {isAdmin && activeTeam && (
            <Pressable
              className="flex-row items-center rounded-lg bg-primary px-3 py-2"
              onPress={() =>
                router.push({
                  pathname: "/admin/schedule/new",
                  params: { teamId: activeTeam.team.id },
                })
              }
            >
              <Ionicons name="add" size={16} color="white" />
              <Text className="ml-1 text-sm font-medium text-white">생성</Text>
            </Pressable>
          )}
        </View>

        {scheduleList && scheduleList.length > 0 ? (
          scheduleList.map((schedule) => {
            const dateStr = new Date(schedule.date).toLocaleDateString("ko-KR", {
              month: "short",
              day: "numeric",
              weekday: "short",
            });
            const statusCfg = STATUS_CONFIG[schedule.status] ?? STATUS_CONFIG.draft;

            return (
              <Pressable
                key={schedule.id}
                className="mb-3 rounded-2xl bg-white p-4 shadow-sm active:bg-gray-50"
                onPress={() => router.push(`/(tabs)/schedule/${schedule.id}`)}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900">
                      {schedule.title}
                    </Text>
                    <Text className="mt-1 text-sm text-gray-500">
                      {dateStr}
                      {schedule.timeStart ? ` ${schedule.timeStart}` : ""}
                    </Text>
                  </View>
                  <View className={`rounded-full px-3 py-1 ${statusCfg.color}`}>
                    <Text className={`text-xs font-medium ${statusCfg.textColor}`}>
                      {statusCfg.label}
                    </Text>
                  </View>
                </View>
                {isAdmin && schedule.status !== "confirmed" && (
                  <Pressable
                    className="mt-3 flex-row items-center justify-center rounded-lg bg-gray-50 py-2"
                    onPress={() =>
                      router.push({
                        pathname: `/admin/schedule/${schedule.id}/assign`,
                      })
                    }
                  >
                    <Ionicons name="people-outline" size={14} color="#6366F1" />
                    <Text className="ml-1 text-xs font-medium text-primary">
                      분배 관리
                    </Text>
                  </Pressable>
                )}
              </Pressable>
            );
          })
        ) : (
          <View className="items-center rounded-2xl bg-white p-8 shadow-sm">
            <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
            <Text className="mt-4 text-lg font-semibold text-gray-900">
              아직 스케줄이 없습니다
            </Text>
            <Text className="mt-1 text-center text-sm text-gray-500">
              {isAdmin
                ? "스케줄을 생성해보세요"
                : "관리자가 스케줄을 생성하면\n여기에 표시됩니다"}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
