// lib/fetchWithProgress.js
import { LoadingBar } from "@/components/TopLoadingBar";

export async function fetchWithProgress(url, options = {}) {
  LoadingBar.start();

  try {
    const response = await fetch(url, options);
    LoadingBar.done();
    return response;
  } catch (error) {
    LoadingBar.done();
    throw error;
  }
}

export async function fetchJSON(url, options = {}) {
  const response = await fetchWithProgress(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response;
}

export async function postJSON(url, data, options = {}) {
  return fetchJSON(url, {
    method: "POST",
    headers: {
      ...options.headers,
    },
    body: JSON.stringify(data),
    ...options,
  });
}

export async function getJSON(url, options = {}) {
  return fetchJSON(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });
}
