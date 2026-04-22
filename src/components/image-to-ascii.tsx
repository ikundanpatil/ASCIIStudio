import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Upload, RotateCcw, Save, Copy, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  CHAR_SETS,
  type CharSetKey,
  imageToAscii,
  loadImage,
  asciiToPng,
  downloadBlob,
} from "@/lib/ascii";
import { addToGallery } from "@/lib/storage";
import { cn } from "@/lib/utils";

interface Props {
  onSaved: () => void;
}

export function ImageToAscii({ onSaved }: Props) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageName, setImageName] = useState<string>("");
  const [width, setWidth] = useState(120);
  const [charSet, setCharSet] = useState<CharSetKey>("standard");
  const [customSet, setCustomSet] = useState("");
  const [invert, setInvert] = useState(false);
  const [contrast, setContrast] = useState(0);
  const [brightness, setBrightness] = useState(0);
  const [ascii, setAscii] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const activeCharSet = useMemo(() => {
    if (charSet === ("custom" as CharSetKey)) return customSet || CHAR_SETS.standard;
    return CHAR_SETS[charSet];
  }, [charSet, customSet]);

  useEffect(() => {
    if (!image) {
      setAscii("");
      return;
    }
    const out = imageToAscii(image, {
      width,
      charSet: activeCharSet,
      invert,
      contrast,
      brightness,
    });
    setAscii(out);
  }, [image, width, activeCharSet, invert, contrast, brightness]);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      setImage(img);
      setImageName(file.name);
    } catch {
      toast.error("Failed to load image");
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }, []);

  const reset = () => {
    setWidth(120);
    setCharSet("standard");
    setInvert(false);
    setContrast(0);
    setBrightness(0);
  };

  const handleCopy = async () => {
    if (!ascii) return;
    await navigator.clipboard.writeText(ascii);
    toast.success("Copied to clipboard");
  };

  const handleDownloadTxt = () => {
    if (!ascii) return;
    downloadBlob(new Blob([ascii], { type: "text/plain" }), `${imageName || "ascii"}.txt`);
  };

  const handleDownloadPng = async () => {
    if (!ascii) return;
    const isDark = document.documentElement.classList.contains("dark");
    const blob = await asciiToPng(ascii, isDark);
    downloadBlob(blob, `${imageName || "ascii"}.png`);
  };

  const handleSave = () => {
    if (!ascii) return;
    addToGallery({ type: "image", title: imageName || "Untitled", ascii });
    toast.success("Saved to gallery");
    onSaved();
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <Card className="p-5 space-y-5 h-fit">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
          onClick={() => fileRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
            dragOver
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50 hover:bg-accent/30",
          )}
        >
          <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium">
            {imageName ? imageName : "Drop image or click to upload"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">JPG, PNG, GIF, WebP</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>

        <div className="space-y-2">
          <Label>Character set</Label>
          <Select value={charSet} onValueChange={(v) => setCharSet(v as CharSetKey)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="detailed">Detailed (70 chars)</SelectItem>
              <SelectItem value="minimal">Minimal blocks</SelectItem>
              <SelectItem value="blocks">Block density</SelectItem>
              <SelectItem value="binary">Binary (0/1)</SelectItem>
              <SelectItem value="dots">Dots</SelectItem>
              <SelectItem value="custom">Custom…</SelectItem>
            </SelectContent>
          </Select>
          {charSet === ("custom" as CharSetKey) && (
            <input
              type="text"
              value={customSet}
              onChange={(e) => setCustomSet(e.target.value)}
              placeholder="@%#*+=-:. "
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
            />
          )}
        </div>

        <div className="space-y-2">
          <Label className="flex justify-between">
            <span>Width</span>
            <span className="text-muted-foreground tabular-nums">{width}</span>
          </Label>
          <Slider value={[width]} min={40} max={240} step={4} onValueChange={(v) => setWidth(v[0])} />
        </div>

        <div className="space-y-2">
          <Label className="flex justify-between">
            <span>Contrast</span>
            <span className="text-muted-foreground tabular-nums">{contrast}</span>
          </Label>
          <Slider
            value={[contrast]}
            min={-100}
            max={100}
            step={1}
            onValueChange={(v) => setContrast(v[0])}
          />
        </div>

        <div className="space-y-2">
          <Label className="flex justify-between">
            <span>Brightness</span>
            <span className="text-muted-foreground tabular-nums">{brightness}</span>
          </Label>
          <Slider
            value={[brightness]}
            min={-100}
            max={100}
            step={1}
            onValueChange={(v) => setBrightness(v[0])}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="invert">Invert colors</Label>
          <Switch id="invert" checked={invert} onCheckedChange={setInvert} />
        </div>

        <Button variant="outline" size="sm" onClick={reset} className="w-full">
          <RotateCcw className="h-4 w-4 mr-2" /> Reset settings
        </Button>
      </Card>

      <Card className="p-4 flex flex-col min-h-[500px]">
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <h3 className="font-semibold text-sm">Live preview</h3>
          <div className="flex gap-1.5 flex-wrap">
            <Button size="sm" variant="outline" onClick={handleCopy} disabled={!ascii}>
              <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
            </Button>
            <Button size="sm" variant="outline" onClick={handleDownloadTxt} disabled={!ascii}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> TXT
            </Button>
            <Button size="sm" variant="outline" onClick={handleDownloadPng} disabled={!ascii}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> PNG
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!ascii}>
              <Save className="h-3.5 w-3.5 mr-1.5" /> Save
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto rounded-md bg-secondary/40 p-4">
          {ascii ? (
            <pre className="ascii-output text-foreground">{ascii}</pre>
          ) : (
            <div className="h-full grid place-items-center text-center text-muted-foreground text-sm">
              <div>
                <Upload className="h-10 w-10 mx-auto mb-3 opacity-30" />
                Upload an image to see ASCII art here
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
