import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import type { Team } from "@wts/shared";

export default function TeamSettingsScreen() {
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const queryClient = useQueryClient();

  const { data: team, isLoading } = useQuery({
    queryKey: ["team", teamId],
    queryFn: () => api<Team>(`/teams/${teamId}`),
    enabled: !!teamId,
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (data: { name?: string; description?: string }) =>
      api(`/teams/${teamId}`, { method: "PATCH", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", teamId] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      setIsEditing(false);
    },
    onError: (err) =>
      Alert.alert("오류", err instanceof Error ? err.message : "수정 실패"),
  });

  const regenerateCodeMutation = useMutation({
    mutationFn: () =>
      api(`/teams/${teamId}/regenerate-code`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", teamId] });
      Alert.alert("완료", "초대 코드가 변경되었습니다");
    },
  });

  function startEditing() {
    if (!team) return;
    setName(team.name);
    setDescription(team.description ?? "");
    setIsEditing(true);
  }

  function handleSave() {
    updateMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
    });
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50 px-4 pt-4">
      <Text className="mb-4 text-2xl font-bold text-gray-900">팀 설정</Text>

      <View className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
        {isEditing ? (
          <>
            <Text className="mb-1 text-sm font-medium text-gray-700">
              팀 이름
            </Text>
            <TextInput
              className="mb-3 rounded-lg border border-gray-200 px-4 py-3 text-base text-gray-900"
              value={name}
              onChangeText={setName}
              maxLength={50}
            />
            <Text className="mb-1 text-sm font-medium text-gray-700">
              설명
            </Text>
            <TextInput
              className="mb-4 rounded-lg border border-gray-200 px-4 py-3 text-base text-gray-900"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={500}
            />
            <View className="flex-row gap-3">
              <Pressable
                className="flex-1 items-center rounded-lg border border-gray-200 py-3"
                onPress={() => setIsEditing(false)}
              >
                <Text className="font-medium text-gray-700">취소</Text>
              </Pressable>
              <Pressable
                className="flex-1 items-center rounded-lg bg-primary py-3"
                onPress={handleSave}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="font-medium text-white">저장</Text>
                )}
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <View className="flex-row items-center justify-between">
              <Text className="text-xl font-bold text-gray-900">
                {team?.name}
              </Text>
              <Pressable onPress={startEditing}>
                <Ionicons name="pencil-outline" size={20} color="#6366F1" />
              </Pressable>
            </View>
            {team?.description && (
              <Text className="mt-2 text-sm text-gray-500">
                {team.description}
              </Text>
            )}
          </>
        )}
      </View>

      <View className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
        <Text className="mb-3 text-base font-semibold text-gray-900">
          초대 코드
        </Text>
        <View className="flex-row items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
          <Text className="text-lg font-bold tracking-widest text-primary">
            {team?.inviteCode}
          </Text>
          <Pressable
            onPress={() =>
              regenerateCodeMutation.mutate()
            }
          >
            <Ionicons name="refresh-outline" size={20} color="#6366F1" />
          </Pressable>
        </View>
        <Text className="mt-2 text-xs text-gray-400">
          이 코드를 팀원에게 공유하세요
        </Text>
      </View>

      <Pressable
        className="mb-4 flex-row items-center rounded-2xl bg-white px-5 py-4 shadow-sm active:bg-gray-50"
        onPress={() =>
          router.push({
            pathname: "/team/positions",
            params: { teamId: teamId! },
          })
        }
      >
        <Ionicons name="musical-notes-outline" size={20} color="#6B7280" />
        <Text className="ml-3 flex-1 text-base text-gray-900">
          포지션 관리
        </Text>
        <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
      </Pressable>
    </ScrollView>
  );
}
