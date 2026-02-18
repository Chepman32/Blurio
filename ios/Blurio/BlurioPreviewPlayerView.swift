import UIKit
import AVFoundation
import React

final class BlurioPreviewPlayerView: UIView {

  // MARK: - RCT event blocks

  @objc var onReady: RCTDirectEventBlock?
  @objc var onTimeSync: RCTBubblingEventBlock?
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

  /// Container for blur overlay views, sits on top of the player layer
  private let blurContainer = UIView()
  /// Active blur region views keyed by track ID
  private var blurRegions: [String: BlurRegionView] = [:]

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
    layoutBlurRegions()
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
          let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
          let tracksJson = json["tracks"] as? [[String: Any]] else {
      removeAllBlurRegions()
      return
    }

    parsedTracks = tracksJson.compactMap { parseTrack($0) }
    reconcileBlurRegions()
    layoutBlurRegions()
  }

  private func parseTrack(_ json: [String: Any]) -> ParsedTrack? {
    guard let id = json["id"] as? String,
          let visible = json["visible"] as? Bool,
          let type = json["type"] as? String,
          let valuesJson = json["values"] as? [String: Any] else {
      return nil
    }

    let blendMode = json["blendMode"] as? String ?? "normal"
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

      regionView.frame = CGRect(x: x, y: y, width: w, height: h)
      regionView.transform = CGAffineTransform(rotationAngle: track.values.rotation * .pi / 180)
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
    parsedTracks = []
  }

  // MARK: - Video loading

  private func loadVideo() {
    cleanupPlayer()
    loadedUri = sourceUri
    backgroundColor = .clear

    guard !sourceUri.isEmpty else { return }

    guard let url = URL(string: sourceUri) else {
      onPreviewError?(["message": "Invalid source URI: \(sourceUri)"])
      return
    }

    let item = AVPlayerItem(url: url)
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

    // Periodic time sync (~30 fps)
    let interval = CMTime(value: 1, timescale: 30)
    timeObserverToken = newPlayer.addPeriodicTimeObserver(
      forInterval: interval,
      queue: .main
    ) { [weak self] time in
      let ms = Int(CMTimeGetSeconds(time) * 1000)
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
    playerLayer?.removeFromSuperlayer()
    player?.pause()
    player = nil
    playerLayer = nil
    loadedUri = ""
  }

  deinit {
    cleanupPlayer()
  }
}

// MARK: - BlurRegionView

/// A single blur region overlay. Uses UIVisualEffectView with a property animator
/// to control blur intensity via the track's `strength` value.
private final class BlurRegionView: UIView {

  private let effectView: UIVisualEffectView
  private var animator: UIViewPropertyAnimator?
  private var currentStrength: CGFloat = -1
  private var maskLayer: CAShapeLayer?

  override init(frame: CGRect) {
    effectView = UIVisualEffectView(effect: nil)
    super.init(frame: frame)
    clipsToBounds = true
    isUserInteractionEnabled = false
    effectView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    addSubview(effectView)
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

    let clamped = min(max(strength, 0), 1)
    guard abs(clamped - currentStrength) > 0.005 else { return }
    currentStrength = clamped

    // Tear down previous animator
    animator?.stopAnimation(true)
    animator?.finishAnimation(at: .current)
    animator = nil

    effectView.effect = nil

    if clamped > 0.001 {
      let blurStyle: UIBlurEffect.Style = blendMode == "frosted" ? .light : .regular
      let blur = UIBlurEffect(style: blurStyle)
      let anim = UIViewPropertyAnimator(duration: 1, curve: .linear) { [weak self] in
        self?.effectView.effect = blur
      }
      anim.fractionComplete = clamped
      anim.pausesOnCompletion = true
      animator = anim
    }
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
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    effectView.frame = bounds
  }

  deinit {
    animator?.stopAnimation(true)
    animator?.finishAnimation(at: .current)
  }
}
