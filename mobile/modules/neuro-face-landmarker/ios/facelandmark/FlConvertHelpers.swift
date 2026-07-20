import Foundation
import MediaPipeTasksVision

func convertFldResultBundleToDictionary(_ resultBundle: FaceLandmarkDetectionResultBundle) -> [String: Any] {
  var map = [String: Any]()

  let resultsArray = resultBundle.faceLandmarkDetectorResults.map { result -> [String: Any] in
    let blendshapes = result?.faceBlendshapes.map(classificationsToDictionary) ?? []
    return ["faceBlendshapes": blendshapes]
  }

  map["results"] = resultsArray
  map["inputImageHeight"] = resultBundle.size.height
  map["inputImageWidth"] = resultBundle.size.width
  map["inferenceTime"] = resultBundle.inferenceTime
  return map
}

func classificationsToDictionary(_ classification: Classifications) -> [String: Any] {
  let categories = classification.categories.map {
    [
      "categoryName": $0.categoryName ?? "",
      "label": $0.categoryName ?? "",
      "score": $0.score,
    ] as [String: Any]
  }
  return ["categories": categories]
}
