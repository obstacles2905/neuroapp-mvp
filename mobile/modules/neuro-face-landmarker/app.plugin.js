const path = require('path');
const {
  withDangerousMod,
  withXcodeProject,
  IOSConfig,
  createRunOncePlugin,
} = require('@expo/config-plugins');
const { copyFileSync, ensureDirSync, readdirSync } = require('fs-extra');

function withAndroidAssets(config, props) {
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
          console.warn(
            `⚠️ [neuro-face-landmarker/Android] Could not read: ${assetSourcePath}`,
          );
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
}

function withIosAssets(config, props) {
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
}

function withNeuroFaceLandmarker(config, props) {
  const { assetsPaths = [] } = props || {};

  if (assetsPaths.length === 0) {
    console.warn('⚠️ [neuro-face-landmarker] No assetsPaths provided to config plugin');
    return config;
  }

  config = withAndroidAssets(config, props);
  config = withIosAssets(config, props);
  return config;
}

module.exports = createRunOncePlugin(withNeuroFaceLandmarker, 'neuro-face-landmarker', '0.1.0');
