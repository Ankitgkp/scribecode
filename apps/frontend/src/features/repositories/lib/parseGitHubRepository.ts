export function parseGitHubRepository(value: string): { owner: string; name: string } | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const urlValue = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(urlValue);
  } catch {
    return null;
  }

  if (url.hostname.toLowerCase() !== "github.com" || url.username || url.password || url.port) return null;
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length < 2 || segments.length > 2) return null;
  const [owner, rawName] = segments;
  const name = rawName?.replace(/\.git$/i, "");
  if (!owner || !name || !/^[a-z\d](?:[a-z\d-]{0,38})$/i.test(owner) || !/^[\w.-]+$/.test(name)) return null;
  return { owner, name };
}
