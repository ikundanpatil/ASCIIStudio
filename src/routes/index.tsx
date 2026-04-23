import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Toaster } from "sonner";
import { ImageIcon, Type, Library } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { ImageToAscii } from "@/components/image-to-ascii";
import { TextToAscii } from "@/components/text-to-ascii";
import { Gallery } from "@/components/gallery";
import { MusicLibrary } from "@/components/music-library";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ASCII Studio — Image & Text to ASCII Art" },
      {
        name: "description",
        content:
          "Convert images and text to beautiful ASCII art with a built-in royalty-free music player. Free, fast, browser-based.",
      },
      { property: "og:title", content: "ASCII Studio" },
      {
        property: "og:description",
        content: "Image & text to ASCII art with a built-in royalty-free song library.",
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
        {/* Hero */}
        <div className="rounded-2xl p-6 md:p-8 bg-gradient-to-br from-primary/15 via-accent/30 to-transparent border border-primary/20">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Turn anything into <span className="text-spotify">ASCII art</span>
          </h2>
          <p className="text-muted-foreground mt-1.5 text-sm md:text-base max-w-2xl">
            Upload an image or type text, tweak the look, then save and share. With a built-in
            royalty-free music player for the right vibe.
          </p>
        </div>

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

        {/* Music */}
        <section aria-label="Music player">
          <MusicLibrary />
        </section>

        <footer className="text-center text-xs text-muted-foreground py-4">
          Built with ❤ — music by Kevin MacLeod (incompetech.com), licensed under CC-BY 4.0.
        </footer>
      </main>
    </div>
  );
}
