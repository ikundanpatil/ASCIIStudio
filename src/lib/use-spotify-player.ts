// Spotify Web Playback SDK loader + hook
import { useEffect, useRef, useState, useCallback } from "react";
import { getValidToken, spotify } from "./spotify";

declare global {
  interface Window {
    Spotify?: {
      Player: new (opts: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume?: number;
      }) => SpotifyPlayer;
    };
    onSpotifyWebPlaybackSDKReady?: () => void;
  }
}

interface SpotifyPlayer {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  addListener: (event: string, cb: (data: unknown) => void) => void;
  togglePlay: () => Promise<void>;
  getCurrentState: () => Promise<unknown>;
  setVolume: (v: number) => Promise<void>;
}

let sdkLoading: Promise<void> | null = null;

function loadSdk(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Spotify) return Promise.resolve();
  if (sdkLoading) return sdkLoading;
  sdkLoading = new Promise((resolve) => {
    window.onSpotifyWebPlaybackSDKReady = () => resolve();
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);
  });
  return sdkLoading;
}

export interface PlaybackState {
  deviceId: string | null;
  ready: boolean;
  paused: boolean;
  position: number;
  duration: number;
  trackName: string;
  artist: string;
  albumArt: string;
  trackId: string;
  trackUri: string;
}

export function useSpotifyPlayer(active: boolean) {
  const playerRef = useRef<SpotifyPlayer | null>(null);
  const [state, setState] = useState<PlaybackState>({
    deviceId: null,
    ready: false,
    paused: true,
    position: 0,
    duration: 0,
    trackName: "",
    artist: "",
    albumArt: "",
    trackId: "",
    trackUri: "",
  });
  const [volume, setVolumeState] = useState(50);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let intervalId: number | undefined;

    (async () => {
      await loadSdk();
      if (cancelled || !window.Spotify) return;

      const player = new window.Spotify.Player({
        name: "ASCII Art Generator",
        getOAuthToken: async (cb) => {
          const t = await getValidToken();
          if (t) cb(t);
        },
        volume: 0.5,
      });

      player.addListener("ready", (data) => {
        const { device_id } = data as { device_id: string };
        setState((s) => ({ ...s, deviceId: device_id, ready: true }));
        spotify.transferPlayback(device_id).catch(() => {});
      });

      player.addListener("not_ready", () => {
        setState((s) => ({ ...s, ready: false }));
      });

      player.addListener("player_state_changed", (data) => {
        if (!data) return;
        const st = data as {
          paused: boolean;
          position: number;
          duration: number;
          track_window: {
            current_track: {
              id: string;
              uri: string;
              name: string;
              artists: { name: string }[];
              album: { images: { url: string }[] };
            };
          };
        };
        const t = st.track_window.current_track;
        setState((s) => ({
          ...s,
          paused: st.paused,
          position: st.position,
          duration: st.duration,
          trackName: t.name,
          artist: t.artists.map((a) => a.name).join(", "),
          albumArt: t.album.images[0]?.url ?? "",
          trackId: t.id,
          trackUri: t.uri,
        }));
      });

      player.addListener("initialization_error", (e) => console.error("init", e));
      player.addListener("authentication_error", (e) => console.error("auth", e));
      player.addListener("account_error", (e) => console.error("account", e));

      await player.connect();
      playerRef.current = player;

      // poll for position progress
      intervalId = window.setInterval(() => {
        setState((s) => {
          if (s.paused || !s.duration) return s;
          const next = Math.min(s.duration, s.position + 1000);
          return { ...s, position: next };
        });
      }, 1000);
    })();

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      playerRef.current?.disconnect();
      playerRef.current = null;
    };
  }, [active]);

  const togglePlay = useCallback(async () => {
    await playerRef.current?.togglePlay();
  }, []);

  const next = useCallback(async () => {
    if (state.deviceId) await spotify.next(state.deviceId);
  }, [state.deviceId]);

  const previous = useCallback(async () => {
    if (state.deviceId) await spotify.prev(state.deviceId);
  }, [state.deviceId]);

  const seek = useCallback(
    async (ms: number) => {
      if (state.deviceId) {
        await spotify.seek(state.deviceId, ms);
        setState((s) => ({ ...s, position: ms }));
      }
    },
    [state.deviceId],
  );

  const setVolume = useCallback(
    async (v: number) => {
      setVolumeState(v);
      await playerRef.current?.setVolume(v / 100);
    },
    [],
  );

  const playTrack = useCallback(
    async (uri: string, contextUri?: string) => {
      if (!state.deviceId) return;
      if (contextUri) {
        await spotify.play(state.deviceId, { context_uri: contextUri });
      } else {
        await spotify.play(state.deviceId, { uris: [uri] });
      }
    },
    [state.deviceId],
  );

  return { state, volume, togglePlay, next, previous, seek, setVolume, playTrack };
}
