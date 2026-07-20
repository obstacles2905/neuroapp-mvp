import path from 'path';
import {
  withXcodeProject,
  IOSConfig,
  type ConfigPlugin,
} from '@expo/config-plugins';
import { copyFileSync, ensureDirSync, readdirSync } from 'fs-extra';

import type { NeuroFaceLandmarkerPluginProps } from './PluginProps';

export const withAssets: ConfigPlugin<NeuroFaceLandmarkerPluginProps> = (config, props) => {
  const { assetsPaths = [], ignoredPattern } = props || {};

  return withXcodeProject(config, async (cfg) => {
    const { projectRoot, platformProjectRoot } = cfg.modRequest;
    const project = cfg.modResults;
    const projectName = cfg.modRequest.projectName || 'App';

    ensureDirSync(platformProjectRoot);

    for (const assetSourceDir of assetsPaths) {
      const assetSourcePath = path.join(projectRoot, assetSourceDir);
      let files;
      try {
        files = readdirSync(assetSourcePath, { withFileTypes: true });
      } catch {
        console.warn(`⚠️ [neuro-face-landmarker/iOS] Could not read: ${assetSourcePath}`);
        continue;
      }

      for (const file of files) {
        if (
          file.isFile() &&
          (!ignoredPattern || !file.name.match(new RegExp(ignoredPattern)))
        ) {
          const destPath = path.join(platformProjectRoot, file.name);
          copyFileSync(path.join(assetSourcePath, file.name), destPath);
          console.log(`✅ [neuro-face-landmarker/iOS] Copied ${file.name}`);

          IOSConfig.XcodeUtils.addResourceFileToGroup({
            filepath: file.name,
            groupName: projectName,
            project,
            isBuildFile: true,
            verbose: true,
          });
        }
      }
    }

    return cfg;
  });
};

export const ios = { withAssets };
