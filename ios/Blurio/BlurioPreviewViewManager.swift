import UIKit
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

@objc(BlurioContextMenuView)
final class BlurioContextMenuViewManager: RCTViewManager {

  override func view() -> UIView! {
    BlurioContextMenuContainerView()
  }

  override static func requiresMainQueueSetup() -> Bool {
    true
  }
}

final class BlurioContextMenuContainerView: UIView, UIContextMenuInteractionDelegate {

  @objc var onPressMenuItem: RCTBubblingEventBlock?

  @objc var menuItems: String = "[]" {
    didSet {
      parsedMenuItems = parseMenuItems(from: menuItems)
    }
  }

  private struct ParsedItem {
    let id: String
    let title: String
    let destructive: Bool
    let disabled: Bool
    let children: [ParsedItem]
  }

  private var parsedMenuItems: [ParsedItem] = []

  override init(frame: CGRect) {
    super.init(frame: frame)
    backgroundColor = .clear
    isOpaque = false
    if #available(iOS 13.0, *) {
      addInteraction(UIContextMenuInteraction(delegate: self))
    }
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) not supported")
  }

  private func parseMenuItems(from json: String) -> [ParsedItem] {
    guard let data = json.data(using: .utf8),
          let payload = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] else {
      return []
    }

    return payload.compactMap(parseMenuItem)
  }

  private func parseMenuItem(_ value: [String: Any]) -> ParsedItem? {
    guard let id = value["id"] as? String,
          let title = value["title"] as? String else {
      return nil
    }

    let destructive = (value["destructive"] as? Bool) ?? false
    let disabled = (value["disabled"] as? Bool) ?? false
    let childrenJson = value["children"] as? [[String: Any]] ?? []
    let children = childrenJson.compactMap(parseMenuItem)

    return ParsedItem(
      id: id,
      title: title,
      destructive: destructive,
      disabled: disabled,
      children: children
    )
  }

  @available(iOS 13.0, *)
  func contextMenuInteraction(
    _ interaction: UIContextMenuInteraction,
    configurationForMenuAtLocation location: CGPoint
  ) -> UIContextMenuConfiguration? {
    guard !parsedMenuItems.isEmpty else {
      return nil
    }

    return UIContextMenuConfiguration(identifier: nil, previewProvider: nil) { [weak self] _ in
      guard let self else { return nil }
      let children = self.parsedMenuItems.map { self.makeMenuElement(from: $0) }
      return UIMenu(title: "", children: children)
    }
  }

  @available(iOS 13.0, *)
  func contextMenuInteraction(
    _ interaction: UIContextMenuInteraction,
    previewForHighlightingMenuWithConfiguration configuration: UIContextMenuConfiguration
  ) -> UITargetedPreview? {
    makeTargetedPreview(for: interaction)
  }

  @available(iOS 13.0, *)
  func contextMenuInteraction(
    _ interaction: UIContextMenuInteraction,
    previewForDismissingMenuWithConfiguration configuration: UIContextMenuConfiguration
  ) -> UITargetedPreview? {
    makeTargetedPreview(for: interaction)
  }

  @available(iOS 13.0, *)
  private func makeTargetedPreview(for interaction: UIContextMenuInteraction) -> UITargetedPreview? {
    let targetView = subviews.first ?? self
    let parameters = UIPreviewParameters()
    parameters.backgroundColor = .clear

    if !targetView.bounds.isEmpty {
      let cornerRadius: CGFloat = targetView.layer.cornerRadius > 0 ? targetView.layer.cornerRadius : 14
      parameters.visiblePath = UIBezierPath(
        roundedRect: targetView.bounds,
        cornerRadius: cornerRadius
      )
    }

    let centerInContainer = CGPoint(
      x: targetView.frame.midX,
      y: targetView.frame.midY
    )
    let target = UIPreviewTarget(container: self, center: centerInContainer)
    return UITargetedPreview(view: targetView, parameters: parameters, target: target)
  }

  @available(iOS 13.0, *)
  private func makeMenuElement(from item: ParsedItem) -> UIMenuElement {
    if !item.children.isEmpty {
      let submenu = item.children.map { makeMenuElement(from: $0) }
      return UIMenu(title: item.title, children: submenu)
    }

    var attributes = UIMenuElement.Attributes()
    if item.destructive {
      attributes.insert(.destructive)
    }
    if item.disabled {
      attributes.insert(.disabled)
    }

    return UIAction(title: item.title, attributes: attributes) { [weak self] _ in
      self?.onPressMenuItem?(["id": item.id])
    }
  }
}
