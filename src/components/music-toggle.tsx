import { useEffect, useRef, useState } from "react";
import { Music, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

// Single track. Replace AUDIO_URL with any MP3 you legally host
// (the official Sunflower master is copyrighted and cannot be bundled).
const TRACK = {
  title: "Sunflower",
  artist: "Post Malone, Swae Lee",
  // Placeholder: short preview-style URL. Swap with your hosted MP3.
  audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
};

export function MusicToggle() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    audioRef.current = new Audio(TRACK.audioUrl);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.55;
    const a = audioRef.current;
    const onEnd = () => setPlaying(false);
    a.addEventListener("pause", onEnd);

    // Try autoplay immediately (works if browser allows it)
    a.play()
      .then(() => setPlaying(true))
      .catch(() => {
        // Blocked — fall back to starting on first user interaction
        const startOnInteract = () => {
          a.play()
            .then(() => setPlaying(true))
            .catch(() => {});
          cleanup();
        };
        const cleanup = () => {
          window.removeEventListener("pointerdown", startOnInteract);
          window.removeEventListener("keydown", startOnInteract);
          window.removeEventListener("touchstart", startOnInteract);
        };
        window.addEventListener("pointerdown", startOnInteract, { once: true });
        window.addEventListener("keydown", startOnInteract, { once: true });
        window.addEventListener("touchstart", startOnInteract, { once: true });
      });

    return () => {
      a.removeEventListener("pause", onEnd);
      a.pause();
      audioRef.current = null;
    };
  }, []);

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

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3">
      {/* Track label card */}
      <div
        className={cn(
          "hidden sm:flex items-center gap-2.5 rounded-full border border-border bg-card/90 backdrop-blur-md pl-3 pr-4 py-2 shadow-elegant transition-all",
          playing ? "opacity-100 translate-x-0" : "opacity-0 translate-x-3 pointer-events-none",
        )}
        aria-hidden={!playing}
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
        <div className="leading-tight">
          <p className="text-xs font-semibold tracking-tight">{TRACK.title}</p>
          <p className="text-[10px] text-muted-foreground">{TRACK.artist}</p>
        </div>
      </div>

      {/* Toggle button */}
      <button
        onClick={toggle}
        aria-label={playing ? "Pause music" : "Play music"}
        aria-pressed={playing}
        className={cn(
          "group relative h-14 w-14 rounded-full border border-border bg-card text-foreground shadow-elegant transition-all hover:scale-105 active:scale-95",
          playing && "bg-primary text-primary-foreground border-primary animate-pulse-glow",
        )}
      >
        <span
          className={cn(
            "absolute inset-0 grid place-items-center transition-opacity",
            playing ? "opacity-100" : "opacity-0",
          )}
        >
          <Pause className="h-5 w-5" />
        </span>
        <span
          className={cn(
            "absolute inset-0 grid place-items-center transition-opacity",
            playing ? "opacity-0" : "opacity-100",
          )}
        >
          <Music className={cn("h-5 w-5", playing && "animate-vinyl")} />
        </span>
      </button>
    </div>
  );
}
