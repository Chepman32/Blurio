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

  @objc var renderState: String = "" // stored for future blur rendering

  // MARK: - Private

  private var player: AVPlayer?
  private var playerLayer: AVPlayerLayer?
  private var timeObserverToken: Any?
  private var statusObservation: NSKeyValueObservation?
  private var loadedUri: String = ""
  private var didReachEnd = false

  // MARK: - Layout

  override func layoutSubviews() {
    super.layoutSubviews()
    playerLayer?.frame = bounds
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
    layer.addSublayer(newLayer)

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
