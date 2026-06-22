export type SessionBriefingPhase = 'greeting' | 'final-word';

export type SessionBriefingAdminVideo = {
  phase: SessionBriefingPhase;
  id: string | null;
  s3Key: string | null;
  mediaUrl: string | null;
  isPublished: boolean;
};
