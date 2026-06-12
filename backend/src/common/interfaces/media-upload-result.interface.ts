export interface MediaUploadResult {
  s3Key: string;
  url: string;
  /** true — переиспользован существующий объект в бакете */
  deduplicated?: boolean;
}
