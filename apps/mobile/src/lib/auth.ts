import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

const redirectUri = makeRedirectUri({
  scheme: "wts",
  path: "auth/callback",
});

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectUri,
      queryParams: {
        prompt: "consent",
      },
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    throw error ?? new Error("No OAuth URL returned");
  }

  const result = await WebBrowser.openAuthSessionAsync(
    data.url,
    redirectUri,
    { showInRecents: true },
  );

  if (result.type !== "success") {
    throw new Error("Authentication cancelled");
  }

  const url = new URL(result.url);
  const params = new URLSearchParams(url.hash.substring(1));

  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  if (!accessToken || !refreshToken) {
    throw new Error("Missing tokens in callback");
  }

  const { data: sessionData, error: sessionError } =
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

  if (sessionError) throw sessionError;

  return sessionData;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
