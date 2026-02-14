import { useState } from "react";
import { View, Text, Pressable, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { signInWithGoogle } from "@/lib/auth";

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-8">
        <View className="mb-12 items-center">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-2xl bg-primary">
            <Text className="text-3xl font-bold text-white">W</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900">
            Worship Team Scheduler
          </Text>
          <Text className="mt-2 text-center text-base text-gray-500">
            팀원들과 함께 예배 일정을 관리하세요
          </Text>
        </View>

        {error && (
          <View className="mb-4 w-full rounded-lg bg-red-50 p-3">
            <Text className="text-center text-sm text-red-600">{error}</Text>
          </View>
        )}

        <Pressable
          className="w-full flex-row items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-4 shadow-sm active:bg-gray-50"
          onPress={handleGoogleSignIn}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#6366F1" />
          ) : (
            <>
              <Image
                source={{
                  uri: "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg",
                }}
                className="mr-3 h-5 w-5"
              />
              <Text className="text-base font-semibold text-gray-700">
                Google로 로그인
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
