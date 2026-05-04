import type { BiometricsMetric } from '../enums/biometrics-metric.enum';
import type { BiometricsPhase } from '../enums/biometrics-phase.enum';

export interface BiometricsStepContent {
  phase: BiometricsPhase;
  metric: BiometricsMetric;
}
