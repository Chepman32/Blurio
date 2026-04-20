import Foundation
import AVFoundation
import CoreImage
import Photos
import React

@objc(BlurioExportModule)
final class BlurioExportModule: RCTEventEmitter {

  // MARK: - Types

  private struct ExportTrack {
    let id: String
    let visible: Bool
    let type: String
    let blendMode: String
    let x: CGFloat
    let y: CGFloat
    let width: CGFloat
    let height: CGFloat
    let rotation: CGFloat
    let strength: CGFloat
    let feather: CGFloat
    let opacity: CGFloat
    let cornerRadius: CGFloat
  }

  // MARK: - State

  private var cancelFlag = false
  private let exportQueue = DispatchQueue(label: "com.blurio.export", qos: .userInitiated)
  private static let maxBlurRadius: CGFloat = 35.0

  // MARK: - RCTEventEmitter

  override func supportedEvents() -> [String] {
    ["BlurioExportProgress", "BlurioExportSuccess", "BlurioExportError"]
  }

  override static func requiresMainQueueSetup() -> Bool { false }

  // Required by RCTEventEmitter — suppress "no listeners" warnings
  override func addListener(_ eventName: String!) {
    super.addListener(eventName)
  }

  override func removeListeners(_ count: Double) {
    super.removeListeners(count)
  }

  // MARK: - JS Methods

  @objc func startExport(
    _ request: NSDictionary,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    cancelFlag = false

    exportQueue.async { [weak self] in
      guard let self else { return }
      do {
        try self.runExport(request: request)
        resolve(nil)
      } catch let error as ExportError {
        switch error {
        case .cancelled:
          self.sendEvent(withName: "BlurioExportError", body: [
            "code": "CANCELLED",
            "message": "EXPORT_CANCELLED"
          ])
          reject("CANCELLED", "EXPORT_CANCELLED", nil)
        case .failed(let msg):
          self.sendEvent(withName: "BlurioExportError", body: [
            "code": "FAILED",
            "message": msg
          ])
          reject("FAILED", msg, nil)
        }
      } catch {
        let msg = error.localizedDescription
        self.sendEvent(withName: "BlurioExportError", body: [
          "code": "FAILED",
          "message": msg
        ])
        reject("FAILED", msg, nil)
      }
    }
  }

  @objc func cancelExport(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    cancelFlag = true
    resolve(nil)
  }

  // MARK: - Export pipeline

  private enum ExportError: Error {
    case cancelled
    case failed(String)
  }

