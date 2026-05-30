import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/**
 * Нормализованное изображение позы: EXIF Orientation запечён в пиксели,
 * тег ориентации сброшен; URI и размеры лежат в одной системе координат
 * с тем, что отобразит `<Image />` и что увидит MediaPipe-инференс.
 */
export type PoseNormalizedImage = Readonly<{
  height: number;
  uri: string;
  width: number;
}>;

const NORMALIZE_COMPRESS_QUALITY = 0.92;

/**
 * Применяет EXIF Orientation к пикселям JPEG и пересохраняет файл уже «прямым»
 * (тег ориентации больше не нужен, ширина/высота — финальные).
 *
 * Зачем: MediaPipe Pose Landmarker на Android декодирует bitmap через BitmapFactory
 * без EXIF, а `<Image />` в RN при отображении ориентацию учитывает. Если оставить
 * исходный JPEG, координаты ландмарков и пикселей картинки живут в разных
 * системах — отсюда «скелет в воздухе» и «растянутая фотка».
 */
export async function poseNormalizeImageOrientation(
  sourceUri: string,
): Promise<PoseNormalizedImage> {
  const ctx = ImageManipulator.manipulate(sourceUri);
  const ref = await ctx.renderAsync();
  const saved = await ref.saveAsync({
    compress: NORMALIZE_COMPRESS_QUALITY,
    format: SaveFormat.JPEG,
  });
  return {
    height: saved.height,
    uri: saved.uri,
    width: saved.width,
  };
}
