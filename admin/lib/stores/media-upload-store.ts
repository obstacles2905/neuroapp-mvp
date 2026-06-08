import type {
  MediaUploadJob,
  MediaUploadToast,
} from '@/lib/types/media-upload-job';
import { create } from 'zustand';

type MediaUploadState = {
  jobs: MediaUploadJob[];
  toasts: MediaUploadToast[];
  addJob: (job: MediaUploadJob) => void;
  updateJob: (id: string, patch: Partial<MediaUploadJob>) => void;
  pushToast: (toast: MediaUploadToast) => void;
  dismissToast: (id: string) => void;
};

export const useMediaUploadStore = create<MediaUploadState>((set) => ({
  jobs: [],
  toasts: [],
  addJob: (job) =>
    set((state) => ({
      jobs: [job, ...state.jobs].slice(0, 20),
    })),
  updateJob: (id, patch) =>
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === id ? { ...job, ...patch } : job,
      ),
    })),
  pushToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, toast].slice(-4),
    })),
  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}));
