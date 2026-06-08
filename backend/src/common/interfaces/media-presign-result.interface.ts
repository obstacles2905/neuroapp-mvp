export interface MediaPresignResult {
  uploadUrl: string;
  s3Key: string;
  url: string;
  method: 'PUT';
  headers: Record<string, string>;
}
