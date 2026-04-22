import { useEffect, useState } from "react";
import { Trash2, Copy, Download, ImageIcon, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  loadGallery,
  removeFromGallery,
  clearGallery,
  type SavedArt,
} from "@/lib/storage";
import { downloadBlob, asciiToPng } from "@/lib/ascii";

interface Props {
  refreshKey: number;
}

export function Gallery({ refreshKey }: Props) {
  const [items, setItems] = useState<SavedArt[]>([]);

  useEffect(() => {
    setItems(loadGallery());
  }, [refreshKey]);

  const handleDelete = (id: string) => {
    setItems(removeFromGallery(id));
    toast.success("Deleted");
  };

  const handleClear = () => {
    clearGallery();
    setItems([]);
    toast.success("Gallery cleared");
  };

  const handleCopy = async (ascii: string) => {
    await navigator.clipboard.writeText(ascii);
    toast.success("Copied");
  };

  const handleDownload = (item: SavedArt) => {
    downloadBlob(new Blob([item.ascii], { type: "text/plain" }), `${item.title}.txt`);
  };

  const handlePng = async (item: SavedArt) => {
    const isDark = document.documentElement.classList.contains("dark");
    const blob = await asciiToPng(item.ascii, isDark);
    downloadBlob(blob, `${item.title}.png`);
  };

  if (items.length === 0) {
    return (
      <Card className="p-12 text-center text-muted-foreground">
        <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">Your saved ASCII creations will appear here</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{items.length} saved</p>
        <Button variant="outline" size="sm" onClick={handleClear}>
          <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Clear all
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Card key={item.id} className="p-3 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {item.type === "image" ? (
                <ImageIcon className="h-3.5 w-3.5" />
              ) : (
                <Type className="h-3.5 w-3.5" />
              )}
              <span className="font-medium text-foreground truncate flex-1">{item.title}</span>
              <span>{new Date(item.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="rounded-md bg-secondary/50 h-40 overflow-hidden p-2">
              <pre className="ascii-output" style={{ fontSize: "4px" }}>
                {item.ascii}
              </pre>
            </div>
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => handleCopy(item.ascii)}>
                <Copy className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" className="flex-1" onClick={() => handleDownload(item)}>
                <Download className="h-3 w-3" /> TXT
              </Button>
              <Button size="sm" variant="outline" className="flex-1" onClick={() => handlePng(item)}>
                <Download className="h-3 w-3" /> PNG
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => handleDelete(item.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
