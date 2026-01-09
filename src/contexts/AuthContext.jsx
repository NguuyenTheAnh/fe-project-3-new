import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import authApi from "@/api/auth.api";
import axiosInstance from "@/util/axios.customize";
import { setupInterceptors } from "@/util/axios.interceptors";
import {
  clearAccessToken,
  clearAllTokens,
  clearRefreshToken,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "@/util/token.storage";
import { hasRole, isTokenExpired, parseJwt } from "@/util/jwt";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [accessTokenState, setAccessTokenState] = useState(getAccessToken());
  const [refreshTokenState, setRefreshTokenState] = useState(getRefreshToken());
  const [authUser, setAuthUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const persistTokens = useCallback((nextAccess, nextRefresh) => {
    if (nextAccess) {
      setAccessToken(nextAccess);
      setAccessTokenState(nextAccess);
    } else {
      clearAccessToken();
      setAccessTokenState(null);
    }

    if (nextRefresh) {
      setRefreshToken(nextRefresh);
      setRefreshTokenState(nextRefresh);
    } else {
      clearRefreshToken();
      setRefreshTokenState(null);
    }
  }, []);

  const syncUserFromToken = useCallback((token, userFromResponse) => {
    if (!token) {
      setAuthUser(null);
      return null;
    }
    const parsed = parseJwt(token);
    if (!parsed || isTokenExpired(token)) {
      setAuthUser(null);
      return null;
    }
    const normalizedRole = userFromResponse?.role
      ? userFromResponse.role.startsWith("ROLE_")
        ? userFromResponse.role
        : `ROLE_${userFromResponse.role}`
      : null;
    const roles = Array.isArray(userFromResponse?.roles)
      ? userFromResponse.roles
      : normalizedRole
      ? [normalizedRole]
      : parsed.roles || [];

    const mergedUser = {
      ...parsed,
      ...userFromResponse,
      roles,
    };
    setAuthUser(mergedUser);
    return mergedUser;
  }, []);

  const logout = useCallback(async () => {
    const currentRefresh = getRefreshToken();
    try {
      if (currentRefresh) {
        await authApi.logout({ refreshToken: currentRefresh });
      }
    } catch (error) {
      // Best-effort logout; ignore API errors
    } finally {
      clearAllTokens();
      setAccessTokenState(null);
      setRefreshTokenState(null);
      setAuthUser(null);
    }
  }, []);

  const login = useCallback(
    async (email, password) => {
      const tokens = await authApi.login({ email, password });
      const { accessToken, refreshToken, user } = tokens || {};
      persistTokens(accessToken, refreshToken);
      return syncUserFromToken(accessToken, user);
    },
    [persistTokens, syncUserFromToken]
  );

  const register = useCallback(
    async ({ email, password, fullName }) => {
      const tokens = await authApi.register({ email, password, fullName });
      const { accessToken, refreshToken, user } = tokens || {};
      persistTokens(accessToken, refreshToken);
      return syncUserFromToken(accessToken, user);
    },
    [persistTokens, syncUserFromToken]
  );

  const refreshSession = useCallback(
    async (manualRefreshToken) => {
      const refreshToken =
        manualRefreshToken || refreshTokenState || getRefreshToken();
      if (!refreshToken) {
        throw new Error("Không có phiên đăng nhập.");
      }
      const tokens = await authApi.refresh({ refreshToken });
      const { accessToken, refreshToken: nextRefresh } = tokens || {};
      persistTokens(accessToken, nextRefresh || refreshToken);
      syncUserFromToken(accessToken);
      return accessToken;
    },
    [persistTokens, refreshTokenState, syncUserFromToken]
  );

  useEffect(() => {
    const initialize = async () => {
      try {
        const storedAccess = getAccessToken();
        const storedRefresh = getRefreshToken();

        if (storedAccess && !isTokenExpired(storedAccess)) {
          persistTokens(storedAccess, storedRefresh);
          syncUserFromToken(storedAccess);
        } else if (storedRefresh) {
          try {
            await refreshSession(storedRefresh);
          } catch {
            clearAllTokens();
            setAuthUser(null);
          }
        } else {
          clearAllTokens();
          setAuthUser(null);
        }
      } finally {
        setInitializing(false);
      }
    };

    initialize();
  }, [persistTokens, refreshSession, syncUserFromToken]);

  useEffect(() => {
    setupInterceptors(axiosInstance, {
      getAccessToken: () => getAccessToken(),
      refreshSession,
      logout,
    });
  }, [logout, refreshSession]);

  const value = useMemo(
    () => ({
      authUser,
      isAuthenticated: Boolean(authUser),
      accessToken: accessTokenState,
      refreshToken: refreshTokenState,
      initializing,
      login,
      register,
      logout,
      refreshSession,
      hasRole: (roleName) => hasRole(authUser, roleName),
    }),
    [
      accessTokenState,
      authUser,
      initializing,
      login,
      logout,
      refreshSession,
      refreshTokenState,
      register,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
