import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";
import { api } from "@/lib/api";
import type { Team, TeamPosition } from "@wts/shared";

type Step = "profile" | "team" | "positions";

export default function OnboardingScreen() {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("profile");
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState(user?.user_metadata?.full_name ?? "");
  const [phone, setPhone] = useState("");

  const [teamMode, setTeamMode] = useState<"join" | "create">("join");
  const [inviteCode, setInviteCode] = useState("");
  const [teamName, setTeamName] = useState("");
  const [joinedTeam, setJoinedTeam] = useState<Team | null>(null);
  const [positions, setPositions] = useState<TeamPosition[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);

  async function handleProfileSubmit() {
    if (!name.trim()) {
      Alert.alert("알림", "이름을 입력해주세요");
      return;
    }
    setIsLoading(true);
    try {
      await api("/auth/me", {
        method: "PATCH",
        body: { name: name.trim(), phone: phone.trim() || undefined },
      });
      setStep("team");
    } catch (err) {
      Alert.alert("오류", err instanceof Error ? err.message : "저장 실패");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleJoinTeam() {
    if (!inviteCode.trim()) {
      Alert.alert("알림", "초대 코드를 입력해주세요");
      return;
    }
    setIsLoading(true);
    try {
      const result = await api<{ team: Team }>("/teams/join", {
        method: "POST",
        body: { inviteCode: inviteCode.trim().toUpperCase() },
      });
      setJoinedTeam(result.team);
      const teamPositions = await api<TeamPosition[]>(
        `/positions/team/${result.team.id}`,
      );
      setPositions(teamPositions);
      setStep("positions");
    } catch (err) {
      Alert.alert("오류", err instanceof Error ? err.message : "참가 실패");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateTeam() {
    if (!teamName.trim()) {
      Alert.alert("알림", "팀 이름을 입력해주세요");
      return;
    }
    setIsLoading(true);
    try {
      await api<Team>("/teams", {
        method: "POST",
        body: { name: teamName.trim() },
      });
      router.replace("/(tabs)");
    } catch (err) {
      Alert.alert("오류", err instanceof Error ? err.message : "팀 생성 실패");
    } finally {
      setIsLoading(false);
    }
  }

  function togglePosition(positionId: string) {
    setSelectedPositions((prev) =>
      prev.includes(positionId)
        ? prev.filter((id) => id !== positionId)
        : [...prev, positionId],
    );
  }

  async function handleFinish() {
    router.replace("/(tabs)");
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6 pt-8">
        <View className="mb-6">
          <View className="mb-2 flex-row">
            {(["profile", "team", "positions"] as const).map((s, i) => (
              <View
                key={s}
                className={`mr-2 h-1 flex-1 rounded-full ${
                  i <= ["profile", "team", "positions"].indexOf(step)
                    ? "bg-primary"
                    : "bg-gray-200"
                }`}
              />
            ))}
          </View>
        </View>

        {step === "profile" && (
          <View>
            <Text className="mb-1 text-2xl font-bold text-gray-900">
              프로필 설정
            </Text>
            <Text className="mb-6 text-base text-gray-500">
              팀원들에게 보여질 정보를 입력하세요
            </Text>

            <Text className="mb-1 text-sm font-medium text-gray-700">
              이름 *
            </Text>
            <TextInput
              className="mb-4 rounded-lg border border-gray-200 px-4 py-3 text-base text-gray-900"
              value={name}
              onChangeText={setName}
              placeholder="이름을 입력하세요"
              autoCapitalize="words"
            />

            <Text className="mb-1 text-sm font-medium text-gray-700">
              전화번호
            </Text>
            <TextInput
              className="mb-6 rounded-lg border border-gray-200 px-4 py-3 text-base text-gray-900"
              value={phone}
              onChangeText={setPhone}
              placeholder="010-0000-0000"
              keyboardType="phone-pad"
            />

            <Pressable
              className="items-center rounded-xl bg-primary px-6 py-4 active:bg-primary-600"
              onPress={handleProfileSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-base font-semibold text-white">
                  다음
                </Text>
              )}
            </Pressable>
          </View>
        )}

        {step === "team" && (
          <View>
            <Text className="mb-1 text-2xl font-bold text-gray-900">
              팀 참가
            </Text>
            <Text className="mb-6 text-base text-gray-500">
              초대 코드로 팀에 참가하거나, 새 팀을 만드세요
            </Text>

            <View className="mb-6 flex-row rounded-lg bg-gray-100 p-1">
              <Pressable
                className={`flex-1 items-center rounded-md py-2 ${
                  teamMode === "join" ? "bg-white shadow-sm" : ""
                }`}
                onPress={() => setTeamMode("join")}
              >
                <Text
                  className={`font-medium ${
                    teamMode === "join" ? "text-primary" : "text-gray-500"
                  }`}
                >
                  팀 참가
                </Text>
              </Pressable>
              <Pressable
                className={`flex-1 items-center rounded-md py-2 ${
                  teamMode === "create" ? "bg-white shadow-sm" : ""
                }`}
                onPress={() => setTeamMode("create")}
              >
                <Text
                  className={`font-medium ${
                    teamMode === "create" ? "text-primary" : "text-gray-500"
                  }`}
                >
                  새 팀 만들기
                </Text>
              </Pressable>
            </View>

            {teamMode === "join" ? (
              <>
                <Text className="mb-1 text-sm font-medium text-gray-700">
                  초대 코드
                </Text>
                <TextInput
                  className="mb-6 rounded-lg border border-gray-200 px-4 py-3 text-center text-lg font-bold tracking-widest text-gray-900"
                  value={inviteCode}
                  onChangeText={(text) => setInviteCode(text.toUpperCase())}
                  placeholder="ABCD1234"
                  autoCapitalize="characters"
                  maxLength={8}
                />
                <Pressable
                  className="items-center rounded-xl bg-primary px-6 py-4 active:bg-primary-600"
                  onPress={handleJoinTeam}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-base font-semibold text-white">
                      참가 신청
                    </Text>
                  )}
                </Pressable>
              </>
            ) : (
              <>
                <Text className="mb-1 text-sm font-medium text-gray-700">
                  팀 이름
                </Text>
                <TextInput
                  className="mb-6 rounded-lg border border-gray-200 px-4 py-3 text-base text-gray-900"
                  value={teamName}
                  onChangeText={setTeamName}
                  placeholder="예: 소망교회 찬양팀"
                  maxLength={50}
                />
                <Pressable
                  className="items-center rounded-xl bg-primary px-6 py-4 active:bg-primary-600"
                  onPress={handleCreateTeam}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-base font-semibold text-white">
                      팀 만들기
                    </Text>
                  )}
                </Pressable>
              </>
            )}
          </View>
        )}

        {step === "positions" && (
          <View>
            <Text className="mb-1 text-2xl font-bold text-gray-900">
              포지션 선택
            </Text>
            <Text className="mb-6 text-base text-gray-500">
              {joinedTeam?.name}에서 맡을 수 있는 포지션을 선택하세요
            </Text>

            <View className="mb-6 flex-row flex-wrap gap-3">
              {positions.map((position) => (
                <Pressable
                  key={position.id}
                  className={`rounded-full border px-4 py-2 ${
                    selectedPositions.includes(position.id)
                      ? "border-primary bg-primary-50"
                      : "border-gray-200 bg-white"
                  }`}
                  onPress={() => togglePosition(position.id)}
                >
                  <Text
                    className={`font-medium ${
                      selectedPositions.includes(position.id)
                        ? "text-primary"
                        : "text-gray-700"
                    }`}
                  >
                    {position.name}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              className="items-center rounded-xl bg-primary px-6 py-4 active:bg-primary-600"
              onPress={handleFinish}
            >
              <Text className="text-base font-semibold text-white">
                완료
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
