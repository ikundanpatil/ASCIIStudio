import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Toaster } from "sonner";
import { ImageIcon, Type, Library } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { ImageToAscii } from "@/components/image-to-ascii";
import { TextToAscii } from "@/components/text-to-ascii";
import { Gallery } from "@/components/gallery";
import { MusicToggle } from "@/components/music-toggle";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ASCII Studio — Turn Images & Text into ASCII Art" },
      {
        name: "description",
        content:
          "Free browser-based ASCII art generator. Convert any image or text into ASCII, customize the look, and save to your gallery — no sign-up, instant preview.",
      },
      { property: "og:title", content: "ASCII Studio — Turn Images & Text into ASCII Art" },
      {
        property: "og:description",
        content: "Free browser-based ASCII art generator. Convert any image or text into ASCII art instantly.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [galleryRefresh, setGalleryRefresh] = useState(0);

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" richColors theme="system" />
      <AppHeader />

      <main className="mx-auto max-w-[1600px] px-4 md:px-6 py-6 space-y-6">
        {/* Hero — Awwwards style */}
        <section className="relative overflow-hidden rounded-2xl border border-border bg-card noise-bg p-8 md:p-14">
          <div className="flex items-center gap-2 mb-5">
            <span className="inline-block h-2 w-2 rounded-full bg-accent animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-mono">
              v1.0 — Free · Browser-based · No sign-up
            </span>
          </div>
          <h2 className="font-display font-bold tracking-[-0.04em] leading-[0.95] text-4xl md:text-6xl lg:text-7xl">
            Turn images &amp; text into
            <br />
            <span className="italic text-accent">ASCII</span> art.
          </h2>
          <p className="text-muted-foreground mt-6 text-sm md:text-base max-w-2xl leading-relaxed">
            ASCII Studio is a creative playground for designers, developers, and curious makers.
            Drop in any photo or type a phrase, fine-tune the characters, contrast and width — then
            save your creations to a personal gallery and export them as text or PNG. Everything runs
            locally in your browser. No uploads. No accounts. Just art.
          </p>
          <div className="mt-7 flex flex-wrap gap-2 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            <span className="px-3 py-1.5 rounded-full border border-border">Image → ASCII</span>
            <span className="px-3 py-1.5 rounded-full border border-border">Text → ASCII</span>
            <span className="px-3 py-1.5 rounded-full border border-border">Save & Export</span>
            <span className="px-3 py-1.5 rounded-full border border-border">100% Private</span>
          </div>
        </section>

        {/* Tabs */}
        <Tabs defaultValue="image" className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="image">
              <ImageIcon className="h-4 w-4 mr-1.5" /> Image
            </TabsTrigger>
            <TabsTrigger value="text">
              <Type className="h-4 w-4 mr-1.5" /> Text
            </TabsTrigger>
            <TabsTrigger value="gallery">
              <Library className="h-4 w-4 mr-1.5" /> Gallery
            </TabsTrigger>
          </TabsList>
          <TabsContent value="image" className="mt-0">
            <ImageToAscii onSaved={() => setGalleryRefresh((x) => x + 1)} />
          </TabsContent>
          <TabsContent value="text" className="mt-0">
            <TextToAscii onSaved={() => setGalleryRefresh((x) => x + 1)} />
          </TabsContent>
          <TabsContent value="gallery" className="mt-0">
            <Gallery refreshKey={galleryRefresh} />
          </TabsContent>
        </Tabs>

        <footer className="text-center text-xs text-muted-foreground py-4">
          Built with ❤ — convert images & text to ASCII art in your browser.
        </footer>
      </main>

      <MusicToggle />
    </div>
  );
}
