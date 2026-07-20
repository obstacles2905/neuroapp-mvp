import { type ConfigPlugin, createRunOncePlugin } from '@expo/config-plugins';

import { android } from './android';
import { ios } from './ios';
import type { NeuroFaceLandmarkerPluginProps } from './PluginProps';

const withNeuroFaceLandmarker: ConfigPlugin<NeuroFaceLandmarkerPluginProps> = (
  config,
  props,
) => {
  const { assetsPaths = [] } = props || {};

  if (assetsPaths.length === 0) {
    console.warn('⚠️ [neuro-face-landmarker] No assetsPaths provided to config plugin');
    return config;
  }

  config = android.withAssets(config, props);
  config = ios.withAssets(config, props);
  return config;
};

export default createRunOncePlugin(withNeuroFaceLandmarker, 'neuro-face-landmarker', '0.1.0');
