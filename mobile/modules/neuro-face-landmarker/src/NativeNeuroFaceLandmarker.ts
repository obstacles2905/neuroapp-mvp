import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  detectOnImage(
    imagePath: string,
    numFaces: number,
    minFaceDetectionConfidence: number,
    minFacePresenceConfidence: number,
    minTrackingConfidence: number,
    model: string,
    delegate: number,
  ): Promise<{
    inferenceTime: number;
    inputImageHeight: number;
    inputImageWidth: number;
    results: Array<{
      faceBlendshapes: Array<{
        categories: Array<{ categoryName?: string; label?: string; score: number }>;
      }>;
    }>;
  }>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NeuroFaceLandmarker');
