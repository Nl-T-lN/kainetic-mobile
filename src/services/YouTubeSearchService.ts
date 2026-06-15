import { SearchResult, Track } from '@/types/music';

export function getHighResThumbnail(thumbnails: any): string {
  if (!thumbnails) return "";
  
  let thumbArray = thumbnails;
  if (typeof thumbnails === 'object' && !Array.isArray(thumbnails)) {
    if (thumbnails.contents && Array.isArray(thumbnails.contents)) {
      thumbArray = thumbnails.contents;
    } else if (thumbnails.thumbnails && Array.isArray(thumbnails.thumbnails)) {
      thumbArray = thumbnails.thumbnails;
    } else if (thumbnails.url) {
      thumbArray = [thumbnails];
    } else {
      thumbArray = [thumbnails];
    }
  } else if (!Array.isArray(thumbnails)) {
    thumbArray = [thumbnails];
  }

  if (!Array.isArray(thumbArray) || thumbArray.length === 0) return "";
  
  const sorted = [...thumbArray].sort((a, b) => (b.width || 0) - (a.width || 0));
  if (!sorted[0] || !sorted[0].url) return "";
  
  let url = sorted[0].url;

  if (url.includes("googleusercontent.com") || url.includes("yt3.ggpht.com")) {
    url = url.replace(/=[ws]\d+(?:-h\d+)?(?:-[a-zA-Z0-9_-]+)*/, "=w1200-h1200");
  } else if (url.includes("i.ytimg.com")) {
    url = url.replace("maxresdefault.jpg", "hqdefault.jpg");
  }
  
  if (url.startsWith('//')) {
    url = 'https:' + url;
  }

  return url;
}

const SEARCH_API = 'https://music.youtube.com/youtubei/v1/search';

const WEB_CLIENT_PAYLOAD = {
  clientName: 'WEB_REMIX',
  clientVersion: '1.20231214.00.00',
  hl: 'en',
  gl: 'US',
};

function findKeys(obj: any, key: string, results: any[] = []) {
  if (typeof obj !== 'object' || obj === null) return;
  if (obj.hasOwnProperty(key)) {
    results.push(obj[key]);
  }
  for (const k in obj) {
    if (obj.hasOwnProperty(k)) {
      findKeys(obj[k], key, results);
    }
  }
  return results;
}

export class YouTubeSearchService {
  static async search(query: string, type: 'song' | 'artist' | 'album' | 'playlist' | 'all' = 'song'): Promise<SearchResult[]> {
    try {
      let params = '';
      if (type === 'song') params = 'Eg-KAQwIARAO';
      if (type === 'album') params = 'Eg-KAQwIARAB';
      if (type === 'artist') params = 'Eg-KAQwIARAW';
      if (type === 'playlist') params = 'Eg-KAQwIARAw';

      const response = await fetch(SEARCH_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
          'X-YouTube-Client-Name': '67',
          'X-YouTube-Client-Version': WEB_CLIENT_PAYLOAD.clientVersion,
          'Origin': 'https://music.youtube.com',
          'Referer': 'https://music.youtube.com/',
        },
        body: JSON.stringify({
          context: { client: WEB_CLIENT_PAYLOAD },
          query: query,
          params: params ? params : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`Search failed with status ${response.status}`);
      }

      const data = await response.json();
      const renderers = findKeys(data, 'musicResponsiveListItemRenderer') || [];
      const results: SearchResult[] = [];

      for (const renderer of renderers) {
        let videoId = 
          renderer.playlistItemData?.videoId ||
          renderer.navigationEndpoint?.watchEndpoint?.videoId ||
          renderer.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.videoId;

        let browseId = renderer.navigationEndpoint?.browseEndpoint?.browseId;
        
        const id = (type === 'song' || type === 'all') ? videoId : browseId;
        if (!id) continue;

        // If type is 'all', determine the type from the browse endpoint or existence of videoId
        let resultType = type;
        if (type === 'all') {
            if (browseId?.startsWith('UC')) resultType = 'artist';
            else if (browseId?.startsWith('MPRE')) resultType = 'album';
            else if (browseId?.startsWith('VL')) resultType = 'playlist';
            else if (videoId) resultType = 'song';
            else continue;
        }

        const titleRuns = renderer.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs;
        const title = titleRuns?.[0]?.text || 'Unknown Title';

        const subtitleRuns = renderer.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
        let subtitle = 'Unknown';
        let durationMs = 0;
        
        if (subtitleRuns.length > 0) {
          const rawSubtitle = subtitleRuns.map((r: any) => r.text).join('');
          // Try to extract time at the end: "Artist • Album • 3:45"
          const match = rawSubtitle.match(/(.*?)\s*•\s*(\d+:\d{2})$/);
          if (match) {
            subtitle = match[1].trim();
            const timeParts = match[2].split(':');
            durationMs = (parseInt(timeParts[0]) * 60 + parseInt(timeParts[1])) * 1000;
          } else {
            subtitle = rawSubtitle;
          }
        }

        const thumbnailUrl = getHighResThumbnail(renderer.thumbnail?.musicThumbnailRenderer?.thumbnail);

        results.push({
          videoId: videoId,
          id: browseId,
          title: title,
          channelTitle: subtitle, 
          thumbnailUrl: thumbnailUrl,
          type: resultType as any,
          durationMs: durationMs,
        });
      }

      return results;

    } catch (error) {
      console.error('[YouTubeSearchService] Error:', error);
      return [];
    }
  }

  static async getUpNext(videoId: string): Promise<Track[]> {
    try {
      const response = await fetch('https://music.youtube.com/youtubei/v1/next', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
          'Origin': 'https://music.youtube.com',
        },
        body: JSON.stringify({
          context: { client: WEB_CLIENT_PAYLOAD },
          videoId: videoId,
          playlistId: "RDAMVM" + videoId
        }),
      });

      if (!response.ok) return [];

      const data = await response.json();
      const renderers = findKeys(data, 'playlistPanelVideoRenderer') || [];
      const tracks: Track[] = [];

      for (const renderer of renderers) {
        if (!renderer.videoId) continue;
        
        const titleRuns = renderer.title?.runs || [];
        const title = titleRuns.map((r: any) => r.text).join('') || 'Unknown Title';
        
        const subtitleRuns = renderer.longBylineText?.runs || [];
        let artist = 'Unknown Artist';
        if (subtitleRuns.length > 0) {
           artist = subtitleRuns.map((r: any) => r.text).join('');
        }
        
        let durationMs = 0;
        const lengthText = renderer.lengthText?.runs?.[0]?.text;
        if (lengthText && /^\d+:\d{2}$/.test(lengthText)) {
            const parts = lengthText.split(':');
            durationMs = (parseInt(parts[0]) * 60 + parseInt(parts[1])) * 1000;
        }

        tracks.push({
          videoId: renderer.videoId,
          title,
          artist,
          thumbnailUrl: getHighResThumbnail(renderer.thumbnail),
          durationMs
        });
      }

      // Filter out the seed track if it's the first one
      return tracks.filter(t => t.videoId !== videoId);
    } catch (e) {
      console.error('[YouTubeSearchService] getUpNext Error:', e);
      return [];
    }
  }
}
