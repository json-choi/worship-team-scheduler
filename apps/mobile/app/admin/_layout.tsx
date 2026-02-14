import { Stack } from "expo-router";

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen name="members" options={{ title: "멤버 관리" }} />
      <Stack.Screen name="schedule/new" options={{ title: "스케줄 생성" }} />
      <Stack.Screen name="schedule/[id]/assign" options={{ title: "분배 관리" }} />
    </Stack>
  );
}
