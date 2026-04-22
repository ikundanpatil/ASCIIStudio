import { useEffect, useMemo, useState } from "react";
import { Copy, Save, Download, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { FIGLET_FONTS, type FigletFontKey, alignText } from "@/lib/figlet-fonts";
import { addToGallery } from "@/lib/storage";
import { downloadBlob, asciiToPng } from "@/lib/ascii";

interface Props {
  onSaved: () => void;
}

export function TextToAscii({ onSaved }: Props) {
  const [text, setText] = useState("HELLO");
  const [font, setFont] = useState<FigletFontKey>("fancy");
  const [alignment, setAlignment] = useState<"left" | "center" | "right">("left");
  const [size, setSize] = useState(12);
  const [ascii, setAscii] = useState("");

  useEffect(() => {
    if (!text.trim()) {
      setAscii("");
      return;
    }
    try {
      const rendered = FIGLET_FONTS[font].render(text);
      setAscii(alignText(rendered, alignment));
    } catch {
      setAscii("");
    }
  }, [text, font, alignment]);

  const fontStyle = useMemo(() => ({ fontSize: `${size}px`, lineHeight: 1.05 }), [size]);

  const handleCopy = async () => {
    if (!ascii) return;
    await navigator.clipboard.writeText(ascii);
    toast.success("Copied to clipboard");
  };

  const handleSave = () => {
    if (!ascii) return;
    addToGallery({ type: "text", title: text.slice(0, 32), ascii });
    toast.success("Saved to gallery");
    onSaved();
  };

  const handleDownloadPng = async () => {
    if (!ascii) return;
    const isDark = document.documentElement.classList.contains("dark");
    const blob = await asciiToPng(ascii, isDark);
    downloadBlob(blob, `${text.slice(0, 20) || "text"}.png`);
  };

  const handleDownloadTxt = () => {
    if (!ascii) return;
    downloadBlob(new Blob([ascii], { type: "text/plain" }), `${text.slice(0, 20) || "text"}.txt`);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <Card className="p-5 space-y-5 h-fit">
        <div className="space-y-2">
          <Label htmlFor="text-input">Text</Label>
          <Input
            id="text-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type something…"
            maxLength={30}
          />
          <p className="text-xs text-muted-foreground">{text.length}/30 characters</p>
        </div>

        <div className="space-y-2">
          <Label>Font</Label>
          <Select value={font} onValueChange={(v) => setFont(v as FigletFontKey)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FIGLET_FONTS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Alignment</Label>
          <ToggleGroup
            type="single"
            value={alignment}
            onValueChange={(v) => v && setAlignment(v as "left" | "center" | "right")}
            className="justify-start"
          >
            <ToggleGroupItem value="left" aria-label="Left">
              <AlignLeft className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="center" aria-label="Center">
              <AlignCenter className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="right" aria-label="Right">
              <AlignRight className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="space-y-2">
          <Label className="flex justify-between">
            <span>Display size</span>
            <span className="text-muted-foreground tabular-nums">{size}px</span>
          </Label>
          <Slider value={[size]} min={8} max={28} step={1} onValueChange={(v) => setSize(v[0])} />
        </div>

        <div className="space-y-2">
          <Label>Quick presets</Label>
          <div className="flex flex-wrap gap-1.5">
            {["HELLO", "LOVE", "ASCII", "SPOTIFY", "2024"].map((p) => (
              <Button key={p} size="sm" variant="outline" onClick={() => setText(p)}>
                {p}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-4 flex flex-col min-h-[500px]">
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <h3 className="font-semibold text-sm">Preview</h3>
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
        <div className="flex-1 overflow-auto rounded-md bg-secondary/40 p-6">
          {ascii ? (
            <pre className="font-mono text-foreground whitespace-pre" style={fontStyle}>
              {ascii}
            </pre>
          ) : (
            <div className="h-full grid place-items-center text-muted-foreground text-sm">
              Type to see ASCII text
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
