import { API_BASE_URL } from "./config";

export class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = "ApiError";
    }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: { "Content-Type": "application/json", ...options?.headers },
    });

    const data = await response.json();

    if (!response.ok) {
        // Our Backend's error middleware always returns { error: "..." } -
        // surfacing that exact message is more useful than a generic one.
        throw new ApiError(response.status, data.error ?? "Request failed");
    }

    return data as T;
}

export const api = {
    post: <T>(path: string, body: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body) }),
    get: <T>(path: string) => request<T>(path),
    patch: <T>(path: string, body: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
};