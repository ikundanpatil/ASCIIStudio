// Spotify PKCE OAuth + Web Playback SDK helpers

const CLIENT_ID_KEY = "spotify_client_id";
const TOKEN_KEY = "spotify_access_token";
const REFRESH_KEY = "spotify_refresh_token";
const EXPIRES_KEY = "spotify_expires_at";
const VERIFIER_KEY = "spotify_pkce_verifier";

export const SCOPES = [
  "user-read-private",
  "user-read-email",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "streaming",
  "playlist-read-private",
  "playlist-read-collaborative",
  "playlist-modify-public",
  "playlist-modify-private",
  "user-library-read",
  "user-library-modify",
  "user-read-recently-played",
  "user-top-read",
].join(" ");

export function getClientId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CLIENT_ID_KEY);
}

export function setClientId(id: string) {
  localStorage.setItem(CLIENT_ID_KEY, id.trim());
}

export function getRedirectUri(): string {
  return `${window.location.origin}/spotify-callback`;
}

function base64UrlEncode(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256(input: string): Promise<ArrayBuffer> {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
}

function randomString(len = 64): string {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => ("0" + b.toString(16)).slice(-2)).join("");
}

export async function beginLogin(): Promise<void> {
  const clientId = getClientId();
  if (!clientId) throw new Error("Spotify Client ID not configured");
  const verifier = randomString(64);
  const challenge = base64UrlEncode(await sha256(verifier));
  localStorage.setItem(VERIFIER_KEY, verifier);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: getRedirectUri(),
    code_challenge_method: "S256",
    code_challenge: challenge,
    scope: SCOPES,
  });
  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

export async function exchangeCode(code: string): Promise<void> {
  const clientId = getClientId();
  const verifier = localStorage.getItem(VERIFIER_KEY);
  if (!clientId || !verifier) throw new Error("Missing PKCE state");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: getRedirectUri(),
    client_id: clientId,
    code_verifier: verifier,
  });
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
  const data = await res.json();
  storeTokens(data);
}

function storeTokens(data: {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}) {
  localStorage.setItem(TOKEN_KEY, data.access_token);
  if (data.refresh_token) localStorage.setItem(REFRESH_KEY, data.refresh_token);
  localStorage.setItem(EXPIRES_KEY, String(Date.now() + data.expires_in * 1000));
}

export async function refreshAccessToken(): Promise<string | null> {
  const clientId = getClientId();
  const refresh = localStorage.getItem(REFRESH_KEY);
  if (!clientId || !refresh) return null;
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refresh,
    client_id: clientId,
  });
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    logout();
    return null;
  }
  const data = await res.json();
  storeTokens(data);
  return data.access_token;
}

export async function getValidToken(): Promise<string | null> {
  const token = localStorage.getItem(TOKEN_KEY);
  const expires = Number(localStorage.getItem(EXPIRES_KEY) ?? 0);
  if (!token) return null;
  if (Date.now() > expires - 60_000) {
    return refreshAccessToken();
  }
  return token;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(EXPIRES_KEY);
  localStorage.removeItem(VERIFIER_KEY);
}

export function isLoggedIn(): boolean {
  return !!localStorage.getItem(TOKEN_KEY);
}

// --- API helpers ---

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getValidToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (res.status === 204) return undefined as T;
  if (!res.ok) throw new Error(`Spotify API ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export interface SpotifyTrack {
  id: string;
  uri: string;
  name: string;
  duration_ms: number;
  artists: { id: string; name: string }[];
  album: { id: string; name: string; images: { url: string; width: number; height: number }[] };
}

export interface SpotifyPlaylist {
  id: string;
  uri: string;
  name: string;
  images: { url: string }[];
  owner: { display_name: string };
  tracks: { total: number };
}

export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: { url: string }[];
  product: string;
}

export const spotify = {
  me: () => api<SpotifyUser>("/me"),
  search: (q: string) =>
    api<{
      tracks: { items: SpotifyTrack[] };
      playlists: { items: SpotifyPlaylist[] };
    }>(`/search?q=${encodeURIComponent(q)}&type=track,playlist&limit=10`),
  recentlyPlayed: () =>
    api<{ items: { track: SpotifyTrack; played_at: string }[] }>(
      "/me/player/recently-played?limit=10",
    ),
  play: (deviceId: string, opts: { uris?: string[]; context_uri?: string }) =>
    api<void>(`/me/player/play?device_id=${deviceId}`, {
      method: "PUT",
      body: JSON.stringify(opts),
    }),
  pause: (deviceId: string) =>
    api<void>(`/me/player/pause?device_id=${deviceId}`, { method: "PUT" }),
  resume: (deviceId: string) =>
    api<void>(`/me/player/play?device_id=${deviceId}`, { method: "PUT" }),
  next: (deviceId: string) =>
    api<void>(`/me/player/next?device_id=${deviceId}`, { method: "POST" }),
  prev: (deviceId: string) =>
    api<void>(`/me/player/previous?device_id=${deviceId}`, { method: "POST" }),
  seek: (deviceId: string, ms: number) =>
    api<void>(`/me/player/seek?position_ms=${ms}&device_id=${deviceId}`, { method: "PUT" }),
  setVolume: (deviceId: string, volume: number) =>
    api<void>(`/me/player/volume?volume_percent=${volume}&device_id=${deviceId}`, {
      method: "PUT",
    }),
  transferPlayback: (deviceId: string) =>
    api<void>("/me/player", {
      method: "PUT",
      body: JSON.stringify({ device_ids: [deviceId], play: false }),
    }),
  saveTrack: (id: string) => api<void>(`/me/tracks?ids=${id}`, { method: "PUT" }),
};
