import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
}

// Royalty-free / CC0 tracks (Kevin MacLeod — incompetech, licensed CC-BY 4.0)
const TRACKS: Track[] = [
  {
    id: "1",
    title: "Cipher",
    artist: "Kevin MacLeod",
    url: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Cipher.mp3",
  },
  {
    id: "2",
    title: "Hyperfun",
    artist: "Kevin MacLeod",
    url: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Hyperfun.mp3",
  },
  {
    id: "3",
    title: "Carefree",
    artist: "Kevin MacLeod",
    url: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Carefree.mp3",
  },
  {
    id: "4",
    title: "Wallpaper",
    artist: "Kevin MacLeod",
    url: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Wallpaper.mp3",
  },
  {
    id: "5",
    title: "Local Forecast",
    artist: "Kevin MacLeod",
    url: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Local%20Forecast.mp3",
  },
  {
    id: "6",
    title: "Monkeys Spinning Monkeys",
    artist: "Kevin MacLeod",
    url: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Monkeys%20Spinning%20Monkeys.mp3",
  },
];

function fmt(sec: number) {
  if (!isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function MusicLibrary() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const [loading, setLoading] = useState(false);

  const current = TRACKS[index];

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = volume / 100;
  }, [volume]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    setLoading(true);
    setPosition(0);
    if (playing) {
      a.play().catch(() => setPlaying(false));
    }
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    }
  };

  const next = () => setIndex((i) => (i + 1) % TRACKS.length);
  const prev = () => setIndex((i) => (i - 1 + TRACKS.length) % TRACKS.length);

  const onSeek = (v: number[]) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = v[0];
    setPosition(v[0]);
  };

  // arrow key shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === " " && e.target === document.body) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }); // re-bind to capture latest

  return (
    <Card className="overflow-hidden border-primary/20">
      <div className="grid md:grid-cols-[1fr_320px]">
        {/* Player */}
        <div className="p-5 md:p-6 bg-gradient-to-br from-primary/10 via-accent/20 to-transparent">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl gradient-spotify flex items-center justify-center shadow-glow shrink-0">
              <Music2 className="h-8 w-8 text-spotify-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Now playing</p>
              <h3 className="font-bold truncate">{current.title}</h3>
              <p className="text-sm text-muted-foreground truncate">{current.artist}</p>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <Slider
              value={[position]}
              max={duration || 1}
              step={1}
              onValueChange={onSeek}
              aria-label="Seek"
            />
            <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
              <span>{fmt(position)}</span>
              <span>{fmt(duration)}</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={prev} aria-label="Previous">
                <SkipBack className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                onClick={toggle}
                className="h-12 w-12 rounded-full gradient-spotify text-spotify-foreground hover:opacity-90"
                aria-label={playing ? "Pause" : "Play"}
                disabled={loading && !playing}
              >
                {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={next} aria-label="Next">
                <SkipForward className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex items-center gap-2 w-40">
              <Volume2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <Slider
                value={[volume]}
                max={100}
                step={1}
                onValueChange={(v) => setVolume(v[0])}
                aria-label="Volume"
              />
            </div>
          </div>
        </div>

        {/* Track list */}
        <div className="border-t md:border-t-0 md:border-l border-border bg-card/50">
          <div className="px-4 py-3 border-b border-border">
            <h4 className="text-sm font-semibold">Royalty-free library</h4>
            <p className="text-[11px] text-muted-foreground">
              Music by Kevin MacLeod · CC-BY 4.0
            </p>
          </div>
          <ul className="max-h-72 md:max-h-[260px] overflow-y-auto">
            {TRACKS.map((t, i) => {
              const active = i === index;
              return (
                <li key={t.id}>
                  <button
                    onClick={() => {
                      setIndex(i);
                      setPlaying(true);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-accent transition-colors",
                      active && "bg-accent",
                    )}
                  >
                    <span
                      className={cn(
                        "h-7 w-7 rounded-md flex items-center justify-center text-xs shrink-0",
                        active
                          ? "gradient-spotify text-spotify-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {active && playing ? (
                        <Pause className="h-3.5 w-3.5" />
                      ) : (
                        <Play className="h-3.5 w-3.5 ml-0.5" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium truncate">{t.title}</span>
                      <span className="block text-xs text-muted-foreground truncate">
                        {t.artist}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={current.url}
        preload="metadata"
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration);
          setLoading(false);
        }}
        onTimeUpdate={(e) => setPosition(e.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={next}
        onCanPlay={() => setLoading(false)}
      />
    </Card>
  );
}
