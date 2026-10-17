/** Encodes an `owner/name` pair for use in an API path. */
export function repoPath(owner: string, name: string): string {
  return `${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
}
