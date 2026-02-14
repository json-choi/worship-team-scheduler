import { Stack } from "expo-router";

export default function ScheduleLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "스케줄" }} />
      <Stack.Screen name="[id]" options={{ title: "일정 상세" }} />
      <Stack.Screen name="[id]/vote" options={{ title: "투표" }} />
    </Stack>
  );
}
