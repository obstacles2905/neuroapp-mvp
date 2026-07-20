#import "NeuroFaceLandmarker.h"
#import "NeuroFaceLandmarker-Swift.h"
#import "NeuroFaceLandmarkerSpec.h"

@interface NeuroFaceLandmarker () <NativeNeuroFaceLandmarkerSpec>
@end

@implementation NeuroFaceLandmarker {
  FaceLandmarkModule *_swiftModule;
}

RCT_EXPORT_MODULE(NeuroFaceLandmarker)

- (instancetype)init
{
  if (self = [super init]) {
    _swiftModule = [[FaceLandmarkModule alloc] init];
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (void)detectOnImage:(NSString *)imagePath
              numFaces:(double)numFaces
minFaceDetectionConfidence:(double)minFaceDetectionConfidence
minFacePresenceConfidence:(double)minFacePresenceConfidence
 minTrackingConfidence:(double)minTrackingConfidence
                 model:(NSString *)model
              delegate:(double)delegate
               resolve:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject
{
  [_swiftModule detectOnImage:imagePath
                 withNumFaces:(NSInteger)numFaces
 withMinFaceDetectionConfidence:@(minFaceDetectionConfidence)
 withMinFacePresenceConfidence:@(minFacePresenceConfidence)
  withMinTrackingConfidence:@(minTrackingConfidence)
                    withModel:model
                 withDelegate:(NSInteger)delegate
                     resolver:resolve
                     rejecter:reject];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeNeuroFaceLandmarkerSpecJSI>(params);
}

@end
