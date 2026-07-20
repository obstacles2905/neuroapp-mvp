import path from 'path';
import { withDangerousMod, type ConfigPlugin } from '@expo/config-plugins';
import { copyFileSync, ensureDirSync, readdirSync } from 'fs-extra';

import type { NeuroFaceLandmarkerPluginProps } from './PluginProps';

export const withAssets: ConfigPlugin<NeuroFaceLandmarkerPluginProps> = (config, props) => {
  const { assetsPaths = [], ignoredPattern } = props || {};

  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const { projectRoot } = cfg.modRequest;
      const assetsDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'assets');
      ensureDirSync(assetsDir);

      for (const assetSourceDir of assetsPaths) {
        const assetSourcePath = path.join(projectRoot, assetSourceDir);
        let files;
        try {
          files = readdirSync(assetSourcePath, { withFileTypes: true });
        } catch {
          console.warn(`⚠️ [neuro-face-landmarker/Android] Could not read: ${assetSourcePath}`);
          continue;
        }

        for (const file of files) {
          if (
            file.isFile() &&
            (!ignoredPattern || !file.name.match(new RegExp(ignoredPattern)))
          ) {
            copyFileSync(
              path.join(assetSourcePath, file.name),
              path.join(assetsDir, file.name),
            );
            console.log(`✅ [neuro-face-landmarker/Android] Copied ${file.name}`);
          }
        }
      }

      return cfg;
    },
  ]);
};

export const android = { withAssets };
