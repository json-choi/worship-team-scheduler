import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import type { Schedule, ScheduleVote, User, ScheduleAssignment, TeamPosition } from "@wts/shared";

interface VoteWithUser {
  vote: ScheduleVote;
  user: Pick<User, "id" | "name" | "email" | "avatarUrl">;
}

interface AssignmentWithDetails {
  assignment: ScheduleAssignment;
  user: Pick<User, "id" | "name" | "email" | "avatarUrl">;
  position: Pick<TeamPosition, "id" | "name" | "icon" | "color">;
}

const AVAILABILITY_CONFIG = {
  available: { label: "가능", color: "bg-green-100", textColor: "text-green-700", icon: "checkmark-circle" as const },
  unavailable: { label: "불가", color: "bg-red-100", textColor: "text-red-700", icon: "close-circle" as const },
  maybe: { label: "미정", color: "bg-yellow-100", textColor: "text-yellow-700", icon: "help-circle" as const },
};

export default function ScheduleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const { data: schedule, isLoading: scheduleLoading } = useQuery({
    queryKey: ["schedule", id],
    queryFn: () => api<Schedule>(`/schedules/${id}`),
    enabled: !!id,
  });

  const { data: votes, isLoading: votesLoading } = useQuery({
    queryKey: ["votes", id],
    queryFn: () =>
      api<VoteWithUser[]>("/votes", { params: { scheduleId: id! } }),
    enabled: !!id,
  });

  const { data: assignments } = useQuery({
    queryKey: ["assignments", id],
    queryFn: () =>
      api<AssignmentWithDetails[]>("/assignments", {
        params: { scheduleId: id! },
      }),
    enabled: !!id,
  });

  if (scheduleLoading || votesLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (!schedule) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-gray-500">스케줄을 찾을 수 없습니다</Text>
      </View>
    );
  }

  const dateStr = new Date(schedule.date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  const totalMembers = votes?.length ?? 0;
  const availableCount =
    votes?.filter((v) => v.vote.availability === "available").length ?? 0;
  const unavailableCount =
    votes?.filter((v) => v.vote.availability === "unavailable").length ?? 0;
  const maybeCount =
    votes?.filter((v) => v.vote.availability === "maybe").length ?? 0;

  const statusConfig = {
    draft: { label: "초안", color: "bg-gray-100", textColor: "text-gray-600" },
    voting: { label: "투표중", color: "bg-blue-100", textColor: "text-blue-700" },
    closed: { label: "마감", color: "bg-orange-100", textColor: "text-orange-700" },
    confirmed: { label: "확정", color: "bg-green-100", textColor: "text-green-700" },
  };

  const status = statusConfig[schedule.status];

  return (
    <ScrollView className="flex-1 bg-gray-50 px-4 pt-4">
      <View className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-xl font-bold text-gray-900">
            {schedule.title}
          </Text>
          <View className={`rounded-full px-3 py-1 ${status.color}`}>
            <Text className={`text-xs font-medium ${status.textColor}`}>
              {status.label}
            </Text>
          </View>
        </View>
        <Text className="text-sm text-gray-500">{dateStr}</Text>
        {schedule.timeStart && (
          <Text className="mt-1 text-sm text-gray-400">
            {schedule.timeStart}
            {schedule.timeEnd ? ` ~ ${schedule.timeEnd}` : ""}
          </Text>
        )}
        {schedule.description && (
          <Text className="mt-2 text-sm text-gray-600">
            {schedule.description}
          </Text>
        )}
      </View>

      {schedule.status === "voting" && (
        <Pressable
          className="mb-4 flex-row items-center justify-center rounded-xl bg-primary py-3 active:bg-primary-600"
          onPress={() => router.push(`/(tabs)/schedule/${id}/vote`)}
        >
          <Ionicons name="hand-left-outline" size={18} color="white" />
          <Text className="ml-2 font-semibold text-white">투표하기</Text>
        </Pressable>
      )}

      <View className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
        <Text className="mb-3 text-base font-semibold text-gray-900">
          투표 현황 ({totalMembers}명)
        </Text>

        <View className="mb-4 flex-row gap-3">
          <View className="flex-1 items-center rounded-lg bg-green-50 py-3">
            <Text className="text-lg font-bold text-green-700">
              {availableCount}
            </Text>
            <Text className="text-xs text-green-600">가능</Text>
          </View>
          <View className="flex-1 items-center rounded-lg bg-red-50 py-3">
            <Text className="text-lg font-bold text-red-700">
              {unavailableCount}
            </Text>
            <Text className="text-xs text-red-600">불가</Text>
          </View>
          <View className="flex-1 items-center rounded-lg bg-yellow-50 py-3">
            <Text className="text-lg font-bold text-yellow-700">
              {maybeCount}
            </Text>
            <Text className="text-xs text-yellow-600">미정</Text>
          </View>
        </View>

        {votes?.map(({ vote, user: voteUser }) => {
          const config = AVAILABILITY_CONFIG[vote.availability];
          return (
            <View
              key={vote.id}
              className="mb-2 flex-row items-center rounded-lg px-3 py-2"
            >
              <View className="h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                <Text className="text-sm font-bold text-gray-600">
                  {voteUser.name?.[0] ?? "?"}
                </Text>
              </View>
              <Text className="ml-3 flex-1 text-sm font-medium text-gray-900">
                {voteUser.name ?? "이름 없음"}
              </Text>
              <View className={`flex-row items-center rounded-full px-3 py-1 ${config.color}`}>
                <Ionicons name={config.icon} size={14} color={config.textColor.replace("text-", "")} />
                <Text className={`ml-1 text-xs font-medium ${config.textColor}`}>
                  {config.label}
                </Text>
              </View>
            </View>
          );
        })}

        {(!votes || votes.length === 0) && (
          <Text className="text-center text-sm text-gray-400">
            아직 투표한 멤버가 없습니다
          </Text>
        )}
      </View>

      {assignments && assignments.length > 0 && (
        <View className="mb-8 rounded-2xl bg-white p-5 shadow-sm">
          <Text className="mb-3 text-base font-semibold text-gray-900">
            배정 결과
          </Text>
          {assignments.map(({ assignment, user: assignUser, position }) => (
            <View
              key={assignment.id}
              className="mb-2 flex-row items-center rounded-lg px-3 py-2"
            >
              <View
                className="h-7 w-7 items-center justify-center rounded-full"
                style={{ backgroundColor: position.color ?? "#6366F1" }}
              >
                <Text className="text-xs font-bold text-white">
                  {position.name[0]}
                </Text>
              </View>
              <Text className="ml-2 text-sm font-medium text-gray-500">
                {position.name}
              </Text>
              <View className="mx-2 h-px flex-1 bg-gray-100" />
              <Text className="text-sm font-medium text-gray-900">
                {assignUser.name ?? "이름 없음"}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