  private func runExport(request: NSDictionary) throws {
    // --- Parse request ---
    guard let sourceUriRaw = request["sourceUri"] as? String,
          let destinationUriRaw = request["destinationUri"] as? String else {
      throw ExportError.failed("Invalid export request parameters")
    }

    // renderState arrives as NSDictionary (JS object serialized over bridge)
    let renderStateStr: String
    if let renderStateDict = request["renderState"] as? NSDictionary,
       let data = try? JSONSerialization.data(withJSONObject: renderStateDict),
       let str = String(data: data, encoding: .utf8) {
      renderStateStr = str
    } else if let str = request["renderState"] as? String {
      renderStateStr = str
    } else {
      renderStateStr = "{}"
    }

    let width = intValue(request["width"]) ?? 1920
    let height = intValue(request["height"]) ?? 1080
    let frameRate = intValue(request["frameRate"]) ?? 30
    let codecStr = request["codec"] as? String ?? "h264"
    let includeAudio = request["includeAudio"] as? Bool ?? true

    let sourceUrl = fileURL(from: sourceUriRaw)
    let destinationUrl = fileURL(from: destinationUriRaw)

    guard sourceUrl.isFileURL, destinationUrl.isFileURL else {
      throw ExportError.failed("Invalid source or destination URI")
    }

    // Ensure the parent directory exists for the destination
    let destDir = destinationUrl.deletingLastPathComponent()
    if !FileManager.default.fileExists(atPath: destDir.path) {
      try FileManager.default.createDirectory(at: destDir, withIntermediateDirectories: true)
    }

    let tracks = parseTracks(from: renderStateStr)

    // --- Stage: DECODING ---
    emitProgress(stage: "decoding", progress: 0.0, message: "Decoding")

    let asset = AVURLAsset(url: sourceUrl)

    guard let videoTrack = asset.tracks(withMediaType: .video).first else {
      throw ExportError.failed("No video track found in source")
    }

    let totalFrames = totalFrameCount(asset: asset, frameRate: frameRate)

    // AVAssetReader
    let reader: AVAssetReader
    do {
      reader = try AVAssetReader(asset: asset)
    } catch {
      throw ExportError.failed("Failed to create asset reader: \(error.localizedDescription)")
    }

    let videoReaderOutput = AVAssetReaderTrackOutput(
      track: videoTrack,
      outputSettings: [
        kCVPixelBufferPixelFormatTypeKey as String: Int(kCVPixelFormatType_32BGRA)
      ]
    )
    videoReaderOutput.alwaysCopiesSampleData = false
    reader.add(videoReaderOutput)

    var audioReaderOutput: AVAssetReaderTrackOutput?
    if includeAudio, let audioTrack = asset.tracks(withMediaType: .audio).first {
      let audioReadSettings: [String: Any] = [
        AVFormatIDKey: kAudioFormatLinearPCM,
        AVSampleRateKey: 44100,
        AVNumberOfChannelsKey: 2
      ]
      let aro = AVAssetReaderTrackOutput(track: audioTrack, outputSettings: audioReadSettings)
      aro.alwaysCopiesSampleData = false
      reader.add(aro)
      audioReaderOutput = aro
    }

    // AVAssetWriter
    // Remove existing file if present
    if FileManager.default.fileExists(atPath: destinationUrl.path) {
      try? FileManager.default.removeItem(at: destinationUrl)
    }

    let writer: AVAssetWriter
    do {
      writer = try AVAssetWriter(outputURL: destinationUrl, fileType: .mp4)
    } catch {
      throw ExportError.failed("Failed to create asset writer: \(error.localizedDescription)")
    }

    let videoCodec: AVVideoCodecType = codecStr == "hevc" ? .hevc : .h264
    let videoSettings: [String: Any] = [
      AVVideoCodecKey: videoCodec,
      AVVideoWidthKey: width,
      AVVideoHeightKey: height,
      AVVideoCompressionPropertiesKey: [
        AVVideoAverageBitRateKey: bitRate(for: width, height: height)
      ]
    ]
    let videoWriterInput = AVAssetWriterInput(mediaType: .video, outputSettings: videoSettings)
    videoWriterInput.expectsMediaDataInRealTime = false

    // Preserve orientation from source track
    videoWriterInput.transform = videoTrack.preferredTransform

    let adaptor = AVAssetWriterInputPixelBufferAdaptor(
      assetWriterInput: videoWriterInput,
      sourcePixelBufferAttributes: [
        kCVPixelBufferPixelFormatTypeKey as String: Int(kCVPixelFormatType_32BGRA),
        kCVPixelBufferWidthKey as String: width,
        kCVPixelBufferHeightKey as String: height
      ]
    )
    guard writer.canAdd(videoWriterInput) else {
      throw ExportError.failed("Cannot add video input to writer")
    }
    writer.add(videoWriterInput)

    var audioWriterInput: AVAssetWriterInput?
    if audioReaderOutput != nil {
      let audioSettings: [String: Any] = [
        AVFormatIDKey: kAudioFormatMPEG4AAC,
        AVSampleRateKey: 44100,
        AVNumberOfChannelsKey: 2,
        AVEncoderBitRateKey: 128_000
      ]
      let awi = AVAssetWriterInput(mediaType: .audio, outputSettings: audioSettings)
      awi.expectsMediaDataInRealTime = false
      if writer.canAdd(awi) {
        writer.add(awi)
        audioWriterInput = awi
      } else {
        // Skip audio if the writer can't accept the input
        audioReaderOutput = nil
      }
    }

    guard reader.startReading() else {
      throw ExportError.failed("Failed to start reading: \(reader.error?.localizedDescription ?? "unknown")")
    }
    guard writer.startWriting() else {
      throw ExportError.failed("Failed to start writing: \(writer.error?.localizedDescription ?? "unknown")")
    }
    writer.startSession(atSourceTime: .zero)

    emitProgress(stage: "decoding", progress: 0.05, message: "Decoding")

    // --- Stage: APPLYING_BLUR (frame loop) ---
    let ciContext = CIContext(options: [.useSoftwareRenderer: false])
    var frameIndex = 0
    var videoDone = false

    while reader.status == .reading, !videoDone {
      try autoreleasepool {
        if cancelFlag {
          reader.cancelReading()
          writer.cancelWriting()
          throw ExportError.cancelled
        }

        if writer.status == .failed {
          reader.cancelReading()
          throw ExportError.failed("Writer failed: \(writer.error?.localizedDescription ?? "unknown")")
        }

        if !videoWriterInput.isReadyForMoreMediaData {
          Thread.sleep(forTimeInterval: 0.005)
          return
        }

        guard let sampleBuffer = videoReaderOutput.copyNextSampleBuffer() else {
          videoDone = true
          return
        }

        guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else {
          frameIndex += 1
          return
        }

        let presentationTime = CMSampleBufferGetPresentationTimeStamp(sampleBuffer)

        // Apply blur effects
        let processedBuffer = applyBlur(
          to: pixelBuffer,
          tracks: tracks,
          ciContext: ciContext,
          pixelBufferPool: adaptor.pixelBufferPool,
          outputWidth: width,
          outputHeight: height
        )

        if !adaptor.append(processedBuffer, withPresentationTime: presentationTime) {
          if writer.status == .failed {
            reader.cancelReading()
            throw ExportError.failed("Writer failed during append: \(writer.error?.localizedDescription ?? "unknown")")
          }
        }

        frameIndex += 1

        if totalFrames > 0 {
          let pct = 0.05 + 0.80 * (Double(frameIndex) / Double(totalFrames))
          let clamped = min(pct, 0.85)
          emitProgress(stage: "applyingBlur", progress: clamped, message: "Applying blur")
        }
      }
    }

    if reader.status == .failed {
      writer.cancelWriting()
      throw ExportError.failed("Reader failed: \(reader.error?.localizedDescription ?? "unknown")")
    }

    // Drain audio
    if let aro = audioReaderOutput, let awi = audioWriterInput {
      while reader.status == .reading {
        if cancelFlag {
          reader.cancelReading()
          writer.cancelWriting()
          throw ExportError.cancelled
        }
        if writer.status == .failed {
          reader.cancelReading()
          throw ExportError.failed("Writer failed during audio: \(writer.error?.localizedDescription ?? "unknown")")
        }
        if !awi.isReadyForMoreMediaData {
          Thread.sleep(forTimeInterval: 0.005)
          continue
        }
        guard let sample = aro.copyNextSampleBuffer() else { break }
        awi.append(sample)
      }
      awi.markAsFinished()
    }

    // --- Stage: ENCODING ---
    emitProgress(stage: "encoding", progress: 0.90, message: "Encoding")

    videoWriterInput.markAsFinished()

    let finishSemaphore = DispatchSemaphore(value: 0)
    var writerError: Error?
    writer.finishWriting {
      writerError = writer.error
      finishSemaphore.signal()
    }
    finishSemaphore.wait()

    if let err = writerError {
      throw ExportError.failed("Writer failed: \(err.localizedDescription)")
    }

    emitProgress(stage: "encoding", progress: 0.95, message: "Encoding")

    // --- Stage: SAVING ---
    emitProgress(stage: "saving", progress: 0.96, message: "Saving")

    try saveToPhotoLibrary(url: destinationUrl)

    emitProgress(stage: "saving", progress: 1.0, message: "Saving")

    sendEvent(withName: "BlurioExportSuccess", body: [
      "outputUri": destinationUriRaw
    ])
  }

