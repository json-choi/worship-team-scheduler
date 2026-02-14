import { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import type { Schedule, ScheduleVote, User } from "@wts/shared";

type Availability = "available" | "unavailable" | "maybe";

interface VoteWithUser {
  vote: ScheduleVote;
  user: Pick<User, "id" | "name" | "email" | "avatarUrl">;
}

const OPTIONS: Array<{
  value: Availability;
  label: string;
  icon: "checkmark-circle" | "close-circle" | "help-circle";
  activeColor: string;
  activeBg: string;
}> = [
  {
    value: "available",
    label: "가능",
    icon: "checkmark-circle",
    activeColor: "text-green-700",
    activeBg: "bg-green-100 border-green-300",
  },
  {
    value: "unavailable",
    label: "불가",
    icon: "close-circle",
    activeColor: "text-red-700",
    activeBg: "bg-red-100 border-red-300",
  },
  {
    value: "maybe",
    label: "미정",
    icon: "help-circle",
    activeColor: "text-yellow-700",
    activeBg: "bg-yellow-100 border-yellow-300",
  },
];

export default function VoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selected, setSelected] = useState<Availability | null>(null);

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

  useEffect(() => {
    if (votes) {
      const myVote = votes.find((v) => v.vote.userId === user?.id);
      if (myVote) {
        setSelected(myVote.vote.availability);
      }
    }
  }, [votes, user?.id]);

  const voteMutation = useMutation({
    mutationFn: (availability: Availability) =>
      api("/votes", {
        method: "POST",
        body: { scheduleId: id, availability },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["votes", id] });
      Alert.alert("완료", "투표가 등록되었습니다", [
        { text: "확인", onPress: () => router.back() },
      ]);
    },
    onError: (err) =>
      Alert.alert("오류", err instanceof Error ? err.message : "투표 실패"),
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

  const myExistingVote = votes?.find((v) => v.vote.userId === user?.id);

  return (
    <ScrollView className="flex-1 bg-gray-50 px-4 pt-4">
      <View className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
        <Text className="text-xl font-bold text-gray-900">
          {schedule.title}
        </Text>
        <Text className="mt-1 text-sm text-gray-500">{dateStr}</Text>
        {schedule.timeStart && (
          <Text className="mt-1 text-sm text-gray-400">
            {schedule.timeStart}
            {schedule.timeEnd ? ` ~ ${schedule.timeEnd}` : ""}
          </Text>
        )}
      </View>

      <View className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
        <Text className="mb-4 text-base font-semibold text-gray-900">
          참석 가능 여부를 선택하세요
        </Text>

        <View className="gap-3">
          {OPTIONS.map((option) => {
            const isActive = selected === option.value;
            return (
              <Pressable
                key={option.value}
                className={`flex-row items-center rounded-xl border px-5 py-4 ${
                  isActive
                    ? option.activeBg
                    : "border-gray-200 bg-white"
                }`}
                onPress={() => setSelected(option.value)}
              >
                <Ionicons
                  name={option.icon}
                  size={24}
                  color={
                    isActive ? option.activeColor.replace("text-", "") : "#9CA3AF"
                  }
                />
                <Text
                  className={`ml-3 text-base font-medium ${
                    isActive ? option.activeColor : "text-gray-700"
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {myExistingVote && (
        <View className="mb-4 rounded-lg bg-blue-50 px-4 py-3">
          <Text className="text-sm text-blue-700">
            이전 투표:{" "}
            {
              OPTIONS.find((o) => o.value === myExistingVote.vote.availability)
                ?.label
            }{" "}
            — 다시 선택하면 변경됩니다
          </Text>
        </View>
      )}

      <Pressable
        className={`mb-8 items-center rounded-xl py-4 ${
          selected ? "bg-primary active:bg-primary-600" : "bg-gray-300"
        }`}
        onPress={() => selected && voteMutation.mutate(selected)}
        disabled={!selected || voteMutation.isPending}
      >
        {voteMutation.isPending ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-base font-semibold text-white">
            {myExistingVote ? "투표 변경" : "투표 제출"}
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}
