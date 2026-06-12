import {
  ARCHITECT_WORD_DELIVERY_COUNT,
  ARCHITECT_WORD_SLOT_NUMBERS,
} from '../constants/architect-word.constants';
import type { ArchitectWordVideo } from '../entity/architect-word-video.entity';
import type {
  ArchitectWordPlaylistSnapshot,
  ArchitectWordPlaylistSnapshotBlock,
} from '../types/architect-word-playlist-snapshot.type';
import { shuffleArrayInPlace } from './shuffle-array-in-place.helper';

export type ArchitectWordPresentationSlide = {
  id: string;
  symptomId: string;
  slot: number;
  s3Key: string;
};

export type ArchitectWordPresentationBlock = {
  symptomId: string;
  slides: ArchitectWordPresentationSlide[];
};

type BuildArchitectWordPresentationInput = {
  prioritizedSymptomIds: string[];
  videosBySymptomId: Map<string, ArchitectWordVideo[]>;
  snapshot: ArchitectWordPlaylistSnapshot | null;
};

type BuildArchitectWordPresentationResult = {
  blocks: ArchitectWordPresentationBlock[];
  snapshot: ArchitectWordPlaylistSnapshot | null;
};

function isDeliverableVideo(row: ArchitectWordVideo): boolean {
  return (
    row.isPublished &&
    row.s3Key != null &&
    row.s3Key.trim().length > 0
  );
}

function pickDeliveryVideos(rows: ArchitectWordVideo[]): ArchitectWordVideo[] {
  const ordered = [...rows]
    .filter(isDeliverableVideo)
    .sort((a, b) => a.slot - b.slot);
  return ordered.slice(0, ARCHITECT_WORD_DELIVERY_COUNT);
}

function buildBlockFromVideos(
  symptomId: string,
  videos: ArchitectWordVideo[],
): ArchitectWordPresentationBlock | null {
  const picked = pickDeliveryVideos(videos);
  if (picked.length === 0) {
    return null;
  }
  return {
    symptomId,
    slides: picked.map((row) => ({
      id: row.id,
      symptomId: row.symptomId,
      slot: row.slot,
      s3Key: row.s3Key!,
    })),
  };
}

function buildFreshBlocks(
  prioritizedSymptomIds: string[],
  videosBySymptomId: Map<string, ArchitectWordVideo[]>,
): ArchitectWordPresentationBlock[] {
  const blocks: ArchitectWordPresentationBlock[] = [];
  for (const symptomId of prioritizedSymptomIds) {
    const rows = videosBySymptomId.get(symptomId) ?? [];
    const block = buildBlockFromVideos(symptomId, rows);
    if (block != null) {
      blocks.push(block);
    }
  }
  shuffleArrayInPlace(blocks);
  return blocks;
}

function blocksFromSnapshot(
  snapshot: ArchitectWordPlaylistSnapshot,
  videosBySymptomId: Map<string, ArchitectWordVideo[]>,
): ArchitectWordPresentationBlock[] {
  const videoById = new Map<string, ArchitectWordVideo>();
  for (const rows of videosBySymptomId.values()) {
    for (const row of rows) {
      videoById.set(row.id, row);
    }
  }

  const blocks: ArchitectWordPresentationBlock[] = [];
  for (const snapBlock of snapshot.blocks) {
    const slides: ArchitectWordPresentationSlide[] = [];
    for (const videoId of snapBlock.videoIds) {
      const row = videoById.get(videoId);
      if (row == null || !isDeliverableVideo(row)) {
        continue;
      }
      slides.push({
        id: row.id,
        symptomId: row.symptomId,
        slot: row.slot,
        s3Key: row.s3Key!,
      });
    }
    if (slides.length === 0) {
      continue;
    }
    blocks.push({ symptomId: snapBlock.symptomId, slides });
  }
  return blocks;
}

function snapshotFromBlocks(
  blocks: ArchitectWordPresentationBlock[],
): ArchitectWordPlaylistSnapshot {
  return {
    blocks: blocks.map(
      (block): ArchitectWordPlaylistSnapshotBlock => ({
        symptomId: block.symptomId,
        videoIds: block.slides.map((slide) => slide.id),
      }),
    ),
  };
}

export function buildArchitectWordPresentation(
  input: BuildArchitectWordPresentationInput,
): BuildArchitectWordPresentationResult {
  if (input.prioritizedSymptomIds.length === 0) {
    return { blocks: [], snapshot: null };
  }

  if (input.snapshot != null && input.snapshot.blocks.length > 0) {
    const blocks = blocksFromSnapshot(input.snapshot, input.videosBySymptomId);
    if (blocks.length > 0) {
      return { blocks, snapshot: input.snapshot };
    }
  }

  const blocks = buildFreshBlocks(
    input.prioritizedSymptomIds,
    input.videosBySymptomId,
  );
  if (blocks.length === 0) {
    return { blocks: [], snapshot: null };
  }

  return {
    blocks,
    snapshot: snapshotFromBlocks(blocks),
  };
}

export function emptyArchitectWordSlots(): number[] {
  return [...ARCHITECT_WORD_SLOT_NUMBERS];
}
