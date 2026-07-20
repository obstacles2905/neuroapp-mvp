require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name = "NeuroFaceLandmarker"
  s.version = package["version"]
  s.summary = package["description"]
  s.license = package["license"] || "MIT"
  s.authors = "Neuro App"
  s.platforms = { :ios => min_ios_version_supported }
  s.source = { :git => "https://github.com/local/neuro-face-landmarker.git", :tag => "#{s.version}" }
  s.source_files = "ios/**/*.{h,m,mm,swift}"
  s.private_header_files = "ios/**/*.h"
  s.dependency "MediaPipeTasksVision", "~> 0.10.14"
  install_modules_dependencies(s)
end