  // MARK: - Photo Library

  private func saveToPhotoLibrary(url: URL) throws {
    let semaphore = DispatchSemaphore(value: 0)
    var saveError: Error?

    PHPhotoLibrary.requestAuthorization(for: .addOnly) { status in
      guard status == .authorized || status == .limited else {
        saveError = NSError(
          domain: "BlurioExport",
          code: 403,
          userInfo: [NSLocalizedDescriptionKey: "Photo library permission denied"]
        )
        semaphore.signal()
        return
      }

      PHPhotoLibrary.shared().performChanges({
        PHAssetChangeRequest.creationRequestForAssetFromVideo(atFileURL: url)
      }) { _, error in
        saveError = error
        semaphore.signal()
      }
    }

    semaphore.wait()

    if let err = saveError {
      throw ExportError.failed("Failed to save to photo library: \(err.localizedDescription)")
    }
  }

  // MARK: - Blur application

  private func applyBlur(
    to pixelBuffer: CVPixelBuffer,
    tracks: [ExportTrack],
    ciContext: CIContext,
    pixelBufferPool: CVPixelBufferPool?,
    outputWidth: Int,
    outputHeight: Int
  ) -> CVPixelBuffer {
    let visibleTracks = tracks.filter { $0.visible && $0.strength > 0.001 }

    guard !visibleTracks.isEmpty else {
      return pixelBuffer
    }

    var sourceImage = CIImage(cvPixelBuffer: pixelBuffer)
    let sourceExtent = sourceImage.extent

    for track in visibleTracks {
      guard let cropRect = sourceCropRect(for: track, sourceExtent: sourceExtent) else {
        continue
      }

      let cropped = sourceImage.cropped(to: cropRect)
      let blurred = applyBlurFilter(to: cropped, mode: normalizedBlurMode(track.blendMode), strength: track.strength)

      // Composite blurred region back onto source
      let composite = blurred.composited(over: sourceImage)
      sourceImage = composite.cropped(to: sourceExtent)
    }

    // Render back to a pixel buffer — prefer the adaptor's pool for encoder compatibility
    var outputBuffer: CVPixelBuffer?
    if let pool = pixelBufferPool {
      CVPixelBufferPoolCreatePixelBuffer(kCFAllocatorDefault, pool, &outputBuffer)
    }
    if outputBuffer == nil {
      outputBuffer = makePixelBuffer(width: outputWidth, height: outputHeight)
    }
    guard let buffer = outputBuffer else {
      return pixelBuffer
    }

    ciContext.render(sourceImage, to: buffer)
    return buffer
  }

