import { Stack } from "expo-router";

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen name="members" options={{ title: "멤버 관리" }} />
    </Stack>
  );
}
