import React

@objc(BlurioPreviewView)
final class BlurioPreviewViewManager: RCTViewManager {

  override func view() -> UIView! {
    BlurioPreviewPlayerView()
  }

  override static func requiresMainQueueSetup() -> Bool {
    true
  }
}