  private func sourceCropRect(for track: ExportTrack, sourceExtent: CGRect) -> CGRect? {
    let x = track.x * sourceExtent.width
    // CIImage Y is flipped: 0 is bottom, extent.height is top
    let y = (1.0 - track.y - track.height) * sourceExtent.height
    let w = max(track.width * sourceExtent.width, 1)
    let h = max(track.height * sourceExtent.height, 1)

    let rect = CGRect(x: x + sourceExtent.minX, y: y + sourceExtent.minY, width: w, height: h)
      .intersection(sourceExtent)

    guard !rect.isNull, rect.width > 1, rect.height > 1 else { return nil }
    return rect
  }

  private func normalizedBlurMode(_ value: String) -> String {
    switch value {
    case "normal": return "gaussian"
    case "frosted": return "smartBlur"
    default: return value
    }
  }

  private func applyBlurFilter(to image: CIImage, mode: String, strength: CGFloat) -> CIImage {
    let clampedStrength = min(max(strength, 0), 1)
    let baseRadius = max(clampedStrength * 24.0, 0.35)
    let extent = image.extent

    switch mode {
    case "bokeh":
      let bokehRadius = min(max(baseRadius * 2.5, 2.0), Self.maxBlurRadius)
      let clamped = image.clampedToExtent()
      if let bokeh = CIFilter(name: "CIBokehBlur") {
        setFilterValue(bokeh, clamped, forKey: kCIInputImageKey)
        setFilterValue(bokeh, bokehRadius, forKey: kCIInputRadiusKey)
        setFilterValue(bokeh, 0.5 + clampedStrength * 0.5, forKey: "inputRingAmount")
        setFilterValue(bokeh, max(bokehRadius * 0.15, 0.3), forKey: "inputRingSize")
        setFilterValue(bokeh, 0.6 + clampedStrength * 0.4, forKey: "inputSoftness")
        if let bokehOutput = bokeh.outputImage {
          if let bloom = CIFilter(name: "CIBloom") {
            setFilterValue(bloom, bokehOutput, forKey: kCIInputImageKey)
            setFilterValue(bloom, min(bokehRadius * 1.2, Self.maxBlurRadius), forKey: kCIInputRadiusKey)
            setFilterValue(bloom, 0.25 + clampedStrength * 0.5, forKey: kCIInputIntensityKey)
            if let output = bloom.outputImage {
              return output.cropped(to: extent)
            }
          }
          return bokehOutput.cropped(to: extent)
        }
      }
      let fallbackBlur = applyGaussianBlur(to: image, radius: bokehRadius)
      if let bloom = CIFilter(name: "CIBloom") {
        setFilterValue(bloom, fallbackBlur, forKey: kCIInputImageKey)
        setFilterValue(bloom, min(bokehRadius * 1.2, Self.maxBlurRadius), forKey: kCIInputRadiusKey)
        setFilterValue(bloom, 0.3 + clampedStrength * 0.5, forKey: kCIInputIntensityKey)
        if let output = bloom.outputImage { return output.cropped(to: extent) }
      }
      return fallbackBlur.cropped(to: extent)

    case "motionBlur":
      let clamped = image.clampedToExtent()
      if let motion = CIFilter(name: "CIMotionBlur") {
        setFilterValue(motion, clamped, forKey: kCIInputImageKey)
        setFilterValue(motion, min(max(baseRadius * 3.5, 2.0), Self.maxBlurRadius), forKey: kCIInputRadiusKey)
        setFilterValue(motion, CGFloat.pi * 0.34, forKey: kCIInputAngleKey)
        if let output = motion.outputImage { return output.cropped(to: extent) }
      }
      return applyGaussianBlur(to: image, radius: max(baseRadius * 1.9, 1.2)).cropped(to: extent)

    case "bilateral":
      let bilateralRadius = max(baseRadius * 0.8, 1.0)
      let blurred = applyGaussianBlur(to: image, radius: bilateralRadius)
      if let noiseReduction = CIFilter(name: "CINoiseReduction") {
        setFilterValue(noiseReduction, blurred, forKey: kCIInputImageKey)
        setFilterValue(noiseReduction, 0.02 + clampedStrength * 0.08, forKey: "inputNoiseLevel")
        setFilterValue(noiseReduction, 0.4 + clampedStrength * 0.4, forKey: "inputSharpness")
        if let output = noiseReduction.outputImage { return output.cropped(to: extent) }
      }
      return blurred.cropped(to: extent)

    case "smartBlur":
      let softened = applyGaussianBlur(to: image, radius: max(baseRadius * 1.1, 1.0))
      if let reduction = CIFilter(name: "CINoiseReduction") {
        setFilterValue(reduction, softened, forKey: kCIInputImageKey)
        setFilterValue(reduction, 0.03 + clampedStrength * 0.1, forKey: "inputNoiseLevel")
        setFilterValue(reduction, 0.2 + clampedStrength * 0.2, forKey: "inputSharpness")
        if let denoised = reduction.outputImage {
          if let sharpen = CIFilter(name: "CISharpenLuminance") {
            setFilterValue(sharpen, denoised, forKey: kCIInputImageKey)
            setFilterValue(sharpen, 0.3 + clampedStrength * 0.6, forKey: kCIInputSharpnessKey)
            if let output = sharpen.outputImage { return output.cropped(to: extent) }
          }
          return denoised.cropped(to: extent)
        }
      }
      return softened.cropped(to: extent)

    case "radial":
      let clamped = image.clampedToExtent()
      if let zoom = CIFilter(name: "CIZoomBlur") {
        setFilterValue(zoom, clamped, forKey: kCIInputImageKey)
        let center = CIVector(x: extent.midX, y: extent.midY)
        setFilterValue(zoom, center, forKey: kCIInputCenterKey)
        setFilterValue(zoom, min(max(baseRadius * 3.5, 2.0), Self.maxBlurRadius), forKey: kCIInputAmountKey)
        if let output = zoom.outputImage { return output.cropped(to: extent) }
      }
      return applyGaussianBlur(to: image, radius: max(baseRadius * 1.25, 0.9)).cropped(to: extent)

    case "gaussian":
      fallthrough
    default:
      return applyGaussianBlur(to: image, radius: baseRadius).cropped(to: extent)
    }
  }

