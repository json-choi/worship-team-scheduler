import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import type { Schedule, ScheduleAssignment, User, TeamPosition } from "@wts/shared";

interface AssignmentWithDetails {
  assignment: ScheduleAssignment;
  user: Pick<User, "id" | "name" | "email" | "avatarUrl">;
  position: Pick<TeamPosition, "id" | "name" | "icon" | "color">;
}

interface AutoAssignResult {
  assignments: Array<{ positionId: string; userId: string }>;
  warnings: string[];
}

export default function AssignScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: schedule, isLoading: scheduleLoading } = useQuery({
    queryKey: ["schedule", id],
    queryFn: () => api<Schedule>(`/schedules/${id}`),
    enabled: !!id,
  });

  const {
    data: assignments,
    isLoading: assignmentsLoading,
    refetch: refetchAssignments,
  } = useQuery({
    queryKey: ["assignments", id],
    queryFn: () =>
      api<AssignmentWithDetails[]>("/assignments", {
        params: { scheduleId: id! },
      }),
    enabled: !!id,
  });

  const autoAssignMutation = useMutation({
    mutationFn: () =>
      api<AutoAssignResult>("/assignments/auto", {
        method: "POST",
        body: { scheduleId: id },
      }),
    onSuccess: (data) => {
      refetchAssignments();
      queryClient.invalidateQueries({ queryKey: ["schedule", id] });

      if (data.warnings.length > 0) {
        Alert.alert(
          "자동 분배 완료 (경고)",
          data.warnings.join("\n"),
        );
      } else {
        Alert.alert("완료", "자동 분배가 완료되었습니다");
      }
    },
    onError: (err) =>
      Alert.alert("오류", err instanceof Error ? err.message : "분배 실패"),
  });

  const confirmMutation = useMutation({
    mutationFn: () =>
      api("/assignments/confirm", {
        method: "POST",
        body: { scheduleId: id },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", id] });
      queryClient.invalidateQueries({ queryKey: ["assignments", id] });
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      Alert.alert("완료", "스케줄이 확정되었습니다. 멤버들에게 알림이 발송됩니다.", [
        { text: "확인", onPress: () => router.back() },
      ]);
    },
    onError: (err) =>
      Alert.alert("오류", err instanceof Error ? err.message : "승인 실패"),
  });

  function handleConfirm() {
    Alert.alert(
      "최종 승인",
      "이 스케줄을 확정하시겠습니까?\n배정된 멤버들에게 알림이 발송됩니다.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "승인",
          onPress: () => confirmMutation.mutate(),
        },
      ],
    );
  }

  if (scheduleLoading || assignmentsLoading) {
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
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  const groupedByPosition = new Map<
    string,
    { position: Pick<TeamPosition, "id" | "name" | "icon" | "color">; members: Array<Pick<User, "id" | "name" | "email" | "avatarUrl">> }
  >();

  assignments?.forEach(({ assignment, user, position }) => {
    const existing = groupedByPosition.get(position.id);
    if (existing) {
      existing.members.push(user);
    } else {
      groupedByPosition.set(position.id, { position, members: [user] });
    }
  });

  const isConfirmed = schedule.status === "confirmed";

  return (
    <ScrollView className="flex-1 bg-gray-50 px-4 pt-4">
      <View className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
        <Text className="text-xl font-bold text-gray-900">
          {schedule.title}
        </Text>
        <Text className="mt-1 text-sm text-gray-500">{dateStr}</Text>
      </View>

      {!isConfirmed && (
        <View className="mb-4 flex-row gap-3">
          <Pressable
            className="flex-1 flex-row items-center justify-center rounded-xl bg-primary py-3 active:bg-primary-600"
            onPress={() => autoAssignMutation.mutate()}
            disabled={autoAssignMutation.isPending}
          >
            {autoAssignMutation.isPending ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Ionicons name="flash-outline" size={18} color="white" />
                <Text className="ml-2 font-semibold text-white">
                  자동 분배
                </Text>
              </>
            )}
          </Pressable>
        </View>
      )}

      {assignments && assignments.length > 0 ? (
        <View className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
          <Text className="mb-3 text-base font-semibold text-gray-900">
            배정 결과
          </Text>
          {Array.from(groupedByPosition.values()).map(
            ({ position, members }) => (
              <View key={position.id} className="mb-4">
                <View className="mb-2 flex-row items-center">
                  <View
                    className="mr-2 h-6 w-6 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: position.color ?? "#6366F1",
                    }}
                  >
                    <Text className="text-xs font-bold text-white">
                      {position.name[0]}
                    </Text>
                  </View>
                  <Text className="text-sm font-semibold text-gray-700">
                    {position.name}
                  </Text>
                  <Text className="ml-1 text-xs text-gray-400">
                    ({members.length}명)
                  </Text>
                </View>
                {members.map((member) => (
                  <View
                    key={member.id}
                    className="ml-8 mb-1 flex-row items-center rounded-lg bg-gray-50 px-3 py-2"
                  >
                    <View className="h-7 w-7 items-center justify-center rounded-full bg-gray-200">
                      <Text className="text-xs font-bold text-gray-600">
                        {member.name?.[0] ?? "?"}
                      </Text>
                    </View>
                    <Text className="ml-2 text-sm text-gray-900">
                      {member.name ?? "이름 없음"}
                    </Text>
                  </View>
                ))}
              </View>
            ),
          )}
        </View>
      ) : (
        <View className="mb-4 items-center rounded-2xl bg-white p-8 shadow-sm">
          <Ionicons name="people-outline" size={48} color="#D1D5DB" />
          <Text className="mt-4 text-base text-gray-400">
            아직 배정 결과가 없습니다
          </Text>
          <Text className="mt-1 text-sm text-gray-300">
            자동 분배 버튼을 눌러주세요
          </Text>
        </View>
      )}

      {!isConfirmed && assignments && assignments.length > 0 && (
        <Pressable
          className="mb-8 items-center rounded-xl bg-green-600 py-4 active:bg-green-700"
          onPress={handleConfirm}
          disabled={confirmMutation.isPending}
        >
          {confirmMutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text className="ml-2 text-base font-semibold text-white">
                최종 승인
              </Text>
            </View>
          )}
        </Pressable>
      )}

      {isConfirmed && (
        <View className="mb-8 items-center rounded-lg bg-green-50 px-4 py-3">
          <View className="flex-row items-center">
            <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
            <Text className="ml-2 font-medium text-green-700">
              이 스케줄은 확정되었습니다
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
