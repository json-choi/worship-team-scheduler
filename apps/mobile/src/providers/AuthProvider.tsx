import { createContext, useContext, type ReactNode } from "react";
import { authClient } from "@/lib/auth";

interface AuthContextType {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string | null;
  } | null;
  isLoggedIn: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        isLoggedIn: !!session?.user,
        isLoading: isPending,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
