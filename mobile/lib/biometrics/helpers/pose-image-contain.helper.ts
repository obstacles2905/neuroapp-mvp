/** Прямоугольник съёмки `resizeMode: contain` и смещения внутри контейнера. */
export type PoseImageContainRect = Readonly<{
  drawHeight: number;
  drawWidth: number;
  offsetX: number;
  offsetY: number;
}>;

export function poseComputeImageContainRect(
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number,
): PoseImageContainRect {
  if (
    containerWidth <= 0 ||
    containerHeight <= 0 ||
    imageWidth <= 0 ||
    imageHeight <= 0
  ) {
    return {
      drawHeight: 0,
      drawWidth: 0,
      offsetX: 0,
      offsetY: 0,
    };
  }
  const imageAspect = imageWidth / imageHeight;
  const containerAspect = containerWidth / containerHeight;
  if (containerAspect > imageAspect) {
    const drawHeight = containerHeight;
    const drawWidth = drawHeight * imageAspect;
    return {
      drawHeight,
      drawWidth,
      offsetX: (containerWidth - drawWidth) / 2,
      offsetY: 0,
    };
  }
  const drawWidth = containerWidth;
  const drawHeight = drawWidth / imageAspect;
  return {
    drawHeight,
    drawWidth,
    offsetX: 0,
    offsetY: (containerHeight - drawHeight) / 2,
  };
}

export function poseLandmarkToContainPx(
  lm: Readonly<{ x: number; y: number }>,
  rect: PoseImageContainRect,
): Readonly<{ x: number; y: number }> {
  return {
    x: rect.offsetX + lm.x * rect.drawWidth,
    y: rect.offsetY + lm.y * rect.drawHeight,
  };
}
