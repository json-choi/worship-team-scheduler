import { Stack } from "expo-router";

export default function TeamLayout() {
  return (
    <Stack>
      <Stack.Screen name="settings" options={{ title: "팀 설정" }} />
      <Stack.Screen name="positions" options={{ title: "포지션 관리" }} />
    </Stack>
  );
}
