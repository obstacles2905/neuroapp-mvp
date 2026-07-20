import Foundation
import React

@objc(FaceLandmarkModule)
public class FaceLandmarkModule: NSObject {
  @objc public static func requiresMainQueueSetup() -> Bool {
    return false
  }

  @objc public func detectOnImage(
    _ imagePath: String,
    withNumFaces numFaces: NSInteger,
    withMinFaceDetectionConfidence minFaceDetectionConfidence: NSNumber,
    withMinFacePresenceConfidence minFacePresenceConfidence: NSNumber,
    withMinTrackingConfidence minTrackingConfidence: NSNumber,
    withModel model: String,
    withDelegate delegate: NSInteger,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    do {
      let helper = try FaceLandmarkerHelper(
        numFaces: numFaces,
        minFaceDetectionConfidence: minFaceDetectionConfidence.floatValue,
        minFacePresenceConfidence: minFacePresenceConfidence.floatValue,
        minTrackingConfidence: minTrackingConfidence.floatValue,
        modelName: model,
        delegate: delegate
      )

      let image = try loadImageFromPath(from: imagePath)
      if let result = helper.detect(image: image) {
        resolve(convertFldResultBundleToDictionary(result))
      } else {
        throw NSError(
          domain: "com.NeuroFaceLandmarker.error",
          code: 1001,
          userInfo: [NSLocalizedDescriptionKey: "Face detection failed."]
        )
      }
    } catch let error as NSError {
      reject("DETECT_IMAGE_ERROR", error.localizedDescription, error)
    }
  }
}
