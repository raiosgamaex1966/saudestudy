import { useCallback, useMemo, useSyncExternalStore } from "react";
import { getSession, isLoggedIn, logoutLocal } from "@/lib/localAuth";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot() {
  return isLoggedIn();
}

export function useAuth() {
  // Use sync external store to react to localStorage changes
  const loggedIn = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const user = useMemo(() => getSession(), []);

  const logout = useCallback(() => {
    logoutLocal();
  }, []);

  const isBlocked = user?.blocked ?? false;
  const statusMessage = isBlocked
    ? (user?.blockReason || "Sua conta foi bloqueada. Entre em contato com o suporte.")
    : null;

  return useMemo(
    () => ({
      user,
      isAuthenticated: loggedIn,
      isLoading: false, // Never loading - everything is synchronous
      isBlocked,
      isExpired: false,
      statusMessage,
      logout,
      refresh: () => {},
    }),
    [user, loggedIn, isBlocked, statusMessage, logout],
  );
}
