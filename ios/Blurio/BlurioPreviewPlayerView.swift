import UIKit
import AVFoundation
import React
import CoreImage

final class BlurioPreviewPlayerView: UIView {

  // MARK: - RCT event blocks

  @objc var onReady: RCTDirectEventBlock?
  @objc var onTimeSync: RCTDirectEventBlock?
  @objc var onPreviewError: RCTBubblingEventBlock?

  // MARK: - Props

  @objc var sourceUri: String = "" {
    didSet {
      guard sourceUri != loadedUri else { return }
      loadVideo()
    }
  }

  @objc var paused: Bool = false {
    didSet { paused ? player?.pause() : player?.play() }
  }

  @objc var quality: String = "balanced" {
    didSet { applyQuality() }
  }

  @objc var renderState: String = "" {
    didSet { applyRenderState() }
  }

  // MARK: - Private

  private var player: AVPlayer?
  private var playerLayer: AVPlayerLayer?
  private var timeObserverToken: Any?
  private var statusObservation: NSKeyValueObservation?
  private var loadedUri: String = ""
  private var didReachEnd = false
  private var lastAppliedPlayheadMs: Double = -1
  private var videoOutput: AVPlayerItemVideoOutput?
  private var displayLink: CADisplayLink?
  private let ciContext = CIContext()
  private var latestFrameImage: CIImage?

  /// Container for blur overlay views, sits on top of the player layer
  private let blurContainer = UIView()
  /// Active blur region views keyed by track ID
  private var blurRegions: [String: BlurRegionView] = [:]
  /// Track bounds in container space (before rotation transform), keyed by track ID
  private var trackFrames: [String: CGRect] = [:]

  // MARK: - Init

