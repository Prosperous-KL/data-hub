"use client";

import { getToken } from "./auth";

const DEFAULT_API_URL = "https://data-hub-6kwj.onrender.com";
const API_URL = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/+$/, "");

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

  return typeof body === "object";
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const method = (options.method || "GET").toUpperCase();
  const requestUrl = `${API_URL}${path}`;

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
