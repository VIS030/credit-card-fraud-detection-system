const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

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

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
    } catch (error: any) {
      console.error(`Network error calling ${API_BASE_URL}${endpoint}:`, error);
      throw new Error(
        `Unable to connect to FraudShield AI backend at ${API_BASE_URL}. Please ensure the FastAPI server is running.`
      );
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
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        // use default message
      }
      throw new Error(errorMessage);
    }

    return response.json() as Promise<T>;
  }

  // Authentication API calls
  public static async login(credentials: { email: string; password: string }) {
    const data = await this.request<any>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    if (data.access_token) {
      this.setTokens(data.access_token, data.refresh_token);
    }
    return data;
  }

  public static async register(user: { email: string; password: string; full_name?: string }) {
    return this.request<any>("/auth/register", {
      method: "POST",
      body: JSON.stringify(user),
    });
  }

  public static async getProfile() {
    return this.request<any>("/auth/profile", { method: "GET" });
  }

  // Prediction API calls
  public static async predictSingle(payload: { time: number; amount: number; pca_features: Record<string, number> }) {
    return this.request<any>("/predict", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  public static async predictCSV(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return this.request<any>("/predict/csv", {
      method: "POST",
      body: formData,
    });
  }

  public static async getHistory(classFilter = "all", limit = 50) {
    return this.request<any[]>(`/history?class_filter=${classFilter}&limit=${limit}`, { method: "GET" });
  }

  public static async overridePrediction(id: string, overrideValue: number) {
    return this.request<any>(`/history/${id}/override`, {
      method: "PATCH",
      body: JSON.stringify({ user_override: overrideValue }),
    });
  }

  // Dashboard & Analytics API calls
  public static async getDashboardMetrics() {
    return this.request<any>("/dashboard", { method: "GET" });
  }

  public static async getAnalyticsTrends() {
    return this.request<any>("/analytics", { method: "GET" });
  }

  // Admin API calls
  public static async getAdminModels() {
    return this.request<any>("/admin/models", { method: "GET" });
  }

  public static async activateModel(modelId: string) {
    return this.request<any>(`/admin/models/${modelId}/activate`, { method: "POST" });
  }

  public static async retrainModel() {
    return this.request<any>("/admin/models/retrain", { method: "POST" });
  }
}
