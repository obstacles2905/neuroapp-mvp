import Foundation
import UIKit

enum MediaLoadingError: Error, LocalizedError {
  case invalidURL
  case unableToLoadData
  case unableToCreateImage

  var errorDescription: String? {
    switch self {
    case .invalidURL:
      return "Provided string is not a valid URL."
    case .unableToLoadData:
      return "Could not load data from the URL."
    case .unableToCreateImage:
      return "Data loaded is not a valid image."
    }
  }
}

func loadImageFromPath(from path: String) throws -> UIImage {
  var imageUrl = path
  if !path.starts(with: "file://") {
    imageUrl = "file://" + path
  }

  guard let url = URL(string: imageUrl) else {
    throw MediaLoadingError.invalidURL
  }
  guard let data = try? Data(contentsOf: url) else {
    throw MediaLoadingError.unableToLoadData
  }
  guard let image = UIImage(data: data) else {
    throw MediaLoadingError.unableToCreateImage
  }
  return image
}

func convertIntToDelegate(_ value: Int) -> Delegate {
  return value == 1 ? .GPU : .CPU
}
