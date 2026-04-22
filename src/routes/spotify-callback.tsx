import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { exchangeCode } from "@/lib/spotify";

export const Route = createFileRoute("/spotify-callback")({
  head: () => ({
    meta: [{ title: "Connecting to Spotify…" }],
  }),
  component: Callback,
});

function Callback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const err = params.get("error");
    if (err) {
      setError(err);
      return;
    }
    if (!code) {
      setError("No authorization code returned");
      return;
    }
    exchangeCode(code)
      .then(() => navigate({ to: "/" }))
      .catch((e) => setError((e as Error).message));
  }, [navigate]);

  return (
    <div className="min-h-screen grid place-items-center bg-background p-4">
      <div className="text-center max-w-md">
        {error ? (
          <>
            <h1 className="text-xl font-bold text-destructive">Spotify login failed</h1>
            <p className="text-sm text-muted-foreground mt-2 break-words">{error}</p>
            <a href="/" className="inline-block mt-4 text-primary underline text-sm">
              Back to app
            </a>
          </>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">Connecting to Spotify…</p>
          </>
        )}
      </div>
    </div>
  );
}
