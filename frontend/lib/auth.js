"use client";

const TOKEN_KEY = "prosperous_token";
const REFRESH_TOKEN_KEY = "prosperous_refresh_token";
const USER_KEY = "prosperous_user";

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function saveSession(token, user, refreshToken) {
  if (!canUseStorage()) return;
  localStorage.setItem(TOKEN_KEY, token);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  if (!canUseStorage()) return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getRefreshToken() {
  if (!canUseStorage()) return null;
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getToken() {
  if (!canUseStorage()) return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getUser() {
  if (!canUseStorage()) return null;

  try {
    const value = localStorage.getItem(USER_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}
