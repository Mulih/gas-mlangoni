import uuid from "react-native-uuid";
import { API_BASE_URL } from "./config";

export class ApiError extends Error {
    constructor(public status: number, message: string, public requestId?: string) {
        super(message);
        this.name = "ApiError";
    }
}

let authToken: string | null = null;
// called on login, on app restart (restore) and on logout (null)
export function setAuthToken(token: string | null) { authToken = token; }

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const requestId = uuid.v4() as string; // one id per call, sent to the server
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: { 
            "Content-Type": "application/json",
            "x-request-id": requestId,
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
             ...options?.headers },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        // Our Backend's error middleware always returns { error: "..." } -
        // surfacing that exact message is more useful than a generic one.
        console.error(`[api] ${options?.method ?? "GET"} ${path} -> ${response.status} [${requestId}]`, data.error);
        throw new ApiError(response.status, data.error ?? "Request failed", requestId);
    }

    return data as T;
}

export const api = {
    post: <T>(path: string, body: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body) }),
    get: <T>(path: string) => request<T>(path),
    patch: <T>(path: string, body: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
};