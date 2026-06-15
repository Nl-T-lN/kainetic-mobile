import { useState, useEffect } from "react";
import type { Track } from "@/types/music";
import { parseTTML, parseLRC, type ParsedLyricLine } from "@/utils/lyricsParser";

export function useLyrics(currentTrack: Track | null) {
  const [lyrics, setLyrics] = useState<ParsedLyricLine[]>([]);
  const [plainLyrics, setPlainLyrics] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!currentTrack) {
      setLyrics([]);
      setPlainLyrics(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setLyrics([]);
    setPlainLyrics(null);

    const fetchLyrics = async () => {
      try {
        const title = currentTrack.title || "";
        const cleanTitle = title
          .replace(/\(.*?\)|\[.*?\]/g, "")
          .replace(/official|video|lyrics|audio|hd|hq|4k|mv/gi, "")
          .trim();

        const trackAny = currentTrack as any;
        let artistName = trackAny.artists && trackAny.artists.length > 0 
          ? trackAny.artists[0].name 
          : trackAny.artist || trackAny.channelTitle || "";
          
        if (artistName.toLowerCase() === "unknown artist") {
          artistName = "";
        }
        const cleanArtist = artistName.replace(/ - Topic$/i, '').trim();

        // Priority 1: Boidu TTML
        try {
          const boiduRes = await fetch(`https://lyrics-api.boidu.dev/getLyrics?s=${encodeURIComponent(cleanTitle)}${cleanArtist ? `&a=${encodeURIComponent(cleanArtist)}` : ''}`);
          if (boiduRes.ok) {
            const data = await boiduRes.json();
            if (data.ttml) {
              const parsedLines = parseTTML(data.ttml);
              if (parsedLines.length > 0 && isMounted) {
                setLyrics(parsedLines);
                return;
              }
            }
          }
        } catch (e) {
          console.log("Boidu fetch failed", e);
        }

        // Priority 2: LRCLib Synced / Plain
        try {
          const lrclibRes = await fetch(`https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTitle)}${cleanArtist ? `&artist_name=${encodeURIComponent(cleanArtist)}` : ''}`);
          if (lrclibRes.ok) {
            const data = await lrclibRes.json();
            if (Array.isArray(data) && data.length > 0) {
              const syncedMatch = data.find((song: any) => song.syncedLyrics);
              if (syncedMatch && isMounted) {
                setLyrics(parseLRC(syncedMatch.syncedLyrics));
                return;
              }
              const plainMatch = data.find((song: any) => song.plainLyrics);
              if (plainMatch && isMounted) {
                setPlainLyrics(plainMatch.plainLyrics);
                return;
              }
            }
          }
        } catch (e) {
          console.log("LRCLib fetch failed", e);
        }

      } catch (error) {
        console.error("Lyrics error:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchLyrics();

    return () => {
      isMounted = false;
    };
  }, [currentTrack]);

  return { lyrics, plainLyrics, isLoading };
}
