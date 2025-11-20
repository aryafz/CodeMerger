export interface UploadedFile {
  name: string;
  content: string;
  size: number;
  type: string;
}

export interface MergeOptions {
  headerTemplate: string;
}
