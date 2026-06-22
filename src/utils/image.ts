export function getResizedImage(url: string, width: number, height: number = width): string {
  if (!url) return '';
  if (url.includes('googleusercontent.com') || url.includes('yt3.ggpht.com')) {
    return url.replace(/=[ws]\d+(?:-h\d+)?(?:-[a-zA-Z0-9_-]+)*/, `=w${width}-h${height}`);
  }
  return url;
}
