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
import { useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import type { TeamPosition } from "@wts/shared";

export default function PositionsScreen() {
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const queryClient = useQueryClient();

  const { data: positions, isLoading } = useQuery({
    queryKey: ["positions", teamId],
    queryFn: () => api<TeamPosition[]>(`/positions/team/${teamId}`),
    enabled: !!teamId,
  });

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formMin, setFormMin] = useState("1");
  const [formMax, setFormMax] = useState("1");

  const createMutation = useMutation({
    mutationFn: (data: { teamId: string; name: string; minRequired: number; maxRequired: number }) =>
      api("/positions", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions", teamId] });
      resetForm();
    },
    onError: (err) =>
      Alert.alert("오류", err instanceof Error ? err.message : "추가 실패"),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      minRequired?: number;
      maxRequired?: number;
    }) => api(`/positions/${id}`, { method: "PATCH", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions", teamId] });
      resetForm();
    },
    onError: (err) =>
      Alert.alert("오류", err instanceof Error ? err.message : "수정 실패"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api(`/positions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions", teamId] });
    },
  });

  function resetForm() {
    setIsAdding(false);
    setEditingId(null);
    setFormName("");
    setFormMin("1");
    setFormMax("1");
  }

  function startEditing(position: TeamPosition) {
    setEditingId(position.id);
    setFormName(position.name);
    setFormMin(String(position.minRequired));
    setFormMax(String(position.maxRequired));
    setIsAdding(false);
  }

  function handleCreate() {
    if (!formName.trim() || !teamId) return;
    createMutation.mutate({
      teamId,
      name: formName.trim(),
      minRequired: parseInt(formMin) || 1,
      maxRequired: parseInt(formMax) || 1,
    });
  }

  function handleUpdate() {
    if (!editingId || !formName.trim()) return;
    updateMutation.mutate({
      id: editingId,
      name: formName.trim(),
      minRequired: parseInt(formMin) || 1,
      maxRequired: parseInt(formMax) || 1,
    });
  }

  function handleDelete(id: string, name: string) {
    Alert.alert("포지션 삭제", `${name}을(를) 삭제하시겠습니까?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => deleteMutation.mutate(id),
      },
    ]);
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
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-gray-900">포지션 관리</Text>
        <Pressable
          className="rounded-lg bg-primary px-4 py-2"
          onPress={() => {
            resetForm();
            setIsAdding(true);
          }}
        >
          <Text className="font-medium text-white">추가</Text>
        </Pressable>
      </View>

      {(isAdding || editingId) && (
        <View className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
          <Text className="mb-3 text-base font-semibold text-gray-900">
            {isAdding ? "새 포지션" : "포지션 수정"}
          </Text>
          <Text className="mb-1 text-sm font-medium text-gray-700">이름</Text>
          <TextInput
            className="mb-3 rounded-lg border border-gray-200 px-4 py-3 text-base text-gray-900"
            value={formName}
            onChangeText={setFormName}
            placeholder="예: 드럼"
            maxLength={30}
          />
          <View className="mb-4 flex-row gap-3">
            <View className="flex-1">
              <Text className="mb-1 text-sm font-medium text-gray-700">
                최소 인원
              </Text>
              <TextInput
                className="rounded-lg border border-gray-200 px-4 py-3 text-center text-base text-gray-900"
                value={formMin}
                onChangeText={setFormMin}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
            <View className="flex-1">
              <Text className="mb-1 text-sm font-medium text-gray-700">
                최대 인원
              </Text>
              <TextInput
                className="rounded-lg border border-gray-200 px-4 py-3 text-center text-base text-gray-900"
                value={formMax}
                onChangeText={setFormMax}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
          </View>
          <View className="flex-row gap-3">
            <Pressable
              className="flex-1 items-center rounded-lg border border-gray-200 py-3"
              onPress={resetForm}
            >
              <Text className="font-medium text-gray-700">취소</Text>
            </Pressable>
            <Pressable
              className="flex-1 items-center rounded-lg bg-primary py-3"
              onPress={isAdding ? handleCreate : handleUpdate}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="font-medium text-white">
                  {isAdding ? "추가" : "저장"}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      )}

      {positions?.map((position, index) => (
        <View
          key={position.id}
          className="mb-2 flex-row items-center rounded-xl bg-white px-5 py-4 shadow-sm"
        >
          <View
            className="mr-3 h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: position.color ?? "#6366F1" }}
          >
            <Text className="text-xs font-bold text-white">
              {position.name[0]}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-medium text-gray-900">
              {position.name}
            </Text>
            <Text className="text-xs text-gray-500">
              {position.minRequired}~{position.maxRequired}명
            </Text>
          </View>
          <Pressable
            className="mr-2 p-2"
            onPress={() => startEditing(position)}
          >
            <Ionicons name="pencil-outline" size={18} color="#6366F1" />
          </Pressable>
          <Pressable
            className="p-2"
            onPress={() => handleDelete(position.id, position.name)}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </Pressable>
        </View>
      ))}

      {!positions?.length && (
        <View className="items-center rounded-2xl bg-white p-8 shadow-sm">
          <Ionicons name="musical-notes-outline" size={48} color="#D1D5DB" />
          <Text className="mt-4 text-base text-gray-400">
            포지션을 추가해주세요
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
