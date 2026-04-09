"use client";

import { getToken } from "./auth";

const DEFAULT_API_URL = "https://data-hub-6kwj.onrender.com";
const API_URL = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}
