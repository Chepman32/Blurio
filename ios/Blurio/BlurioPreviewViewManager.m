#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(BlurioPreviewView, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(sourceUri, NSString)
RCT_EXPORT_VIEW_PROPERTY(paused, BOOL)
RCT_EXPORT_VIEW_PROPERTY(quality, NSString)
RCT_EXPORT_VIEW_PROPERTY(renderState, NSString)
RCT_EXPORT_VIEW_PROPERTY(onReady, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onTimeSync, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onPreviewError, RCTBubblingEventBlock)

@end

@interface RCT_EXTERN_MODULE(BlurioContextMenuView, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(menuItems, NSString)
RCT_EXPORT_VIEW_PROPERTY(onPressMenuItem, RCTBubblingEventBlock)

@end
