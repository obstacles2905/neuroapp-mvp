import type { UploadMediaResult } from '@/lib/api/upload-media';

export type MediaUploadJobStatus = 'uploading' | 'success' | 'error';

export type MediaUploadJob = {
  id: string;
  fileName: string;
  folder: 'videos' | 'animations' | 'architect-word';
  status: MediaUploadJobStatus;
  returnPath: string;
  errorMessage?: string;
  result?: UploadMediaResult;
  createdAt: number;
};

export type MediaUploadToast = {
  id: string;
  variant: 'info' | 'success' | 'error';
  title: string;
  message: string;
  returnPath?: string;
};

export type EnqueueMediaUploadInput = {
  file: File;
  folder: 'videos' | 'animations' | 'architect-word';
  returnPath: string;
  onLocalSuccess?: (result: UploadMediaResult) => void;
  onPersist?: (result: UploadMediaResult) => Promise<void>;
};
