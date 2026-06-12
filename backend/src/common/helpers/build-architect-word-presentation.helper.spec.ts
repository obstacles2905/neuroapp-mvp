import { ArchitectWordVideo } from '../entity/architect-word-video.entity';
import { buildArchitectWordPresentation } from './build-architect-word-presentation.helper';

function video(
  id: string,
  symptomId: string,
  slot: number,
  s3Key: string,
): ArchitectWordVideo {
  return {
    id,
    symptomId,
    slot,
    s3Key,
    isPublished: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as ArchitectWordVideo;
}

describe('buildArchitectWordPresentation', () => {
  it('returns empty when no symptoms', () => {
    const result = buildArchitectWordPresentation({
      prioritizedSymptomIds: [],
      videosBySymptomId: new Map(),
      snapshot: null,
    });
    expect(result.blocks).toEqual([]);
    expect(result.snapshot).toBeNull();
  });

  it('picks published slots per symptom and shuffles blocks', () => {
    const s1 = 'symptom-1';
    const s2 = 'symptom-2';
    const map = new Map<string, ArchitectWordVideo[]>([
      [
        s1,
        [video('v1', s1, 1, 'a.mp4'), video('v2', s1, 2, 'b.mp4')],
      ],
      [s2, [video('v4', s2, 1, 'd.mp4'), video('v5', s2, 2, 'e.mp4')]],
    ]);

    const result = buildArchitectWordPresentation({
      prioritizedSymptomIds: [s1, s2],
      videosBySymptomId: map,
      snapshot: null,
    });

    expect(result.blocks).toHaveLength(2);
    for (const block of result.blocks) {
      expect(block.slides).toHaveLength(2);
      expect(block.slides[0]!.slot).toBeLessThan(block.slides[1]!.slot);
    }
    expect(result.snapshot?.blocks).toHaveLength(2);
  });

  it('restores order from snapshot', () => {
    const s1 = 'symptom-1';
    const s2 = 'symptom-2';
    const map = new Map<string, ArchitectWordVideo[]>([
      [s1, [video('v1', s1, 1, 'a.mp4'), video('v2', s1, 2, 'b.mp4')]],
      [s2, [video('v3', s2, 1, 'c.mp4'), video('v4', s2, 2, 'd.mp4')]],
    ]);
    const snapshot = {
      blocks: [
        { symptomId: s2, videoIds: ['v3', 'v4'] },
        { symptomId: s1, videoIds: ['v1', 'v2'] },
      ],
    };

    const result = buildArchitectWordPresentation({
      prioritizedSymptomIds: [s1, s2],
      videosBySymptomId: map,
      snapshot,
    });

    expect(result.blocks.map((b) => b.symptomId)).toEqual([s2, s1]);
    expect(result.snapshot).toEqual(snapshot);
  });
});
