package com.neurofacelandmarker

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import java.util.HashMap

class NeuroFaceLandmarkerPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    return if (name == NeuroFaceLandmarkerModule.NAME) {
      NeuroFaceLandmarkerModule(reactContext)
    } else {
      null
    }
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    return ReactModuleInfoProvider {
      val moduleInfos: MutableMap<String, ReactModuleInfo> = HashMap()
      moduleInfos[NeuroFaceLandmarkerModule.NAME] =
        ReactModuleInfo(
          NeuroFaceLandmarkerModule.NAME,
          NeuroFaceLandmarkerModule.NAME,
          false,
          false,
          false,
          true,
        )
      moduleInfos
    }
  }
}
