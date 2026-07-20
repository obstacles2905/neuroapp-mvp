package com.neurofacelandmarker

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import com.neurofacelandmarker.facelandmark.FaceLandmarkerHelper
import com.neurofacelandmarker.facelandmark.convertResultBundleToWritableMap
import com.neurofacelandmarker.shared.loadBitmapFromPath

@ReactModule(name = NeuroFaceLandmarkerModule.NAME)
class NeuroFaceLandmarkerModule(reactContext: ReactApplicationContext) :
  NativeNeuroFaceLandmarkerSpec(reactContext) {

  override fun getName(): String = NAME

  override fun detectOnImage(
    imagePath: String,
    numFaces: Double,
    minFaceDetectionConfidence: Double,
    minFacePresenceConfidence: Double,
    minTrackingConfidence: Double,
    model: String,
    delegate: Double,
    promise: Promise,
  ) {
    try {
      val helper =
        FaceLandmarkerHelper(
          maxNumFaces = numFaces.toInt(),
          minFaceDetectionConfidence = minFaceDetectionConfidence.toFloat(),
          minFacePresenceConfidence = minFacePresenceConfidence.toFloat(),
          minFaceTrackingConfidence = minTrackingConfidence.toFloat(),
          currentDelegate = delegate.toInt(),
          currentModel = model,
          context = reactApplicationContext.applicationContext,
        )
      val bitmap = loadBitmapFromPath(imagePath)
      val bundle = helper.detectImage(bitmap)
      promise.resolve(convertResultBundleToWritableMap(bundle))
    } catch (e: Exception) {
      promise.reject("DETECT_IMAGE_ERROR", "Failed to detect face on image: ${e.message}", e)
    }
  }

  companion object {
    const val NAME = "NeuroFaceLandmarker"
  }
}
