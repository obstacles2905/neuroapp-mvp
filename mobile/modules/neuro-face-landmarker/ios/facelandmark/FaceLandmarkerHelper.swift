import Foundation
import MediaPipeTasksVision

struct FaceLandmarkDetectionResultBundle {
  let inferenceTime: Double
  let faceLandmarkDetectorResults: [FaceLandmarkerResult?]
  let size: CGSize
}

class FaceLandmarkerHelper {
  private var faceLandmarker: FaceLandmarker?
  private let numFaces: Int
  private let minFaceDetectionConfidence: Float
  private let minFacePresenceConfidence: Float
  private let minTrackingConfidence: Float
  private let optionsDelegate: Delegate

  init(
    numFaces: Int,
    minFaceDetectionConfidence: Float,
    minFacePresenceConfidence: Float,
    minTrackingConfidence: Float,
    modelName: String,
    delegate: Int
  ) throws {
    self.numFaces = numFaces
    self.minFaceDetectionConfidence = minFaceDetectionConfidence
    self.minFacePresenceConfidence = minFacePresenceConfidence
    self.minTrackingConfidence = minTrackingConfidence
    self.optionsDelegate = convertIntToDelegate(delegate)

    let fileURL = URL(fileURLWithPath: modelName)
    let basename = fileURL.deletingPathExtension().lastPathComponent
    let fileExtension = fileURL.pathExtension
    guard let modelPath = Bundle.main.path(forResource: basename, ofType: fileExtension) else {
      throw NSError(
        domain: "MODEL_NOT_FOUND",
        code: 0,
        userInfo: ["message": "Model \(modelName) not found"]
      )
    }

    let options = FaceLandmarkerOptions()
    options.runningMode = .image
    options.numFaces = numFaces
    options.minFaceDetectionConfidence = minFaceDetectionConfidence
    options.minFacePresenceConfidence = minFacePresenceConfidence
    options.minTrackingConfidence = minTrackingConfidence
    options.outputFaceBlendshapes = true
    options.baseOptions.modelAssetPath = modelPath
    options.baseOptions.delegate = optionsDelegate

    faceLandmarker = try FaceLandmarker(options: options)
  }

  func detect(image: UIImage) -> FaceLandmarkDetectionResultBundle? {
    guard let mpImage = try? MPImage(uiImage: image) else {
      return nil
    }
    do {
      let startDate = Date()
      let result = try faceLandmarker?.detect(image: mpImage)
      let inferenceTime = Date().timeIntervalSince(startDate) * 1000
      return FaceLandmarkDetectionResultBundle(
        inferenceTime: inferenceTime,
        faceLandmarkDetectorResults: [result],
        size: CGSize(width: image.size.width, height: image.size.height)
      )
    } catch {
      return nil
    }
  }
}
