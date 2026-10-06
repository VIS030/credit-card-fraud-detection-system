import type {
  AnalyticsTrends,
  BulkUploadResponse,
  DashboardMetrics,
  HistoryItem,
  ModelVersion,
  PredictRequest,
  PredictResponse,
  SystemDiagnostics,
  TokenResponse,
  UserProfile,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const DEFAULT_TIMEOUT_MS = 20000;

function parseApiError(payload: unknown, status: number): string {
  if (payload && typeof payload === "object" && "detail" in payload) {
    const detail = (payload as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((entry) => {
          if (typeof entry === "string") return entry;
          if (entry && typeof entry === "object" && "msg" in entry) {
            const loc = Array.isArray((entry as { loc?: unknown }).loc)
              ? (entry as { loc: unknown[] }).loc.slice(1).join(".")
              : "";
            return loc ? `${loc}: ${(entry as { msg: string }).msg}` : String((entry as { msg: string }).msg);
          }
          return JSON.stringify(entry);
        })
        .join(" | ");
    }
  }
  return `API Error (${status})`;
}

export class ApiClient {
  private static getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("fg_access_token");
  }

  public static setTokens(accessToken: string, refreshToken: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem("fg_access_token", accessToken);
    localStorage.setItem("fg_refresh_token", refreshToken);
  }

  public static clearTokens() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("fg_access_token");
    localStorage.removeItem("fg_refresh_token");
  }

  private static async request<T>(
    endpoint: string,
    options: RequestInit = {},
    timeoutMs = DEFAULT_TIMEOUT_MS
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error("The request timed out. Please try again.");
      }
      console.error(`Network error calling ${API_BASE_URL}${endpoint}:`, error);
      throw new Error(
        `Unable to reach the FraudGuard API at ${API_BASE_URL}. Confirm the backend is running and NEXT_PUBLIC_API_URL is set.`
      );
    } finally {
      clearTimeout(timeout);
    }

    if (response.status === 401) {
      this.clearTokens();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login?reason=session_expired";
      }
    }

    if (!response.ok) {
      let errorMessage = `API Error (${response.status})`;
      try {
        const errorData = await response.json();
        errorMessage = parseApiError(errorData, response.status);
      } catch {
        // keep default
      }
      if (response.status === 401) {
        throw new Error("Your session expired. Please log in again.");
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  public static async login(credentials: { email: string; password: string }) {
    const data = await this.request<TokenResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    if (data.access_token) {
      this.setTokens(data.access_token, data.refresh_token);
    }
    return data;
  }

  public static async register(user: { email: string; password: string; full_name?: string }) {
    return this.request<UserProfile>("/auth/register", {
      method: "POST",
      body: JSON.stringify(user),
    });
  }

  public static async getProfile() {
    return this.request<UserProfile>("/auth/profile", { method: "GET" });
  }

  public static async updateProfile(fullName: string) {
    return this.request<UserProfile>("/auth/profile", {
      method: "PATCH",
      body: JSON.stringify({ full_name: fullName }),
    });
  }

  public static async predictSingle(payload: PredictRequest) {
    return this.request<PredictResponse>(
      "/predict",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      45000
    );
  }

  public static async predictCSV(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return this.request<BulkUploadResponse>(
      "/predict/csv",
      {
        method: "POST",
        body: formData,
      },
      120000
    );
  }

  public static async getHistory(classFilter = "all", limit = 50, fileId?: string) {
    const params = new URLSearchParams({
      class_filter: classFilter,
      limit: String(limit),
    });
    if (fileId) params.set("file_id", fileId);
    return this.request<HistoryItem[]>(`/history?${params.toString()}`, { method: "GET" });
  }

  public static async overridePrediction(id: string, overrideValue: number) {
    return this.request<HistoryItem>(`/history/${id}/override`, {
      method: "PATCH",
      body: JSON.stringify({ user_override: overrideValue }),
    });
  }

  public static async getDashboardMetrics() {
    return this.request<DashboardMetrics>("/dashboard", { method: "GET" });
  }

  public static async getAnalyticsTrends() {
    return this.request<AnalyticsTrends>("/analytics", { method: "GET" });
  }

  public static async getAdminModels() {
    return this.request<ModelVersion[]>("/admin/models", { method: "GET" });
  }

  public static async getDiagnostics() {
    return this.request<SystemDiagnostics>("/admin/diagnostics", { method: "GET" });
  }

  public static async activateModel(modelId: string) {
    return this.request<{ message: string; model_loaded: boolean }>(`/admin/models/${modelId}/activate`, {
      method: "POST",
    });
  }

  public static async retrainModel() {
    return this.request<{ message: string }>("/admin/models/retrain", { method: "POST" });
  }
}