  private func applyGaussianBlur(to image: CIImage, radius: CGFloat) -> CIImage {
    let extent = image.extent
    let clamped = image.clampedToExtent()
    guard let gaussian = CIFilter(name: "CIGaussianBlur") else { return image }
    setFilterValue(gaussian, clamped, forKey: kCIInputImageKey)
    setFilterValue(gaussian, radius, forKey: kCIInputRadiusKey)
    return (gaussian.outputImage ?? image).cropped(to: extent)
  }

  private func setFilterValue(_ filter: CIFilter, _ value: Any, forKey key: String) {
    guard filter.inputKeys.contains(key) else { return }
    filter.setValue(value, forKey: key)
  }

  // MARK: - Pixel buffer helpers

  private func makePixelBuffer(width: Int, height: Int) -> CVPixelBuffer? {
    var buffer: CVPixelBuffer?
    CVPixelBufferCreate(
      kCFAllocatorDefault,
      width,
      height,
      kCVPixelFormatType_32BGRA,
      [
        kCVPixelBufferIOSurfacePropertiesKey: [:] as CFDictionary
      ] as CFDictionary,
      &buffer
    )
    return buffer
  }

  // MARK: - Parsing helpers

  private func parseTracks(from renderStateStr: String) -> [ExportTrack] {
    guard let data = renderStateStr.data(using: .utf8),
          let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
          let tracksJson = json["tracks"] as? [[String: Any]] else {
      return []
    }

    return tracksJson.compactMap { parseTrack($0) }
  }

