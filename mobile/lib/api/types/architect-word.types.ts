export type ArchitectWordSlide = {
  id: string;
  symptomId: string;
  symptomTitle: string;
  slot: number;
  mediaUrl: string;
};

export type ArchitectWordBlock = {
  symptomId: string;
  symptomTitle: string;
  slides: ArchitectWordSlide[];
};

export type ArchitectWordPresentation = {
  blocks: ArchitectWordBlock[];
  slides: ArchitectWordSlide[];
  skip: boolean;
};