  override init(frame: CGRect) {
    super.init(frame: frame)
    blurContainer.clipsToBounds = true
    blurContainer.isUserInteractionEnabled = false
    addSubview(blurContainer)
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) not supported")
  }

  // MARK: - Layout

  override func layoutSubviews() {
    super.layoutSubviews()
    playerLayer?.frame = bounds
    blurContainer.frame = bounds
    CATransaction.begin()
    CATransaction.setDisableActions(true)
    layoutBlurRegions()
    CATransaction.commit()
    renderBlurRegionsIfPossible()
  }

  // MARK: - Render state

  private struct ParsedTrack {
    let id: String
    let visible: Bool
    let type: String
    let blendMode: String
    let values: ParsedValues
    let pathPoints: [[String: CGFloat]]
  }

  private struct ParsedValues {
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

  private var parsedTracks: [ParsedTrack] = []

  private func applyRenderState() {
    guard !renderState.isEmpty,
          let data = renderState.data(using: .utf8),
          let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
      removeAllBlurRegions()
      return
    }

    let playheadMs = doubleValue(json["playheadMs"])
    if shouldSkipStaleRenderState(nextPlayheadMs: playheadMs) {
      return
    }

    guard let tracksJson = json["tracks"] as? [[String: Any]] else {
      removeAllBlurRegions()
      return
    }

    parsedTracks = tracksJson.compactMap { parseTrack($0) }
    lastAppliedPlayheadMs = playheadMs
    CATransaction.begin()
    CATransaction.setDisableActions(true)
    reconcileBlurRegions()
    layoutBlurRegions()
    CATransaction.commit()
    renderBlurRegionsIfPossible()
  }

  private func shouldSkipStaleRenderState(nextPlayheadMs: Double) -> Bool {
    guard !paused, lastAppliedPlayheadMs >= 0 else { return false }

    // Ignore small backward time steps while playing; these are usually delayed bridge updates.
    let deltaMs = nextPlayheadMs - lastAppliedPlayheadMs
    guard deltaMs < -24 else { return false }

    // Allow large jumps because they are likely explicit user seeks.
    if abs(deltaMs) > 450 {
      return false
    }

    // Allow natural loop transitions near the end of the media.
    if isLikelyLoopTransition(fromMs: lastAppliedPlayheadMs, toMs: nextPlayheadMs) {
      return false
    }

    return true
  }

  private func isLikelyLoopTransition(fromMs: Double, toMs: Double) -> Bool {
    guard let item = player?.currentItem else { return false }
    let durationSec = CMTimeGetSeconds(item.duration)
    guard durationSec.isFinite, durationSec > 0 else { return false }

    let durationMs = durationSec * 1000.0
    return fromMs >= durationMs * 0.85 && toMs <= durationMs * 0.15
  }

  private func doubleValue(_ value: Any?) -> Double {
    if let n = value as? NSNumber { return n.doubleValue }
    if let n = value as? Double { return n }
    if let n = value as? Int { return Double(n) }
    return 0
  }

  private func parseTrack(_ json: [String: Any]) -> ParsedTrack? {
    guard let id = json["id"] as? String,
          let visible = json["visible"] as? Bool,
          let type = json["type"] as? String,
          let valuesJson = json["values"] as? [String: Any] else {
      return nil
    }

    let blendMode = json["blendMode"] as? String ?? "gaussian"
    let pathPoints = json["pathPoints"] as? [[String: CGFloat]] ?? []

    let values = ParsedValues(
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

    return ParsedTrack(
      id: id,
      visible: visible,
      type: type,
      blendMode: blendMode,
      values: values,
      pathPoints: pathPoints
    )
  }

  private func cgFloat(_ value: Any?) -> CGFloat {
    if let n = value as? NSNumber { return CGFloat(n.doubleValue) }
    if let n = value as? Double { return CGFloat(n) }
    if let n = value as? Int { return CGFloat(n) }
    return 0
  }

  // MARK: - Blur region management

  private func reconcileBlurRegions() {
    let visibleIds = Set(parsedTracks.filter { $0.visible && $0.values.strength > 0.001 }.map { $0.id })

    // Remove regions for tracks that are no longer visible
    for (id, view) in blurRegions where !visibleIds.contains(id) {
      view.removeFromSuperview()
      blurRegions.removeValue(forKey: id)
      trackFrames.removeValue(forKey: id)
    }

    // Add/update regions
    for track in parsedTracks {
      guard track.visible && track.values.strength > 0.001 else { continue }

      if blurRegions[track.id] == nil {
        let regionView = BlurRegionView()
        blurContainer.addSubview(regionView)
        blurRegions[track.id] = regionView
      }

      blurRegions[track.id]?.update(
        type: track.type,
        strength: track.values.strength,
        feather: track.values.feather,
        opacity: track.values.opacity,
        cornerRadius: track.values.cornerRadius,
        blendMode: track.blendMode
      )
    }
  }

  private func layoutBlurRegions() {
    let containerSize = bounds.size
    guard containerSize.width > 0 && containerSize.height > 0 else { return }

    for track in parsedTracks {
      guard track.visible,
            track.values.strength > 0.001,
            let regionView = blurRegions[track.id] else { continue }

      let w = max(track.values.width * containerSize.width, 24)
      let h = max(track.values.height * containerSize.height, 24)
      let x = min(max(track.values.x * containerSize.width, 0), max(0, containerSize.width - w))
      let y = min(max(track.values.y * containerSize.height, 0), max(0, containerSize.height - h))
      let rotation = track.values.rotation * .pi / 180
      trackFrames[track.id] = CGRect(x: x, y: y, width: w, height: h)

      // Avoid frame jitter: assign geometry in identity transform space, then rotate.
      regionView.transform = .identity
      regionView.bounds = CGRect(x: 0, y: 0, width: w, height: h)
      regionView.center = CGPoint(x: x + w / 2, y: y + h / 2)
      regionView.transform = CGAffineTransform(rotationAngle: rotation)
      regionView.applyMask(
        type: track.type,
        cornerRadius: track.values.cornerRadius,
        feather: track.values.feather
      )
    }
  }

  private func removeAllBlurRegions() {
    for (_, view) in blurRegions {
      view.removeFromSuperview()
    }
    blurRegions.removeAll()
    trackFrames.removeAll()
    parsedTracks = []
    lastAppliedPlayheadMs = -1
  }

  private func renderBlurRegionsIfPossible() {
    if let frameImage = latestFrameImage {
      renderBlurRegions(with: frameImage)
      return
    }

    guard let output = videoOutput else { return }
    let targetTime = player?.currentTime() ?? .zero
    var displayTime = CMTime.invalid
    guard let pixelBuffer = output.copyPixelBuffer(forItemTime: targetTime, itemTimeForDisplay: &displayTime) else {
      return
    }

    let frameImage = CIImage(cvPixelBuffer: pixelBuffer)
    latestFrameImage = frameImage
    renderBlurRegions(with: frameImage)
  }

  private func renderBlurRegions(with sourceImage: CIImage) {
    guard !parsedTracks.isEmpty, !blurRegions.isEmpty else { return }

    let sourceExtent = sourceImage.extent
    guard sourceExtent.width > 1, sourceExtent.height > 1 else { return }

    let candidateVideoRect = playerLayer?.videoRect ?? bounds
    let videoRect = candidateVideoRect.isEmpty ? bounds : candidateVideoRect
    guard videoRect.width > 1, videoRect.height > 1 else { return }

    for track in parsedTracks {
      guard track.visible,
            track.values.strength > 0.001,
            let regionView = blurRegions[track.id],
            let trackFrame = trackFrames[track.id],
            let cropRect = sourceCropRect(
              for: trackFrame,
              inVideoRect: videoRect,
              sourceExtent: sourceExtent
            ) else {
        continue
      }

      let cropped = sourceImage.cropped(to: cropRect)
      let filtered = applyBlurFilter(
        to: cropped,
        mode: normalizedBlurMode(track.blendMode),
        strength: track.values.strength
      ).cropped(to: cropped.extent)

      guard let cgImage = ciContext.createCGImage(filtered, from: filtered.extent) else {
        continue
      }

      regionView.setFilteredImage(cgImage)
    }
  }

  private func normalizedBlurMode(_ value: String) -> String {
    switch value {
    case "normal":
      return "gaussian"
    case "frosted":
      return "smartBlur"
    default:
      return value
    }
  }

  private func sourceCropRect(
    for trackFrame: CGRect,
    inVideoRect videoRect: CGRect,
    sourceExtent: CGRect
  ) -> CGRect? {
    let intersection = trackFrame.intersection(videoRect)
    guard !intersection.isNull, intersection.width > 1, intersection.height > 1 else {
      return nil
    }

    let u0 = (intersection.minX - videoRect.minX) / videoRect.width
    let u1 = (intersection.maxX - videoRect.minX) / videoRect.width
    let vTop = (intersection.minY - videoRect.minY) / videoRect.height
    let vBottom = (intersection.maxY - videoRect.minY) / videoRect.height

    let x = sourceExtent.minX + u0 * sourceExtent.width
    let y = sourceExtent.minY + (1.0 - vBottom) * sourceExtent.height
    let width = max((u1 - u0) * sourceExtent.width, 1)
    let height = max((vBottom - vTop) * sourceExtent.height, 1)

    let rect = CGRect(x: x, y: y, width: width, height: height).intersection(sourceExtent)
    guard !rect.isNull, rect.width > 1, rect.height > 1 else { return nil }
    return rect
  }

  private func applyBlurFilter(
    to image: CIImage,
    mode: String,
    strength: CGFloat
  ) -> CIImage {
    let clampedStrength = min(max(strength, 0), 1)
    let baseRadius = max(clampedStrength * 16.0, 0.35)

    switch mode {
    case "bokeh":
      let discRadius = max(baseRadius * 2.0, 1.6)
      let disc = applyDiscBlur(to: image, radius: discRadius)
      if let bloom = CIFilter(name: "CIBloom") {
        setFilterValue(bloom, disc, forKey: kCIInputImageKey)
        setFilterValue(bloom, discRadius * 0.9, forKey: kCIInputRadiusKey)
        setFilterValue(bloom, 0.15 + clampedStrength * 0.35, forKey: kCIInputIntensityKey)
        if let output = bloom.outputImage {
          return output
        }
      }
      return disc

    case "motionBlur":
      if let motion = CIFilter(name: "CIMotionBlur") {
        setFilterValue(motion, image, forKey: kCIInputImageKey)
        setFilterValue(motion, max(baseRadius * 2.4, 1.4), forKey: kCIInputRadiusKey)
        setFilterValue(motion, CGFloat.pi * 0.34, forKey: kCIInputAngleKey)
        if let output = motion.outputImage {
          return output
        }
      }
      return applyGaussianBlur(to: image, radius: max(baseRadius * 1.9, 1.2))

    case "bilateral":
      if let noiseReduction = CIFilter(name: "CINoiseReduction") {
        setFilterValue(noiseReduction, image, forKey: kCIInputImageKey)
        setFilterValue(noiseReduction, 0.01 + clampedStrength * 0.06, forKey: "inputNoiseLevel")
        setFilterValue(noiseReduction, 0.55, forKey: "inputSharpness")
        if let output = noiseReduction.outputImage {
          return output
        }
      }
      return applyGaussianBlur(to: image, radius: max(baseRadius * 0.45, 0.5))

    case "smartBlur":
      let softened = applyGaussianBlur(to: image, radius: max(baseRadius * 0.9, 0.7))
      if let reduction = CIFilter(name: "CINoiseReduction") {
        setFilterValue(reduction, softened, forKey: kCIInputImageKey)
        setFilterValue(reduction, 0.02 + clampedStrength * 0.07, forKey: "inputNoiseLevel")
        setFilterValue(reduction, 0.35, forKey: "inputSharpness")
        if let denoised = reduction.outputImage {
          if let sharpen = CIFilter(name: "CISharpenLuminance") {
            setFilterValue(sharpen, denoised, forKey: kCIInputImageKey)
            setFilterValue(sharpen, 0.18 + clampedStrength * 0.35, forKey: kCIInputSharpnessKey)
            if let output = sharpen.outputImage {
              return output
            }
          }
          return denoised
        }
      }
      return softened

    case "radial":
      if let zoom = CIFilter(name: "CIZoomBlur") {
        setFilterValue(zoom, image, forKey: kCIInputImageKey)
        let center = CIVector(x: image.extent.midX, y: image.extent.midY)
        setFilterValue(zoom, center, forKey: kCIInputCenterKey)
        setFilterValue(zoom, max(baseRadius * 2.2, 1.2), forKey: kCIInputAmountKey)
        if let output = zoom.outputImage {
          return output
        }
      }
      return applyGaussianBlur(to: image, radius: max(baseRadius * 1.25, 0.9))

    case "gaussian":
      fallthrough
    default:
      return applyGaussianBlur(to: image, radius: baseRadius)
    }
  }

  private func applyGaussianBlur(to image: CIImage, radius: CGFloat) -> CIImage {
    guard let gaussian = CIFilter(name: "CIGaussianBlur") else { return image }
    setFilterValue(gaussian, image, forKey: kCIInputImageKey)
    setFilterValue(gaussian, radius, forKey: kCIInputRadiusKey)
    return gaussian.outputImage ?? image
  }

  private func applyDiscBlur(to image: CIImage, radius: CGFloat) -> CIImage {
    if let disc = CIFilter(name: "CIDiscBlur") {
      setFilterValue(disc, image, forKey: kCIInputImageKey)
      setFilterValue(disc, radius, forKey: kCIInputRadiusKey)
      if let output = disc.outputImage {
        return output
      }
    }
    if let bokeh = CIFilter(name: "CIBokehBlur") {
      setFilterValue(bokeh, image, forKey: kCIInputImageKey)
      setFilterValue(bokeh, radius, forKey: kCIInputRadiusKey)
      if let output = bokeh.outputImage {
        return output
      }
    }
    return applyGaussianBlur(to: image, radius: radius)
  }

  private func setFilterValue(_ filter: CIFilter, _ value: Any, forKey key: String) {
    guard filter.inputKeys.contains(key) else { return }
    filter.setValue(value, forKey: key)
  }

  @objc private func displayLinkTick() {
    guard !blurRegions.isEmpty, let output = videoOutput else { return }

    let hostTime = CACurrentMediaTime()
    let outputTime = output.itemTime(forHostTime: hostTime)
    var displayTime = CMTime.invalid

    if output.hasNewPixelBuffer(forItemTime: outputTime),
       let pixelBuffer = output.copyPixelBuffer(forItemTime: outputTime, itemTimeForDisplay: &displayTime) {
      let frameImage = CIImage(cvPixelBuffer: pixelBuffer)
      latestFrameImage = frameImage
      renderBlurRegions(with: frameImage)
      return
    }

    if paused {
      renderBlurRegionsIfPossible()
    }
  }

  private func startDisplayLink() {
    stopDisplayLink()
    let link = CADisplayLink(target: self, selector: #selector(displayLinkTick))
    link.preferredFramesPerSecond = 30
    link.add(to: .main, forMode: .common)
    displayLink = link
  }

  private func stopDisplayLink() {
    displayLink?.invalidate()
    displayLink = nil
  }

  // MARK: - Video loading

  private func loadVideo() {
    cleanupPlayer()
    loadedUri = sourceUri
    lastAppliedPlayheadMs = -1
    latestFrameImage = nil
    backgroundColor = .clear

    guard !sourceUri.isEmpty else { return }

    guard let url = URL(string: sourceUri) else {
      onPreviewError?(["message": "Invalid source URI: \(sourceUri)"])
      return
    }

    let item = AVPlayerItem(url: url)
    let output = AVPlayerItemVideoOutput(pixelBufferAttributes: [
      kCVPixelBufferPixelFormatTypeKey as String: Int(kCVPixelFormatType_32BGRA)
    ])
    item.add(output)
    videoOutput = output

    let newPlayer = AVPlayer(playerItem: item)
    newPlayer.isMuted = true

    let newLayer = AVPlayerLayer(player: newPlayer)
    newLayer.videoGravity = .resizeAspect
    newLayer.backgroundColor = UIColor.clear.cgColor
    newLayer.frame = bounds
    layer.insertSublayer(newLayer, at: 0)

    player = newPlayer
    playerLayer = newLayer

    // Observe ready / error
    statusObservation = item.observe(\.status, options: [.new]) { [weak self] item, _ in
      DispatchQueue.main.async {
        self?.handleStatusChange(item.status, error: item.error)
      }
    }

    // Periodic time sync (~60 fps) for smooth UI interpolation in JS.
    let interval = CMTime(seconds: 1.0 / 60.0, preferredTimescale: 600)
    timeObserverToken = newPlayer.addPeriodicTimeObserver(
      forInterval: interval,
      queue: .main
    ) { [weak self] time in
      let ms = CMTimeGetSeconds(time) * 1000.0
      self?.onTimeSync?(["timeMs": ms])
    }

    // Loop playback
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(playerDidReachEnd),
      name: .AVPlayerItemDidPlayToEndTime,
      object: item
    )

    applyQuality()
    startDisplayLink()

    if !paused {
      newPlayer.play()
    }
  }

  // MARK: - Status

  private func handleStatusChange(_ status: AVPlayerItem.Status, error: Error?) {
    switch status {
    case .readyToPlay:
      onReady?([:])
    case .failed:
      let msg = error?.localizedDescription ?? "Playback failed"
      onPreviewError?(["message": msg])
    default:
      break
    }
  }

  // MARK: - Quality

  private func applyQuality() {
    guard let item = player?.currentItem else { return }
    switch quality {
    case "ultra":
      item.preferredMaximumResolution = .zero
    case "smooth":
      item.preferredMaximumResolution = CGSize(width: 1280, height: 720)
    default: // balanced
      item.preferredMaximumResolution = CGSize(width: 1920, height: 1080)
    }
  }

  // MARK: - Loop

  @objc private func playerDidReachEnd(_ notification: Notification) {
    player?.seek(to: .zero)
    if !paused {
      player?.play()
    }
  }

  // MARK: - Cleanup

  private func cleanupPlayer() {
    if let token = timeObserverToken {
      player?.removeTimeObserver(token)
      timeObserverToken = nil
    }
    statusObservation?.invalidate()
    statusObservation = nil
    NotificationCenter.default.removeObserver(self, name: .AVPlayerItemDidPlayToEndTime, object: player?.currentItem)
    stopDisplayLink()
    playerLayer?.removeFromSuperlayer()
    player?.pause()
    player = nil
    playerLayer = nil
    videoOutput = nil
    latestFrameImage = nil
    loadedUri = ""
  }

  deinit {
    cleanupPlayer()
  }
}

