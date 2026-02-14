import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import type { TeamMember, User } from "@wts/shared";

interface MemberWithUser {
  member: TeamMember;
  user: Pick<User, "id" | "email" | "name" | "avatarUrl">;
}

export default function AdminMembersScreen() {
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const queryClient = useQueryClient();

  const { data: pendingMembers, isLoading: pendingLoading } = useQuery({
    queryKey: ["members", teamId, "pending"],
    queryFn: () => api<MemberWithUser[]>(`/members/team/${teamId}/pending`),
    enabled: !!teamId,
  });

  const { data: allMembers, isLoading: allLoading } = useQuery({
    queryKey: ["members", teamId],
    queryFn: () => api<MemberWithUser[]>(`/members/team/${teamId}`),
    enabled: !!teamId,
  });

  const approveMutation = useMutation({
    mutationFn: (data: { memberId: string; approved: boolean }) =>
      api("/members/approve", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", teamId] });
    },
    onError: (err) =>
      Alert.alert("오류", err instanceof Error ? err.message : "처리 실패"),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) =>
      api(`/members/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", teamId] });
    },
  });

  function handleRemove(id: string, name: string | null) {
    Alert.alert("멤버 제거", `${name ?? "이 멤버"}를 제거하시겠습니까?`, [
      { text: "취소", style: "cancel" },
      {
        text: "제거",
        style: "destructive",
        onPress: () => removeMutation.mutate(id),
      },
    ]);
  }

  const isLoading = pendingLoading || allLoading;
  const activeMembers = allMembers?.filter(
    (m) => m.member.status === "active",
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50 px-4 pt-4">
      {pendingMembers && pendingMembers.length > 0 && (
        <>
          <Text className="mb-3 text-lg font-bold text-gray-900">
            가입 신청 ({pendingMembers.length})
          </Text>
          {pendingMembers.map(({ member, user }) => (
            <View
              key={member.id}
              className="mb-2 rounded-xl bg-white p-4 shadow-sm"
            >
              <View className="flex-row items-center">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                  <Text className="font-bold text-yellow-600">
                    {user.name?.[0] ?? "?"}
                  </Text>
                </View>
                <View className="ml-3 flex-1">
                  <Text className="font-medium text-gray-900">
                    {user.name ?? "이름 없음"}
                  </Text>
                  <Text className="text-sm text-gray-500">{user.email}</Text>
                </View>
              </View>
              <View className="mt-3 flex-row gap-3">
                <Pressable
                  className="flex-1 items-center rounded-lg border border-gray-200 py-2 active:bg-gray-50"
                  onPress={() =>
                    approveMutation.mutate({
                      memberId: member.id,
                      approved: false,
                    })
                  }
                >
                  <Text className="font-medium text-gray-600">거절</Text>
                </Pressable>
                <Pressable
                  className="flex-1 items-center rounded-lg bg-primary py-2 active:bg-primary-600"
                  onPress={() =>
                    approveMutation.mutate({
                      memberId: member.id,
                      approved: true,
                    })
                  }
                >
                  <Text className="font-medium text-white">승인</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </>
      )}

      <Text className="mb-3 mt-4 text-lg font-bold text-gray-900">
        활동 멤버 ({activeMembers?.length ?? 0})
      </Text>
      {activeMembers?.map(({ member, user }) => (
        <View
          key={member.id}
          className="mb-2 flex-row items-center rounded-xl bg-white px-4 py-3 shadow-sm"
        >
          <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-100">
            <Text className="font-bold text-primary">
              {user.name?.[0] ?? "?"}
            </Text>
          </View>
          <View className="ml-3 flex-1">
            <View className="flex-row items-center">
              <Text className="font-medium text-gray-900">
                {user.name ?? "이름 없음"}
              </Text>
              {member.role === "admin" && (
                <View className="ml-2 rounded-full bg-primary-50 px-2 py-0.5">
                  <Text className="text-xs font-medium text-primary">
                    관리자
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-sm text-gray-500">{user.email}</Text>
          </View>
          {member.role !== "admin" && (
            <Pressable
              className="p-2"
              onPress={() => handleRemove(member.id, user.name)}
            >
              <Ionicons
                name="remove-circle-outline"
                size={20}
                color="#EF4444"
              />
            </Pressable>
          )}
        </View>
      ))}
    </ScrollView>
  );
}
