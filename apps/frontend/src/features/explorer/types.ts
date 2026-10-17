export interface FileTreeEntry {
  path: string;
  type: string;
  size: number;
}

export interface FileContent {
  path: string;
  sha: string;
  size: number;
  content: string;
  truncated: boolean;
}
