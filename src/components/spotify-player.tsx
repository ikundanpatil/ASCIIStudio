import { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Search,
  LogOut,
  Heart,
  Music,
  Settings as SettingsIcon,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  beginLogin,
  getClientId,
  isLoggedIn,
  logout,
  setClientId,
  spotify,
  type SpotifyTrack,
  type SpotifyPlaylist,
  type SpotifyUser,
} from "@/lib/spotify";
import { useSpotifyPlayer } from "@/lib/use-spotify-player";
import { cn } from "@/lib/utils";

function fmt(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function SpotifyPlayer() {
  const [logged, setLogged] = useState(false);
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [clientIdInput, setClientIdInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [recent, setRecent] = useState<SpotifyTrack[]>([]);
  const searchTimer = useRef<number>();

  const { state, volume, togglePlay, next, previous, seek, setVolume, playTrack } =
    useSpotifyPlayer(logged);

  // init
  useEffect(() => {
    const cid = getClientId();
    setClientIdInput(cid ?? "");
    if (!cid) setShowSettings(true);
    setLogged(isLoggedIn());
  }, []);

  useEffect(() => {
    if (!logged) return;
    spotify.me().then(setUser).catch(() => {});
    spotify
      .recentlyPlayed()
      .then((r) => setRecent(r.items.map((i) => i.track)))
      .catch(() => {});
  }, [logged]);

  // keyboard shortcuts
  useEffect(() => {
    if (!logged) return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        previous();
      } else if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [logged, next, previous, togglePlay]);

  // debounced search
  useEffect(() => {
    if (!logged || !query.trim()) {
      setTracks([]);
      setPlaylists([]);
      return;
    }
    setSearching(true);
    window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(async () => {
      try {
        const res = await spotify.search(query);
        setTracks(res.tracks.items);
        setPlaylists((res.playlists.items ?? []).filter(Boolean));
      } catch (e) {
        console.error(e);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => window.clearTimeout(searchTimer.current);
  }, [query, logged]);

  const saveClientId = () => {
    const v = clientIdInput.trim();
    if (!v) return toast.error("Enter your Client ID");
    setClientId(v);
    toast.success("Client ID saved");
    setShowSettings(false);
  };

  const handleLogin = async () => {
    if (!getClientId()) {
      setShowSettings(true);
      return;
    }
    try {
      await beginLogin();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleLogout = () => {
    logout();
    setLogged(false);
    setUser(null);
    setTracks([]);
    setPlaylists([]);
    setRecent([]);
    toast.success("Logged out");
  };

  const handlePlayTrack = async (uri: string) => {
    try {
      await playTrack(uri);
    } catch (e) {
      toast.error("Playback failed. Make sure you have Spotify Premium.");
    }
  };

  const handlePlayContext = async (uri: string) => {
    try {
      if (!state.deviceId) return;
      await spotify.play(state.deviceId, { context_uri: uri });
    } catch {
      toast.error("Failed to play playlist");
    }
  };

  const handleSaveTrack = async () => {
    if (!state.trackId) return;
    try {
      await spotify.saveTrack(state.trackId);
      toast.success("Added to your Liked Songs");
    } catch {
      toast.error("Could not save");
    }
  };

  const settingsDialog = (
    <Dialog open={showSettings} onOpenChange={setShowSettings}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Spotify setup</DialogTitle>
          <DialogDescription>
            Paste your Spotify app Client ID. Create one at{" "}
            <a
              href="https://developer.spotify.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline"
            >
              developer.spotify.com/dashboard
            </a>
            . Add this redirect URI to your app:{" "}
            <code className="px-1.5 py-0.5 rounded bg-muted text-xs">
              {typeof window !== "undefined" ? `${window.location.origin}/spotify-callback` : ""}
            </code>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Client ID</Label>
          <Input
            value={clientIdInput}
            onChange={(e) => setClientIdInput(e.target.value)}
            placeholder="abc123def456…"
            className="font-mono text-sm"
          />
        </div>
        <DialogFooter>
          <Button onClick={saveClientId}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (!logged) {
    return (
      <Card className="p-6 md:p-8 text-center bg-gradient-to-br from-card to-accent/30 border-primary/20">
        {settingsDialog}
        <div className="mx-auto h-14 w-14 rounded-full gradient-spotify grid place-items-center mb-4 shadow-glow">
          <Music className="h-7 w-7 text-spotify-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-1">Connect Spotify</h3>
        <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
          Search, play and control your Spotify Premium music while you make ASCII art.
        </p>
        <div className="flex justify-center gap-2">
          <Button onClick={handleLogin} className="bg-spotify hover:bg-spotify/90 text-spotify-foreground font-semibold">
            <Music className="h-4 w-4 mr-2" /> Login with Spotify
          </Button>
          <Button variant="outline" onClick={() => setShowSettings(true)}>
            <SettingsIcon className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  }

  const progress = state.duration > 0 ? (state.position / state.duration) * 100 : 0;

  return (
    <Card className="overflow-hidden">
      {settingsDialog}
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-spotify/10 to-transparent">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full gradient-spotify grid place-items-center">
            <Music className="h-4 w-4 text-spotify-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground leading-tight">Connected as</p>
            <p className="text-sm font-semibold leading-tight">
              {user?.display_name ?? "Spotify"}
            </p>
          </div>
          {user?.product !== "premium" && user && (
            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive">
              Premium required for playback
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-1.5" /> Logout
        </Button>
      </div>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-0">
        {/* Now playing + controls */}
        <div className="p-5 border-b lg:border-b-0 lg:border-r border-border space-y-4">
          <div className="flex gap-4">
            <div className="h-24 w-24 rounded-md overflow-hidden bg-secondary shrink-0 shadow-elegant">
              {state.albumArt ? (
                <img src={state.albumArt} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full grid place-items-center text-muted-foreground">
                  <Music className="h-8 w-8" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Now playing</p>
              <h4 className="font-semibold truncate">{state.trackName || "Nothing playing"}</h4>
              <p className="text-sm text-muted-foreground truncate">{state.artist || "—"}</p>
              <Button
                size="sm"
                variant="ghost"
                className="mt-2 px-2 h-7"
                onClick={handleSaveTrack}
                disabled={!state.trackId}
              >
                <Heart className="h-3.5 w-3.5 mr-1" /> Like
              </Button>
            </div>
          </div>

          {/* progress */}
          <div className="space-y-1">
            <Slider
              value={[state.position]}
              max={state.duration || 1}
              step={1000}
              onValueChange={(v) => seek(v[0])}
              disabled={!state.duration}
            />
            <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
              <span>{fmt(state.position)}</span>
              <span>{fmt(state.duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={previous}>
                <SkipBack className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                onClick={togglePlay}
                className="bg-spotify hover:bg-spotify/90 text-spotify-foreground h-11 w-11 rounded-full"
              >
                {state.paused ? <Play className="h-5 w-5 ml-0.5" /> : <Pause className="h-5 w-5" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={next}>
                <SkipForward className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex items-center gap-2 w-32">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <Slider value={[volume]} max={100} step={1} onValueChange={(v) => setVolume(v[0])} />
            </div>
          </div>

          {!state.ready && (
            <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" /> Connecting player…
            </p>
          )}
          <p className="text-[11px] text-muted-foreground text-center">
            Shortcuts: ← prev · → next · space play/pause
          </p>
        </div>

        {/* Search + lists */}
        <div className="p-5 space-y-3 max-h-[420px] flex flex-col">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search songs, artists, playlists…"
              className="pl-9"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          <div className="overflow-y-auto flex-1 -mx-2 px-2 space-y-3">
            {tracks.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">Tracks</p>
                <div className="space-y-1">
                  {tracks.map((t) => (
                    <TrackRow
                      key={t.id}
                      track={t}
                      active={t.id === state.trackId}
                      onPlay={() => handlePlayTrack(t.uri)}
                    />
                  ))}
                </div>
              </div>
            )}
            {playlists.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                  Playlists
                </p>
                <div className="space-y-1">
                  {playlists.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handlePlayContext(p.uri)}
                      className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 text-left transition"
                    >
                      <img
                        src={p.images[0]?.url}
                        alt=""
                        className="h-10 w-10 rounded object-cover bg-secondary"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {p.tracks.total} tracks · {p.owner.display_name}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {!query && recent.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                  Recently played
                </p>
                <div className="space-y-1">
                  {recent.map((t, i) => (
                    <TrackRow
                      key={`${t.id}-${i}`}
                      track={t}
                      active={t.id === state.trackId}
                      onPlay={() => handlePlayTrack(t.uri)}
                    />
                  ))}
                </div>
              </div>
            )}
            {!query && recent.length === 0 && tracks.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8">
                Search for something to start
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function TrackRow({
  track,
  active,
  onPlay,
}: {
  track: SpotifyTrack;
  active: boolean;
  onPlay: () => void;
}) {
  return (
    <button
      onClick={onPlay}
      className={cn(
        "w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 text-left transition",
        active && "bg-spotify/15",
      )}
    >
      <img
        src={track.album.images[track.album.images.length - 1]?.url}
        alt=""
        className="h-10 w-10 rounded object-cover bg-secondary"
      />
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium truncate", active && "text-spotify")}>
          {track.name}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {track.artists.map((a) => a.name).join(", ")}
        </p>
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">{fmt(track.duration_ms)}</span>
    </button>
  );
}