  private func parseTrack(_ json: [String: Any]) -> ExportTrack? {
    guard let id = json["id"] as? String,
          let visible = json["visible"] as? Bool,
          let type = json["type"] as? String,
          let valuesJson = json["values"] as? [String: Any] else {
      return nil
    }

    let blendMode = json["blendMode"] as? String ?? "gaussian"

    return ExportTrack(
      id: id,
      visible: visible,
      type: type,
      blendMode: blendMode,
      x: cgFloat(valuesJson["x"]),
      y: cgFloat(valuesJson["y"]),
      width: cgFloat(valuesJson["width"]),
      height: cgFloat(valuesJson["height"]),
      rotation: cgFloat(valuesJson["rotation"]),
      strength: cgFloat(valuesJson["strength"]),
      feather: cgFloat(valuesJson["feather"]),
      opacity: cgFloat(valuesJson["opacity"]),
      cornerRadius: cgFloat(valuesJson["cornerRadius"])
    )
  }

  private func cgFloat(_ value: Any?) -> CGFloat {
    if let n = value as? NSNumber { return CGFloat(n.doubleValue) }
    if let n = value as? Double { return CGFloat(n) }
    if let n = value as? Int { return CGFloat(n) }
    return 0
  }

  private func intValue(_ value: Any?) -> Int? {
    if let n = value as? NSNumber { return n.intValue }
    if let n = value as? Int { return n }
    if let n = value as? Double { return Int(n) }
    return nil
  }

  private func totalFrameCount(asset: AVAsset, frameRate: Int) -> Int {
    let durationSeconds = CMTimeGetSeconds(asset.duration)
    guard durationSeconds.isFinite, durationSeconds > 0 else { return 0 }
    return max(Int(durationSeconds * Double(frameRate)), 1)
  }

  private func bitRate(for width: Int, height: Int) -> Int {
    let pixels = width * height
    if pixels >= 3840 * 2160 { return 35_000_000 }
    if pixels >= 1920 * 1080 { return 12_000_000 }
    return 6_000_000
  }

  // MARK: - URL helpers

  /// Converts a string that may be a file path or a file:// URL into a file URL.
  private func fileURL(from raw: String) -> URL {
    if raw.hasPrefix("file://") {
      return URL(string: raw) ?? URL(fileURLWithPath: raw)
    }
    return URL(fileURLWithPath: raw)
  }

  // MARK: - Progress emission

  private func emitProgress(stage: String, progress: Double, message: String) {
    sendEvent(withName: "BlurioExportProgress", body: [
      "stage": stage,
      "progress": progress,
      "message": message
    ])
  }
}
