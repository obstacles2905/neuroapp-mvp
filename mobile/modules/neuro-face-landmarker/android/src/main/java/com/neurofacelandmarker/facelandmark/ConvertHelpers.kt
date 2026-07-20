package com.neurofacelandmarker.facelandmark

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import com.google.mediapipe.tasks.vision.facelandmarker.FaceLandmarkerResult

fun convertResultBundleToWritableMap(
  resultBundle: FaceLandmarkerHelper.ResultBundle,
): WritableMap {
  val map = Arguments.createMap()
  val resultsArray = Arguments.createArray()
  resultBundle.results.forEach { result ->
    resultsArray.pushMap(faceLandmarkerResultToWritableMap(result))
  }
  map.putArray("results", resultsArray)
  map.putInt("inputImageHeight", resultBundle.inputImageHeight)
  map.putInt("inputImageWidth", resultBundle.inputImageWidth)
  map.putDouble("inferenceTime", resultBundle.inferenceTime.toDouble())
  return map
}

fun faceLandmarkerResultToWritableMap(result: FaceLandmarkerResult): WritableMap {
  val resultMap = WritableNativeMap()
  val blendshapesArray = WritableNativeArray()

  result.faceBlendshapes().ifPresent { classifications ->
    classifications.forEach { classification ->
      val map = WritableNativeMap()
      val categoriesArray = WritableNativeArray()
      classification.forEach { category ->
        val categoryMap = WritableNativeMap()
        val name = category.categoryName()
        categoryMap.putString("categoryName", name)
        categoryMap.putString("label", name)
        categoryMap.putDouble("score", category.score().toDouble())
        categoriesArray.pushMap(categoryMap)
      }
      map.putArray("categories", categoriesArray)
      blendshapesArray.pushMap(map)
    }
  }

  resultMap.putArray("faceBlendshapes", blendshapesArray)
  return resultMap
}
