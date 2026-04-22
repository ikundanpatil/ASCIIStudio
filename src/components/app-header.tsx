import { useState, useEffect } from "react";
import { Moon, Sun, Sparkles, HelpCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { applyTheme, getInitialTheme } from "@/lib/theme";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AppHeader() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const t = getInitialTheme();
    setTheme(t);
    applyTheme(t);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-spotify shadow-glow group-hover:scale-105 transition-transform">
            <Sparkles className="h-5 w-5 text-spotify-foreground" />
          </div>
          <div className="leading-tight">
            <h1 className="font-bold text-base md:text-lg tracking-tight">ASCII Studio</h1>
            <p className="text-[10px] md:text-xs text-muted-foreground -mt-0.5">
              Art · Text · Spotify
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-1.5">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Help">
                <HelpCircle className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>How to use ASCII Studio</DialogTitle>
                <DialogDescription>Quick tour of the features.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <p>
                  <strong>Image → ASCII:</strong> Drag-drop or upload an image, tweak character set,
                  width, contrast and brightness. Preview updates in real time.
                </p>
                <p>
                  <strong>Text → ASCII:</strong> Type text, pick a font (Block, Fancy, 3D, Small),
                  align it, and copy.
                </p>
                <p>
                  <strong>Gallery:</strong> Save your creations to local storage. Export as TXT or
                  PNG.
                </p>
                <p>
                  <strong>Spotify:</strong> Connect your Premium account, search and play any track.
                  Use ← → arrow keys for previous/next.
                </p>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
