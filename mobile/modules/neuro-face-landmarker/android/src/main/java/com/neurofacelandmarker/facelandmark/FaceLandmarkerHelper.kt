package com.neurofacelandmarker.facelandmark

import android.content.Context
import android.graphics.Bitmap
import android.os.SystemClock
import android.util.Log
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.core.Delegate
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.facelandmarker.FaceLandmarker
import com.google.mediapipe.tasks.vision.facelandmarker.FaceLandmarkerResult

class FaceLandmarkerHelper(
  var minFaceDetectionConfidence: Float = DEFAULT_FACE_DETECTION_CONFIDENCE,
  var minFaceTrackingConfidence: Float = DEFAULT_FACE_TRACKING_CONFIDENCE,
  var minFacePresenceConfidence: Float = DEFAULT_FACE_PRESENCE_CONFIDENCE,
  var maxNumFaces: Int = DEFAULT_NUM_FACES,
  var currentDelegate: Int = DELEGATE_CPU,
  var currentModel: String,
  val context: Context,
) {
  private var faceLandmarker: FaceLandmarker? = null

  init {
    setupFaceLandmarker()
  }

  private fun setupFaceLandmarker() {
    val baseOptionBuilder = BaseOptions.builder()
    when (currentDelegate) {
      DELEGATE_CPU -> baseOptionBuilder.setDelegate(Delegate.CPU)
      DELEGATE_GPU -> baseOptionBuilder.setDelegate(Delegate.GPU)
    }
    baseOptionBuilder.setModelAssetPath(currentModel)

    try {
      val options =
        FaceLandmarker.FaceLandmarkerOptions.builder()
          .setBaseOptions(baseOptionBuilder.build())
          .setMinFaceDetectionConfidence(minFaceDetectionConfidence)
          .setMinTrackingConfidence(minFaceTrackingConfidence)
          .setMinFacePresenceConfidence(minFacePresenceConfidence)
          .setNumFaces(maxNumFaces)
          .setOutputFaceBlendshapes(true)
          .setRunningMode(RunningMode.IMAGE)
          .build()
      faceLandmarker = FaceLandmarker.createFromOptions(context, options)
    } catch (e: Exception) {
      Log.e(TAG, "Face Landmarker init failed: ${e.message}")
      throw e
    }
  }

  fun detectImage(image: Bitmap): ResultBundle {
    val startTime = SystemClock.uptimeMillis()
    val mpImage = BitmapImageBuilder(image).build()
    val landmarkResult =
      faceLandmarker?.detect(mpImage)
        ?: throw IllegalStateException("Face Landmarker failed to detect.")

    val inferenceTimeMs = SystemClock.uptimeMillis() - startTime
    return ResultBundle(
      results = listOf(landmarkResult),
      inferenceTime = inferenceTimeMs,
      inputImageHeight = image.height,
      inputImageWidth = image.width,
    )
  }

  data class ResultBundle(
    val results: List<FaceLandmarkerResult>,
    val inferenceTime: Long,
    val inputImageHeight: Int,
    val inputImageWidth: Int,
  )

  companion object {
    const val TAG = "FaceLandmarkerHelper"
    const val DELEGATE_CPU = 0
    const val DELEGATE_GPU = 1
    const val DEFAULT_FACE_DETECTION_CONFIDENCE = 0.5F
    const val DEFAULT_FACE_TRACKING_CONFIDENCE = 0.5F
    const val DEFAULT_FACE_PRESENCE_CONFIDENCE = 0.5F
    const val DEFAULT_NUM_FACES = 1
  }
}
