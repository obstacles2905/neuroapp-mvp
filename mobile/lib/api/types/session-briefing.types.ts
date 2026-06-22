export type SessionBriefingPhase = 'greeting' | 'final-word';

export type SessionBriefingSlide = {
  id: string;
  mediaUrl: string;
};

export type SessionBriefingPresentation = {
  slide: SessionBriefingSlide | null;
};
