"use client";

import { getToken, getRefreshToken, saveSession, getUser, clearSession } from "./auth";

const DEFAULT_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const API_URL = DEFAULT_API_URL.replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "ApiError";
    this.status = details.status;
    this.code = details.code;
    this.method = details.method;
    this.url = details.url;
    this.data = details.data;
  }
}

function isSerializableBody(body) {
  if (body === null || body === undefined) {
    return false;
  }

  if (typeof body === "string") {
    return false;
  }

  if (typeof FormData !== "undefined" && body instanceof FormData) {
    return false;
  }

  if (typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams) {
    return false;
  }

  if (typeof Blob !== "undefined" && body instanceof Blob) {
    return false;
  }

  if (typeof ArrayBuffer !== "undefined" && body instanceof ArrayBuffer) {
    return false;
  }

  return true;
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const method = (options.method || "GET").toUpperCase();
  
  // Build the URL with query parameters if provided
  let requestUrl = `${API_URL}${path}`;
  if (options.query && typeof options.query === "object") {
    const queryParams = new URLSearchParams(options.query).toString();
    requestUrl += `?${queryParams}`;
  }

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const token = getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const body = isSerializableBody(options.body) && headers.get("Content-Type")?.includes("application/json")
    ? JSON.stringify(options.body)
    : options.body;

  try {
    const response = await fetch(requestUrl, {
      ...options,
      method,
      headers,
      body
    });

    const responseText = await response.text();
    let data = {};

    if (responseText) {
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { message: responseText };
      }
    }

    if (!response.ok) {
      // Intercept 401 and try to refresh
      if (response.status === 401 && !path.includes("/auth/refresh") && !path.includes("/auth/login")) {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          try {
            const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refreshToken })
            });

            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              saveSession(refreshData.accessToken, getUser(), refreshData.refreshToken);
              
              // Retry the original request with the new access token
              headers.set("Authorization", `Bearer ${refreshData.accessToken}`);
              const retryResponse = await fetch(requestUrl, {
                ...options,
                method,
                headers,
                body
              });

              const retryText = await retryResponse.text();
              let retryData = {};
              if (retryText) {
                try {
                  retryData = JSON.parse(retryText);
                } catch {
                  retryData = { message: retryText };
                }
              }

              if (retryResponse.ok) {
                return retryData;
              } else {
                throw new ApiError(retryData.message || `Retry failed with status ${retryResponse.status}`, {
                  status: retryResponse.status,
                  code: retryData.code,
                  data: retryData,
                  method,
                  url: requestUrl
                });
              }
            }
          } catch (refreshErr) {
            clearSession();
            if (typeof window !== "undefined") {
              window.location.href = "/login";
            }
            throw new ApiError("Session expired. Please log in again.", { status: 401 });
          }
        }
        
        clearSession();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }

      throw new ApiError(data.message || `Request failed with status ${response.status}`, {
        status: response.status,
        code: data.code,
        data,
        method,
        url: requestUrl
      });
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof TypeError) {
      throw new ApiError(
        `Network error while contacting API (${method} ${requestUrl}). Check NEXT_PUBLIC_API_URL and backend CORS_ORIGIN.`,
        {
          status: 0,
          code: "NETWORK_ERROR",
          method,
          url: requestUrl
        }
      );
    }

    throw error;
  }
}
