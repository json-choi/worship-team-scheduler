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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import type { Schedule } from "@wts/shared";

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

function getSundaysInMonth(year: number, month: number): Date[] {
  const dates: Date[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    if (date.getDay() === 0) {
      dates.push(new Date(date));
    }
    date.setDate(date.getDate() + 1);
  }
  return dates;
}

function getDaysOfWeekInMonth(
  year: number,
  month: number,
  dayOfWeek: number,
): Date[] {
  const dates: Date[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    if (date.getDay() === dayOfWeek) {
      dates.push(new Date(date));
    }
    date.setDate(date.getDate() + 1);
  }
  return dates;
}

export default function NewScheduleScreen() {
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const queryClient = useQueryClient();

  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [selectedYear] = useState(nextMonth.getFullYear());
  const [selectedMonth] = useState(nextMonth.getMonth());
  const [repeatDay, setRepeatDay] = useState(0);
  const [titlePrefix, setTitlePrefix] = useState("주일예배");
  const [timeStart, setTimeStart] = useState("11:00");
  const [timeEnd, setTimeEnd] = useState("13:00");
  const [selectedDates, setSelectedDates] = useState<Date[]>(
    getSundaysInMonth(nextMonth.getFullYear(), nextMonth.getMonth()),
  );
  const [deadlineDays, setDeadlineDays] = useState("3");
  const [openVoting, setOpenVoting] = useState(true);

  function handleRepeatDayChange(day: number) {
    setRepeatDay(day);
    setSelectedDates(getDaysOfWeekInMonth(selectedYear, selectedMonth, day));
  }

  function toggleDate(date: Date) {
    setSelectedDates((prev) => {
      const exists = prev.find((d) => d.getTime() === date.getTime());
      if (exists) return prev.filter((d) => d.getTime() !== date.getTime());
      return [...prev, date].sort((a, b) => a.getTime() - b.getTime());
    });
  }

  const createMutation = useMutation({
    mutationFn: (data: {
      teamId: string;
      dates: string[];
      timeStart?: string;
      timeEnd?: string;
      titlePrefix: string;
      votingDeadline?: string;
      status: "draft" | "voting";
    }) => api<Schedule[]>("/schedules/batch", { method: "POST", body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      Alert.alert("완료", `${data.length}개의 스케줄이 생성되었습니다`, [
        { text: "확인", onPress: () => router.back() },
      ]);
    },
    onError: (err) =>
      Alert.alert("오류", err instanceof Error ? err.message : "생성 실패"),
  });

  function handleCreate() {
    if (!teamId || selectedDates.length === 0) {
      Alert.alert("알림", "날짜를 선택해주세요");
      return;
    }

    const firstDate = selectedDates[0];
    const deadlineDaysNum = parseInt(deadlineDays) || 3;
    const votingDeadline = new Date(firstDate);
    votingDeadline.setDate(votingDeadline.getDate() - deadlineDaysNum);

    createMutation.mutate({
      teamId,
      dates: selectedDates.map((d) => d.toISOString()),
      timeStart: timeStart || undefined,
      timeEnd: timeEnd || undefined,
      titlePrefix: titlePrefix || "주일예배",
      votingDeadline: votingDeadline.toISOString(),
      status: openVoting ? "voting" : "draft",
    });
  }

  const allDaysInMonth: Date[] = [];
  const d = new Date(selectedYear, selectedMonth, 1);
  while (d.getMonth() === selectedMonth) {
    allDaysInMonth.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }

  const firstDayOfWeek = new Date(
    selectedYear,
    selectedMonth,
    1,
  ).getDay();
  const calendarPadding = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  const monthLabel = `${selectedYear}년 ${selectedMonth + 1}월`;

  return (
    <ScrollView className="flex-1 bg-gray-50 px-4 pt-4">
      <Text className="mb-4 text-2xl font-bold text-gray-900">
        스케줄 생성
      </Text>
      <Text className="mb-6 text-sm text-gray-500">{monthLabel}</Text>

      <View className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
        <Text className="mb-3 text-base font-semibold text-gray-900">
          반복 패턴
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {DAY_NAMES.map((name, idx) => (
              <Pressable
                key={idx}
                className={`rounded-full px-4 py-2 ${
                  repeatDay === idx
                    ? "bg-primary"
                    : "border border-gray-200 bg-white"
                }`}
                onPress={() => handleRepeatDayChange(idx)}
              >
                <Text
                  className={`font-medium ${
                    repeatDay === idx ? "text-white" : "text-gray-700"
                  }`}
                >
                  매주 {name}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      <View className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
        <Text className="mb-3 text-base font-semibold text-gray-900">
          날짜 선택
        </Text>
        <View className="mb-2 flex-row">
          {DAY_NAMES.map((name) => (
            <View key={name} className="flex-1 items-center">
              <Text className="text-xs font-medium text-gray-400">{name}</Text>
            </View>
          ))}
        </View>
        <View className="flex-row flex-wrap">
          {calendarPadding.map((i) => (
            <View key={`pad-${i}`} className="h-10 flex-[1_0_14.28%]" />
          ))}
          {allDaysInMonth.map((date) => {
            const isSelected = selectedDates.some(
              (sd) => sd.getTime() === date.getTime(),
            );
            return (
              <Pressable
                key={date.toISOString()}
                className="h-10 flex-[1_0_14.28%] items-center justify-center"
                onPress={() => toggleDate(date)}
              >
                <View
                  className={`h-8 w-8 items-center justify-center rounded-full ${
                    isSelected ? "bg-primary" : ""
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      isSelected
                        ? "font-bold text-white"
                        : "text-gray-700"
                    }`}
                  >
                    {date.getDate()}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
        <Text className="mt-2 text-xs text-gray-400">
          {selectedDates.length}개 날짜 선택됨
        </Text>
      </View>

      <View className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
        <Text className="mb-3 text-base font-semibold text-gray-900">
          상세 설정
        </Text>

        <Text className="mb-1 text-sm font-medium text-gray-700">
          제목 접두어
        </Text>
        <TextInput
          className="mb-3 rounded-lg border border-gray-200 px-4 py-3 text-base text-gray-900"
          value={titlePrefix}
          onChangeText={setTitlePrefix}
          placeholder="예: 주일예배"
          maxLength={80}
        />

        <View className="mb-3 flex-row gap-3">
          <View className="flex-1">
            <Text className="mb-1 text-sm font-medium text-gray-700">
              시작 시간
            </Text>
            <TextInput
              className="rounded-lg border border-gray-200 px-4 py-3 text-center text-base text-gray-900"
              value={timeStart}
              onChangeText={setTimeStart}
              placeholder="11:00"
            />
          </View>
          <View className="flex-1">
            <Text className="mb-1 text-sm font-medium text-gray-700">
              종료 시간
            </Text>
            <TextInput
              className="rounded-lg border border-gray-200 px-4 py-3 text-center text-base text-gray-900"
              value={timeEnd}
              onChangeText={setTimeEnd}
              placeholder="13:00"
            />
          </View>
        </View>

        <Text className="mb-1 text-sm font-medium text-gray-700">
          투표 마감 (첫 일정 D-n일)
        </Text>
        <TextInput
          className="mb-3 rounded-lg border border-gray-200 px-4 py-3 text-center text-base text-gray-900"
          value={deadlineDays}
          onChangeText={setDeadlineDays}
          keyboardType="number-pad"
          maxLength={2}
        />

        <Pressable
          className="flex-row items-center"
          onPress={() => setOpenVoting((prev) => !prev)}
        >
          <Ionicons
            name={openVoting ? "checkbox" : "square-outline"}
            size={24}
            color={openVoting ? "#6366F1" : "#9CA3AF"}
          />
          <Text className="ml-2 text-sm text-gray-700">
            생성 즉시 투표 오픈
          </Text>
        </Pressable>
      </View>

      <Pressable
        className="mb-8 items-center rounded-xl bg-primary py-4 active:bg-primary-600"
        onPress={handleCreate}
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-base font-semibold text-white">
            {selectedDates.length}개 스케줄 생성
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}