// MARK: - BlurRegionView

/// A single blur region overlay.
/// The parent view positions/masks this view while this view only renders filtered frame content.
private final class BlurRegionView: UIView {

  private let imageView = UIImageView()
  private var maskLayer: CAShapeLayer?

  override init(frame: CGRect) {
    super.init(frame: frame)
    clipsToBounds = true
    isUserInteractionEnabled = false
    imageView.contentMode = .scaleToFill
    imageView.isUserInteractionEnabled = false
    imageView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    addSubview(imageView)
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) not supported")
  }

  func update(
    type: String,
    strength: CGFloat,
    feather: CGFloat,
    opacity: CGFloat,
    cornerRadius: CGFloat,
    blendMode: String
  ) {
    alpha = opacity
    // Inputs are consumed in parent-level rendering; keep signature for compatibility.
    _ = type
    _ = strength
    _ = feather
    _ = cornerRadius
    _ = blendMode
  }

  func setFilteredImage(_ image: CGImage) {
    imageView.layer.contents = image
    imageView.layer.contentsGravity = .resizeAspectFill
  }

  func applyMask(type: String, cornerRadius: CGFloat, feather: CGFloat) {
    let size = bounds.size
    guard size.width > 0 && size.height > 0 else { return }

    let minDim = min(size.width, size.height)
    let rect = CGRect(origin: .zero, size: size)
    let path: UIBezierPath

    switch type {
    case "ellipse", "face":
      path = UIBezierPath(ovalIn: rect)
    case "rectangle", "path":
      path = UIBezierPath(roundedRect: rect, cornerRadius: 2)
    default: // roundedRect, plate, etc.
      let cr = cornerRadius * minDim
      path = UIBezierPath(roundedRect: rect, cornerRadius: cr)
    }

    CATransaction.begin()
    CATransaction.setDisableActions(true)

    if maskLayer == nil {
      maskLayer = CAShapeLayer()
      layer.mask = maskLayer
    }

    maskLayer?.frame = rect
    maskLayer?.path = path.cgPath

    // Feather: apply a soft edge via shadow on the mask
    if feather > 0.01 {
      let featherRadius = feather * minDim * 0.5
      maskLayer?.shadowPath = path.cgPath
      maskLayer?.shadowColor = UIColor.black.cgColor
      maskLayer?.shadowOpacity = 1
      maskLayer?.shadowOffset = .zero
      maskLayer?.shadowRadius = featherRadius
    } else {
      maskLayer?.shadowOpacity = 0
    }

    CATransaction.commit()
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    imageView.frame = bounds
  }
}
