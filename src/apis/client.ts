import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import type { ApiResponse } from "./types/common";
import type { ReissueResponseData } from "./types/auth";
import { getAuthState, useAuthStore } from "../store/authStore";
import { getDeviceId } from "../utils/deviceId";
import { ENDPOINTS } from "./endpoints";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

// 재발급 요청에는 이 인스턴스의 인터셉터가 다시 걸리면 안 되므로
// 별도의 순수 axios 인스턴스를 사용한다 
const rawAxios = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

export const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ---- 요청 인터셉터: Authorization 헤더 첨부 (쿠키 미사용 정책) ----
client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken } = getAuthState();

    if (accessToken) {
      config.headers.set("Authorization", `Bearer ${accessToken}`);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ---- 401 재발급 큐잉 로직 (RTR) ----
let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}[] = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(error);
  });
  failedQueue = [];
}

async function reissueTokens(): Promise<string> {
  const { refreshToken } = getAuthState();

  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  // A108 POST /api/v1/auth-sessions/refresh (스펙 확정, 07/19)
  // 응답의 data 자체가 곧 AuthTokenResponse (A105/A106처럼 data.auth로 감싸지 않음)
  // 이 API는 Authorization 헤더 자체가 불필요함 (accessToken 만료 시 호출하는 것이므로).
  // RTR 정책: 재발급마다 accessToken/refreshToken이 둘 다 새로 나옴.
  // Redis에 세션 없음/만료/불일치(탈취 의심) → 백엔드가 코드 "A108_AUTH_REFRESH_401"로 401 반환.
  // 이 경우는 이 함수가 던지는 에러를 타고 응답 인터셉터의 catch 쪽에서 clearAuth() 처리됨.
  const { data } = await rawAxios.post<ApiResponse<ReissueResponseData>>(
    ENDPOINTS.AUTH.REFRESH,
    {
      refreshToken,
      deviceId: getDeviceId(),
    }
  );

  const tokens = data.data;
  useAuthStore.getState().setTokens(tokens);

  return tokens.accessToken;
}

// ---- 응답 인터셉터: 성공 시 data 언래핑, 401 시 재발급 후 재시도 ----
client.interceptors.response.use(
  (response) => {
    return response.data?.data !== undefined ? response.data.data : response.data;
  },
  async (error: AxiosError<ApiResponse<null>>) => {
    const originalRequest = error.config as
      | (AxiosRequestConfig & { _retry?: boolean })
      | undefined;

    const status = error.response?.status;

    if (status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    // 재발급 요청 자체가 401이면 재시도 대상에서 제외 (무한 루프 방지)
    if (originalRequest.url === ENDPOINTS.AUTH.REFRESH) {
      useAuthStore.getState().clearAuth();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers["Authorization"] = `Bearer ${token}`;
            }
            resolve(client(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const newAccessToken = await reissueTokens();
      processQueue(null, newAccessToken);

      if (originalRequest.headers) {
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
      }
      return client(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      useAuthStore.getState().clearAuth();
      // TODO: 로그인 페이지로 리다이렉트 처리 (라우터 도입 후 연결)
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

/**
 * 응답 인터셉터가 이미 ApiResponse<T>의 data를 언래핑해서 반환하므로,
 * client.get/post를 직접 쓰면 반환 타입이 AxiosResponse<T>로 잘못 추론된다.
 * 도메인 API 파일(apis/services/*.ts)에서는 client 대신 이 apiClient를 사용할 것.
 */
export const apiClient = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    client.get(url, config) as unknown as Promise<T>,
  post: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    client.post(url, body, config) as unknown as Promise<T>,
  patch: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    client.patch(url, body, config) as unknown as Promise<T>,
  put: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    client.put(url, body, config) as unknown as Promise<T>,
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    client.delete(url, config) as unknown as Promise<T>,
};