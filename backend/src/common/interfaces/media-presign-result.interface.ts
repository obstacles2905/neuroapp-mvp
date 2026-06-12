export interface MediaPresignResult {
  uploadUrl: string;
  s3Key: string;
  url: string;
  method: 'PUT';
  headers: Record<string, string>;
  /** true — файл с таким именем уже в бакете, повторная загрузка не нужна */
  deduplicated?: boolean;
}
