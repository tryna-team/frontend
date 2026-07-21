import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import type { ApiResponse } from "./types/common";
import type { ReissueResponseData } from "./types/auth";
import { getAuthState, useAuthStore } from "../stores/authStore";
import { getDeviceId } from "../utils/deviceId";
import { ENDPOINTS } from "./endpoints";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

// 재발급 요청에는 이 인스턴스의 인터셉터가 다시 걸리면 안 되므로
// 별도의 순수 axios 인스턴스를 사용한다 (무한 루프 방지).
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

// 요청 인터셉터 — accessToken이 있으면 Authorization 헤더를 자동으로 붙인다 (쿠키 미사용 정책).
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

// ---- 401 재발급 큐잉 (RTR) ----
// 여러 요청이 동시에 401을 받아도 재발급은 한 번만 실행하고,
// 나머지 요청은 큐에 대기시켰다가 새 토큰으로 한 번씩만 재시도한다.
// 재시도된 요청(client(originalRequest))은 요청 인터셉터를 다시 거치므로,
// 그 시점의 authStore.accessToken(reissueTokens에서 이미 갱신됨)이 자동으로
// Authorization 헤더에 붙는다 — 여기서 헤더를 수동으로 다시 세팅할 필요는 없다.
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

/**
 * A108 토큰 갱신 — POST /api/v1/auth-sessions/refresh
 * 응답의 data 자체가 곧 AuthTokenResponse (A105/A106과 달리 data.auth로 감싸지 않음).
 * Redis 세션 불일치(탈취 의심) 등으로 재발급이 거부되면 401(code: A108_AUTH_REFRESH_401)이
 * 반환되며, 이 경우 아래에서 던진 에러를 응답 인터셉터가 받아 clearAuth()를 호출한다.
 */
async function reissueTokens(): Promise<string> {
  const { refreshToken } = getAuthState();

  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

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

// 응답 인터셉터 — 성공 시 공통 응답 포맷에서 data만 꺼내 반환하고,
// 401이면 재발급 후 원래 요청을 자동으로 재시도한다.
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

    // 재발급 요청 자체가 401이면 재시도 대상에서 제외한다 (무한 루프 방지).
    if (originalRequest.url === ENDPOINTS.AUTH.REFRESH) {
      useAuthStore.getState().clearAuth();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (_token: string) => {
            originalRequest._retry = true;
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
 * 도메인 서비스 파일(apis/services/*.ts)에서는 client 대신 반드시 이 apiClient를 사용할 것.
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