package com.neurofacelandmarker.shared

import android.graphics.Bitmap
import android.graphics.BitmapFactory

fun loadBitmapFromPath(fileUrl: String): Bitmap {
  val filePath = if (fileUrl.startsWith("file://")) {
    fileUrl.substring(7)
  } else {
    fileUrl
  }
  val result = BitmapFactory.decodeFile(filePath)
  if (result != null) {
    return result
  }
  throw IllegalStateException("Could not load bitmap from path: $filePath")
}
