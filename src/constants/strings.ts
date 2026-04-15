import { APP_LOCALE, formatList, type SupportedLocale } from '../localization';

type TranslationDict = Record<string, string>;

const parseTranslations = (source: string): TranslationDict =>
  Object.fromEntries(
    source
      .trim()
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        const separatorIndex = line.indexOf('=');
        return [line.slice(0, separatorIndex), line.slice(separatorIndex + 1)];
      }),
  );

const interpolate = (
  template: string,
  values?: Record<string, string | number>,
): string =>
  Object.entries(values ?? {}).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );

const ENGLISH_TRANSLATIONS = parseTranslations(`
app.name=Blurio
app.splashTagline=Offline privacy blur editor
app.sourceLabel=Source
app.qualityLabel=Quality
common.cancel=Cancel
common.close=Close
common.confirm=Confirm
common.save=Save
common.delete=Delete
common.remove=Remove
common.duplicate=Duplicate
common.rename=Rename
common.done=Done
common.retry=Try again
common.continue=Continue
common.back=Back
common.noProjectSelected=No project selected.
common.settings=Settings
common.import=Import
common.export=Export
common.disabled=Disabled
common.enabled=Enabled
common.yes=Yes
common.no=No
common.untitledFolder=Untitled Folder
common.untitledProject=Untitled Project
navigation.homeTitle=Projects
navigation.importTitle=Import Video
navigation.editorTitle=Editor
navigation.exportTitle=Export
navigation.settingsTitle=Settings
home.openSettings=Open settings
home.emptyTitle=No projects yet
home.emptyBody=Import a video to start building blur tracks.
home.emptyButton=Create First Project
home.createProjectFab=Create new project
home.contextTitle=Project Actions
home.longPressHint=Long press for project actions
home.duplicateAction=Duplicate project
home.deleteAction=Delete project
home.renameAction=Rename
home.moveToFolderAction=Move to Folder
home.removeAction=Remove
home.recoverAction=Recover
home.removePermanentlyAction=Remove Permanently
home.openAction=Open editor
home.deleteConfirmTitle=Delete project?
home.deleteConfirmBody=This removes metadata and cached previews from this device.
home.removeConfirmTitle=Move project to Trash?
home.removeConfirmBody=You can recover it later from Trash.
home.allProjectsFolder=All Projects
home.trashFolder=Trash
home.defaultFolderName=Projects
home.renameProjectTitle=Rename Project
home.renameProjectPlaceholder=Project name
home.renameFolderTitle=Rename Folder
home.renameFolderPlaceholder=Folder name
home.createFolderTitle=New Folder
home.createFolderPlaceholder=Folder name
home.newFolderAction=New Folder...
home.removeFolderConfirmTitle=Remove folder?
home.removeFolderConfirmBody=Projects in this folder will be moved to another folder.
home.emptyTrashTitle=Trash is empty
home.noFolderTargets=No other folders
import.pickButton=Choose from Photos
import.preparing=Preparing preview
import.preparingBody=Generating thumbnails and local metadata
import.iCloudWarningTitle=Asset not fully downloaded
import.iCloudWarningBody=This video appears to be in iCloud only. Download it in Photos first, then re-import.
import.unsupportedTitle=Video cannot be opened
import.unsupportedBody=The selected file is unsupported or corrupted. Try another video.
import.relinkButton=Relink Asset
import.doneButton=Open Editor
editor.addRegion=Add Region
editor.regions=Regions
editor.params=Params
editor.keyframes=Keyframes
editor.view=View
editor.undo=Undo
editor.redo=Redo
editor.noTrackTitle=No active region
editor.noTrackBody=Select a region to adjust parameters and keyframes.
editor.previewUnavailable=Preview unavailable
editor.fitToScreen=Fit to screen
editor.addKeyframe=Add keyframe
editor.deleteKeyframe=Delete keyframe
editor.snapHint=Snapped to keyframe
editor.precisionOn=Precision timeline enabled
editor.precisionOff=Precision timeline disabled
editor.markerMenuTitle=Keyframe options
editor.jumpToMarker=Jump to marker
editor.editMarker=Edit interpolation
editor.deleteMarker=Delete marker
editor.faceTemplate=Face area
editor.plateTemplate=Plate area
editor.rectangle=Rectangle
editor.roundedRect=Rounded Rect
editor.ellipse=Ellipse
editor.path=Path
editor.removeRegion=Remove Region
editor.saveAsTemplate=Save as Template
editor.saveTemplateTitle=Save Region Template
editor.templateNameLabel=Template Name
editor.templateNamePlaceholder=Face blur
editor.templateCategoryLabel=Category
editor.templateCategoryPlaceholder=General
editor.templateDefaultCategory=General
editor.applyTemplate=Apply Template
editor.applyTemplateTitle=Apply Template
editor.noTemplatesYet=No saved templates yet.
editor.removeAllRegions=Remove All Regions
editor.playPreview=Play Preview
editor.pausePreview=Pause Preview
params.strength=Strength
params.feather=Feather
params.opacity=Opacity
params.positionX=Horizontal Position
params.positionY=Vertical Position
params.width=Width
params.height=Height
params.rotation=Rotation
params.cornerRadius=Corner Radius
params.blendMode=Blend mode
params.gaussian=Gaussian
params.bokeh=Bokeh
params.motionBlur=Motion Blur
params.bilateral=Bilateral
params.smartBlur=Smart Blur
params.radial=Radial
keyframes.interpolation=Interpolation
keyframes.linear=Linear
keyframes.easeInOut=Ease
keyframes.spring=Spring
keyframes.hold=Hold
keyframes.parameterControl=Parameters
view.previewQuality=Preview quality
view.guides=Guides
view.thumbnails=Thumbnails
view.safeAreaOverlay=Safe area overlay
view.ultra=Ultra
view.balanced=Balanced
view.smooth=Smooth
export.startButton=Start Export
export.cancelButton=Cancel Export
export.successTitle=Export complete
export.successBody=Video saved to your photo library path.
export.settingsTitle=Export settings
export.stageDecoding=Decoding
export.stageApplying=Applying blur
export.stageEncoding=Encoding
export.stageSaving=Saving
export.hdrWarning=HDR preservation is unavailable in fallback mode. The output will be converted to SDR.
export.lowStorageTitle=Not enough free space
export.lowStorageBody=Free up storage and try export again.
export.toggleSettings=Toggle export settings
export.codecLabel=Codec
export.codecH264=H.264
export.codecHevc=HEVC
export.framerateLabel=Framerate
export.resolutionLabel=Resolution
export.resolution4k=4K
export.includeAudioLabel=Include audio
export.includeAudioOn=Audio on
export.includeAudioOff=Audio off
export.cancelledLabel=Cancelled
export.failedLabel=Failed
settings.appearance=Appearance
settings.motion=Motion
settings.preview=Preview
settings.export=Export
settings.storage=Storage
settings.about=About
settings.appearanceSystem=Match iOS
settings.appearanceDark=Dark
settings.appearanceLight=Light
settings.reduceMotionSystem=Use iOS setting
settings.reduceMotionOn=Reduced motion on
settings.reduceMotionOff=Reduced motion off
settings.accentColor=Accent color
settings.previewQualityDefault=Default preview quality
settings.autoThumbs=Generate thumbnails on import
settings.safeAreaDefault=Show safe area overlay by default
settings.clearCache=Clear cache
settings.cleanTrash=Clean Trash
settings.cleanTrashTitle=Clean Trash?
settings.cleanTrashBody=Permanently remove all projects from Trash.
settings.storageUsage=Estimated project cache
settings.projectsCached=Projects cached
settings.version=Version
settings.offlineOnly=Offline only workflow. No network upload.
settings.accentColorOption=Accent color {color}
edgeCases.largeVideoSwitched=Large 4K source detected. Preview switched to Smooth mode for stable playback.
edgeCases.backgroundPaused=Preview paused in background
edgeCases.backgroundExportContinues=Export continues in background task mode
edgeCases.backgroundExportPaused=Export paused in background mode
edgeCases.assetUnavailableTitle=Asset unavailable
edgeCases.assetUnavailableBody=The source video is no longer available locally. Relink the original to continue.
accessibility.projectCard=Project card
accessibility.addRegionButton=Add blur region
accessibility.timeline=Timeline scrubber
accessibility.playhead=Timeline playhead
accessibility.exportProgress=Export progress ring
accessibility.settingsButton=Open settings
accessibility.importButton=Import video
accessibility.timelineModePrecision=Precision mode
accessibility.timelineModeStandard=Standard mode
accessibility.previewStubTitle=BlurioPreviewView native renderer stub
accessibility.selectTrack=Select {name}
accessibility.deleteTrack=Delete {name}
accessibility.toggleVisibility=Toggle visibility {name}
accessibility.toggleLock=Toggle lock {name}
accessibility.openPanel=Open {name} panel
accessibility.collapseSheet=Collapse {name}
accessibility.adjustTrackStart=Adjust start of {name}
accessibility.adjustTrackEnd=Adjust end of {name}
accessibility.keyframeAt=Keyframe {time}
accessibility.keyframeParameter={name} keyframe parameter
accessibility.continueAfterTestimonials=Continue after testimonials
app.photoLibraryUsage=Blurio needs photo library access to import videos for offline blur editing.
app.photoLibraryAddUsage=Blurio needs permission to save exported videos to your library.
app.playbackFailed=Playback failed
app.previewError=Preview error
naming.projectDefault=Project {date}
naming.regionDefault=Region {index}
naming.copySuffix={name} copy
naming.templateDefault={name} Template
onboarding.ui.defaultGoalPhrase=protect what matters
onboarding.ui.welcomeBadge=Offline privacy workflow
onboarding.ui.welcomeTitle=Share the clip, not the private details.
onboarding.ui.welcomeBody=Blur faces, plates, addresses, and badges on-device before anything leaves your phone.
onboarding.ui.previewFaceChip=Face
onboarding.ui.welcomeMetricPrivate=Private by default
onboarding.ui.welcomeMetricNoUpload=No upload-first workflow
onboarding.ui.welcomeMetricFastPresets=Fast blur presets
onboarding.ui.goalTitle=What are you here to protect first?
onboarding.ui.goalLead=Pick the one outcome that would make Blurio immediately useful.
onboarding.ui.painsTitle=What gets in the way of {goal}?
onboarding.ui.painsLead=Pick every frustration that feels true right now.
onboarding.ui.proofTitle=People use Blurio for the exact same reason.
onboarding.ui.proofLead=These are placeholder testimonials for now, but they match the job this app is already built to do.
onboarding.ui.statementsTitle=Which of these sounds familiar?
onboarding.ui.statementsLead=Quick gut reaction. We are building around the friction you actually feel.
onboarding.ui.statementProgress=Card {current} of {total}
onboarding.ui.solutionTitle=Here is the smarter way through it.
onboarding.ui.solutionLead=Blurio is strongest when the job is simple: protect the frame, preview it live, and export without a privacy handoff.
onboarding.ui.comparisonTitle=Keep the workflow private and short
onboarding.ui.comparisonWhatMatters=What matters
onboarding.ui.comparisonWithApp=Blurio
onboarding.ui.comparisonWithout=Without
onboarding.ui.preferencesTitle=Which blur presets should be ready first?
onboarding.ui.preferencesLead=Pick the details you hide most often and the demo will adapt to them.
onboarding.ui.preferencesSummaryEyebrow=Tailored for your first demo
onboarding.ui.preferencesSummaryTitle=Choose your starter blur targets.
onboarding.ui.preferencesSummaryBody=These picks shape the walkthrough below and can be changed later.
onboarding.ui.preferencesBestMatches=Best matches:
onboarding.ui.preferencesRecommended=Recommended
onboarding.ui.preferencesIncluded=Included in demo
onboarding.ui.preferencesTapToInclude=Tap to include
onboarding.ui.permissionsTitle=Bring clips in and save them back privately.
onboarding.ui.permissionsLead=Blurio uses Photos access so you can import a video, blur the right details, and save the cleaned version back out.
onboarding.ui.permissionsImport=Import from Photos in one tap
onboarding.ui.permissionsExport=Export private-ready edits back to your library
onboarding.ui.permissionsSystemPrompts=System prompts stay attached to the real task
onboarding.ui.permissionsFooter=Blurio will ask when you import and save your first clip.
onboarding.ui.processingTitle=Building your privacy starter pack…
onboarding.ui.processingLead=Setting up the fastest path for {goal}.
onboarding.ui.processingSelected=Focused blur presets selected
onboarding.ui.processingOnDevice=On-device workflow confirmed
onboarding.ui.processingDemoQueued=First demo scenes queued
onboarding.ui.demoTitle=Try the core interaction before you commit.
onboarding.ui.demoLead=Pick {count} details you would blur first. This is the smallest version of Blurio’s real loop.
onboarding.ui.demoSelected={selected} of {total} selected
onboarding.ui.demoReadyTitle=Your starter pack is ready.
onboarding.ui.demoReadyBody=Moving to the result view now.
onboarding.ui.valueTitle=Your first privacy-ready setup is built.
onboarding.ui.valueLead=This is the output moment: a focused starter pack for the exact details you want to protect.
onboarding.ui.valueEyebrow=Ready for your first real clip
onboarding.ui.valueCardTitle=Blurio Starter Pack
onboarding.ui.valueMetricOnDeviceTitle=On-device
onboarding.ui.valueMetricOnDeviceBody=No upload-first privacy workflow
onboarding.ui.valueMetricExportTitle=Export control
onboarding.ui.valueMetricExportBody=Resolution, codec, and audio stay editable
onboarding.ui.paywallEyebrow=Placeholder paywall
onboarding.ui.paywallTitle=Keep every private edit in one fast workflow.
onboarding.ui.paywallLead=Blurio does not have subscription wiring yet, so this screen is a polished placeholder ready for your purchase SDK.
onboarding.ui.paywallTrialTitle=7-day free trial
onboarding.ui.paywallTrialPrice=then $29.99/year
onboarding.ui.paywallReviewTitle=“The fastest way to make a clip share-safe.”
onboarding.ui.paywallReviewBody=Placeholder review until you replace this with a real subscriber quote.
onboarding.ui.footerWelcome=Make my first private edit
onboarding.ui.footerGoal=This is why I downloaded Blurio
onboarding.ui.footerPains=Show me the better workflow
onboarding.ui.footerNotReally=Not really
onboarding.ui.footerThatIsMe=That is me
onboarding.ui.footerSolution=Set up my blur starter pack
onboarding.ui.footerPreferences=Build my starter pack
onboarding.ui.footerReady=I am ready
onboarding.ui.footerSkipThis=Skip this
onboarding.ui.footerBlurIt=Blur it
onboarding.ui.footerPlans=Show me the plans
onboarding.ui.footerShare=Share my setup
onboarding.ui.footerStartTrial=Start 7-day trial
onboarding.ui.footerContinueFree=Continue with free tools
onboarding.ui.shareSetupFallback=private details
onboarding.ui.shareSetupMessage=I just set up Blurio to protect {labels} before I share video.
onboarding.content.goals.faces-fast.title=Hide faces fast
onboarding.content.goals.faces-fast.goalPhrase=hiding faces fast
onboarding.content.goals.faces-fast.body=Make people unrecognizable before a clip ever leaves your phone.
onboarding.content.goals.cover-plates.title=Cover plates and street details
onboarding.content.goals.cover-plates.goalPhrase=covering plates and street details
onboarding.content.goals.cover-plates.body=Blur car plates, building numbers, and other identifiers in one pass.
onboarding.content.goals.protect-family.title=Protect family footage
onboarding.content.goals.protect-family.goalPhrase=protecting family footage
onboarding.content.goals.protect-family.body=Keep kids, homes, and everyday moments private before sharing.
onboarding.content.goals.client-footage.title=Clean up client clips on the go
onboarding.content.goals.client-footage.goalPhrase=cleaning up client clips on the go
onboarding.content.goals.client-footage.body=Handle fast privacy edits without opening a desktop editor.
onboarding.content.goals.stay-offline.title=Keep raw footage offline
onboarding.content.goals.stay-offline.goalPhrase=keeping raw footage offline
onboarding.content.goals.stay-offline.body=Avoid sending sensitive videos to cloud-first tools.
onboarding.content.goals.ship-faster.title=Get to export quicker
onboarding.content.goals.ship-faster.goalPhrase=getting to export quicker
onboarding.content.goals.ship-faster.body=Turn a privacy fix into a short mobile workflow instead of a full session.
onboarding.content.pains.cloud-risk.title=I do not want to upload private footage
onboarding.content.pains.cloud-risk.body=Cloud tools feel wrong for raw videos with faces, plates, or addresses.
onboarding.content.pains.too-slow.title=Frame-by-frame edits take too long
onboarding.content.pains.too-slow.body=A quick privacy fix turns into a full editing session.
onboarding.content.pains.too-complex.title=Most editors feel heavier than I need
onboarding.content.pains.too-complex.body=I only want the privacy tools, not an entire post-production workflow.
onboarding.content.pains.miss-detail.title=I am worried I will miss one detail
onboarding.content.pains.miss-detail.body=One plate, badge, or face slipping through is enough to ruin the post.
onboarding.content.pains.quality-loss.title=Other apps wreck quality or exports
onboarding.content.pains.quality-loss.body=I still want control over resolution, codec, and audio.
onboarding.content.pains.mobile-workflow.title=I need to finish edits on my phone
onboarding.content.pains.mobile-workflow.body=The fix has to happen wherever I am, not later at a desk.
onboarding.content.testimonials.parent.persona=Family creator
onboarding.content.testimonials.parent.quote=Placeholder review: I can hide kids and house details before I post, and I never have to send the raw clip anywhere.
onboarding.content.testimonials.rideshare.persona=Street videographer
onboarding.content.testimonials.rideshare.quote=Placeholder review: Blurio makes number plates and background faces feel like a 30-second fix instead of a desktop job.
onboarding.content.testimonials.freelance.persona=Freelance editor
onboarding.content.testimonials.freelance.quote=Placeholder review: When a client needs a quick privacy pass, I can handle it from my phone and still export cleanly.
onboarding.content.statements.delay-posting=I delay posting because I still need to hide something personal in the frame.
onboarding.content.statements.zoom-check=I zoom in again and again because I am afraid I missed a face, plate, or address.
onboarding.content.statements.privacy-tools=Sending private footage to an online editor feels like the opposite of privacy.
onboarding.content.statements.overkill=Most editing apps turn a tiny privacy fix into a whole project.
onboarding.content.preferences.face.title=Faces
onboarding.content.preferences.face.body=People in the foreground, crowds, and accidental passersby.
onboarding.content.preferences.plate.title=License plates
onboarding.content.preferences.plate.body=Cars, motorcycles, and anything parked in the background.
onboarding.content.preferences.address.title=Street numbers
onboarding.content.preferences.address.body=House numbers, mailboxes, building names, and doors.
onboarding.content.preferences.badge.title=Badges and IDs
onboarding.content.preferences.badge.body=Work tags, access cards, and visible credentials.
onboarding.content.preferences.document.title=Documents and screens
onboarding.content.preferences.document.body=Paperwork, monitors, receipts, and anything readable.
onboarding.content.preferences.tattoo.title=Distinctive marks
onboarding.content.preferences.tattoo.body=Tattoos, logos, uniforms, and recognizable details.
onboarding.content.solutions.cloud-risk.eyebrow=Need more privacy?
onboarding.content.solutions.cloud-risk.headline=Keep the whole workflow on-device from import to export.
onboarding.content.solutions.cloud-risk.detail=Blurio is built for local edits, so your raw clip does not need a cloud handoff.
onboarding.content.solutions.too-slow.eyebrow=Need more speed?
onboarding.content.solutions.too-slow.headline=Create a blur region and see it working before you leave the screen.
onboarding.content.solutions.too-slow.detail=The live preview trims the back-and-forth that makes privacy fixes drag on.
onboarding.content.solutions.too-complex.eyebrow=Need less friction?
onboarding.content.solutions.too-complex.headline=Open one video, place the blur, and keep moving.
onboarding.content.solutions.too-complex.detail=The workflow stays focused on privacy edits instead of full production controls.
onboarding.content.solutions.miss-detail.eyebrow=Need more confidence?
onboarding.content.solutions.miss-detail.headline=Stack multiple blur regions and scrub the timeline before export.
onboarding.content.solutions.miss-detail.detail=You can check the exact frame where a face, plate, or badge appears.
onboarding.content.solutions.quality-loss.eyebrow=Need cleaner output?
onboarding.content.solutions.quality-loss.headline=Tune export quality before you save the final clip.
onboarding.content.solutions.quality-loss.detail=Resolution, frame rate, codec, and audio settings stay under your control.
onboarding.content.solutions.mobile-workflow.eyebrow=Need it done on the go?
onboarding.content.solutions.mobile-workflow.headline=Handle a privacy edit from the same phone you filmed with.
onboarding.content.solutions.mobile-workflow.detail=Import from Photos, blur what matters, and save the cleaned version back out.
onboarding.content.demo.face.title=Busy sidewalk selfie
onboarding.content.demo.face.subtitle=Blur the bystander before you share the moment.
onboarding.content.demo.face.label=Face blur
onboarding.content.demo.face.detail=Tap to hide the stranger in the background with a soft privacy mask.
onboarding.content.demo.plate.title=Street reel with parked cars
onboarding.content.demo.plate.subtitle=Cover the visible plate before the post goes live.
onboarding.content.demo.plate.label=Plate blur
onboarding.content.demo.plate.detail=Use a plate-safe region so the scene still reads cleanly after export.
onboarding.content.demo.address.title=Front door delivery clip
onboarding.content.demo.address.subtitle=Hide the building number in one quick pass.
onboarding.content.demo.address.label=Address blur
onboarding.content.demo.address.detail=Drop a rounded blur over the number so the location stays private.
onboarding.content.demo.badge.title=Backstage team update
onboarding.content.demo.badge.subtitle=Blur the access badge without re-editing the whole video.
onboarding.content.demo.badge.label=Badge blur
onboarding.content.demo.badge.detail=Mask the credential while keeping the rest of the shot untouched.
onboarding.content.demo.document.title=Desk clip with paperwork
onboarding.content.demo.document.subtitle=Hide the readable details before the clip leaves your phone.
onboarding.content.demo.document.label=Document blur
onboarding.content.demo.document.detail=Protect names and numbers without rebuilding the entire scene.
onboarding.content.demo.tattoo.title=Behind-the-scenes portrait
onboarding.content.demo.tattoo.subtitle=Soften a distinctive mark that could identify the subject.
onboarding.content.demo.tattoo.label=Detail blur
onboarding.content.demo.tattoo.detail=Keep the shot usable while removing one identifying element.
onboarding.content.paywall.features.1=Unlimited privacy edits and project history
onboarding.content.paywall.features.2=Reusable blur templates for the details you hide most
onboarding.content.paywall.features.3=Future pro blur tools and faster export presets
onboarding.content.comparison.privacy.label=Raw footage stays private
onboarding.content.comparison.privacy.withApp=On-device workflow
onboarding.content.comparison.privacy.withoutApp=Often needs cloud upload
onboarding.content.comparison.speed.label=Quick phone-first fix
onboarding.content.comparison.speed.withApp=Focused privacy workflow
onboarding.content.comparison.speed.withoutApp=Full editor overhead
onboarding.content.comparison.confidence.label=Check every sensitive detail
onboarding.content.comparison.confidence.withApp=Timeline scrub + stacked regions
onboarding.content.comparison.confidence.withoutApp=Easy to miss one frame
`);

const ZH_HANS_TRANSLATIONS = parseTranslations(`
common.cancel=取消
common.close=关闭
common.confirm=确认
common.save=保存
common.delete=删除
common.remove=移除
common.duplicate=复制
common.rename=重命名
common.done=完成
common.retry=重试
common.continue=继续
common.back=返回
common.noProjectSelected=未选择项目。
common.settings=设置
common.import=导入
common.export=导出
common.disabled=已关闭
common.enabled=已开启
common.yes=是
common.no=否
navigation.homeTitle=项目
navigation.importTitle=导入视频
navigation.editorTitle=编辑器
navigation.exportTitle=导出
navigation.settingsTitle=设置
home.openSettings=打开设置
home.emptyTitle=还没有项目
home.emptyBody=先导入一个视频，开始添加模糊区域。
home.emptyButton=创建第一个项目
home.createProjectFab=创建新项目
home.contextTitle=项目操作
home.longPressHint=长按查看项目操作
home.duplicateAction=复制项目
home.deleteAction=删除项目
home.renameAction=重命名
home.moveToFolderAction=移到文件夹
home.removeAction=移除
home.recoverAction=恢复
home.removePermanentlyAction=永久删除
home.openAction=打开编辑器
home.deleteConfirmTitle=删除项目？
home.deleteConfirmBody=这会从本机移除项目元数据和缓存预览。
home.removeConfirmTitle=将项目移到废纸篓？
home.removeConfirmBody=之后仍可从废纸篓恢复。
home.allProjectsFolder=所有项目
home.trashFolder=废纸篓
home.defaultFolderName=项目
home.renameProjectTitle=重命名项目
home.renameProjectPlaceholder=项目名称
home.renameFolderTitle=重命名文件夹
home.renameFolderPlaceholder=文件夹名称
home.createFolderTitle=新建文件夹
home.createFolderPlaceholder=文件夹名称
home.newFolderAction=新建文件夹...
home.removeFolderConfirmTitle=移除文件夹？
home.removeFolderConfirmBody=该文件夹内的项目将被移到其他文件夹。
home.emptyTrashTitle=废纸篓为空
home.noFolderTargets=没有其他文件夹
import.pickButton=从照片中选择
import.preparing=正在准备预览
import.preparingBody=正在生成缩略图和本地元数据
import.iCloudWarningTitle=资源尚未完全下载
import.iCloudWarningBody=该视频目前似乎仅存于 iCloud。请先在“照片”中下载，再重新导入。
import.unsupportedTitle=无法打开视频
import.unsupportedBody=所选文件不受支持或已损坏。请换一个视频试试。
import.relinkButton=重新关联资源
import.doneButton=打开编辑器
export.startButton=开始导出
export.cancelButton=取消导出
export.successTitle=导出完成
export.successBody=视频已保存到你的照片库路径。
export.settingsTitle=导出设置
export.stageDecoding=解码中
export.stageApplying=正在应用模糊
export.stageEncoding=编码中
export.stageSaving=保存中
export.hdrWarning=回退模式下无法保留 HDR，输出将转换为 SDR。
export.lowStorageTitle=可用空间不足
export.lowStorageBody=请先释放存储空间后再试。
export.toggleSettings=切换导出设置
export.codecLabel=编码格式
export.framerateLabel=帧率
export.resolutionLabel=分辨率
export.includeAudioLabel=包含音频
export.includeAudioOn=音频开启
export.includeAudioOff=音频关闭
export.cancelledLabel=已取消
export.failedLabel=失败
settings.appearance=外观
settings.motion=动态效果
settings.preview=预览
settings.export=导出
settings.storage=存储
settings.about=关于
settings.appearanceSystem=跟随 iOS
settings.appearanceDark=深色
settings.appearanceLight=浅色
settings.reduceMotionSystem=跟随 iOS 设置
settings.reduceMotionOn=减少动态效果
settings.reduceMotionOff=正常动态效果
settings.accentColor=强调色
settings.previewQualityDefault=默认预览质量
settings.autoThumbs=导入时生成缩略图
settings.safeAreaDefault=默认显示安全区域遮罩
settings.clearCache=清除缓存
settings.cleanTrash=清空废纸篓
settings.cleanTrashTitle=清空废纸篓？
settings.cleanTrashBody=永久删除废纸篓中的所有项目。
settings.storageUsage=预计项目缓存
settings.projectsCached=缓存项目数
settings.version=版本
settings.offlineOnly=全程离线处理，不会上传到网络。
settings.accentColorOption=强调色 {color}
onboarding.ui.defaultGoalPhrase=先保护最重要的内容
onboarding.ui.welcomeBadge=离线隐私流程
onboarding.ui.welcomeTitle=分享画面，不泄露隐私。
onboarding.ui.welcomeBody=在人脸、车牌、地址或工牌离开手机之前，先在本机完成模糊处理。
onboarding.ui.previewFaceChip=人脸
onboarding.ui.welcomeMetricPrivate=默认更私密
onboarding.ui.welcomeMetricNoUpload=无需先上传
onboarding.ui.welcomeMetricFastPresets=快速模糊预设
onboarding.ui.goalTitle=你最想先保护什么？
onboarding.ui.goalLead=选一个结果，让 Blurio 立刻变得有用。
onboarding.ui.painsTitle=是什么在阻碍你 {goal}？
onboarding.ui.painsLead=把现在最真实的困扰都选出来。
onboarding.ui.proofTitle=很多人用 Blurio，原因和你完全一样。
onboarding.ui.proofLead=这些评价现在还是占位文案，但它们和这款 app 已经能完成的事情是对得上的。
onboarding.ui.statementsTitle=哪些话你很有共鸣？
onboarding.ui.statementsLead=凭直觉选。我们会围绕你真正感受到的阻力来设计体验。
onboarding.ui.statementProgress=第 {current} 张，共 {total} 张
onboarding.ui.solutionTitle=这就是更聪明的做法。
onboarding.ui.solutionLead=Blurio 最适合做简单直接的事：保护画面、实时预览、无需隐私外包就能导出。
onboarding.ui.comparisonTitle=让整个流程既私密又利落
onboarding.ui.comparisonWhatMatters=你关心的点
onboarding.ui.comparisonWithApp=Blurio
onboarding.ui.comparisonWithout=没有它
onboarding.ui.preferencesTitle=你希望先准备好哪些模糊预设？
onboarding.ui.preferencesLead=选出你最常要遮挡的内容，下面的演示会跟着调整。
onboarding.ui.preferencesSummaryEyebrow=为你的首次演示定制
onboarding.ui.preferencesSummaryTitle=选择你的起步模糊目标。
onboarding.ui.preferencesSummaryBody=这些选择会决定接下来的演示流程，之后也能随时改。
onboarding.ui.preferencesBestMatches=最匹配：
onboarding.ui.preferencesRecommended=推荐
onboarding.ui.preferencesIncluded=已加入演示
onboarding.ui.preferencesTapToInclude=点按加入
onboarding.ui.permissionsTitle=私密地导入素材，再私密地保存回去。
onboarding.ui.permissionsLead=Blurio 需要“照片”权限，这样你就能导入视频、模糊敏感内容，再把处理后的版本存回去。
onboarding.ui.permissionsImport=一键从照片导入
onboarding.ui.permissionsExport=将处理好的私密版本导回资料库
onboarding.ui.permissionsSystemPrompts=系统授权提示会紧贴真实操作出现
onboarding.ui.permissionsFooter=第一次导入和保存视频时，Blurio 会向你请求权限。
onboarding.ui.processingTitle=正在为你生成隐私起步包…
onboarding.ui.processingLead=正在为你安排最快的 {goal} 路径。
onboarding.ui.processingSelected=已选好重点模糊预设
onboarding.ui.processingOnDevice=已确认本机处理流程
onboarding.ui.processingDemoQueued=首批演示场景已准备好
onboarding.ui.demoTitle=先试试核心操作，再决定要不要继续。
onboarding.ui.demoLead=先选出你最想模糊的 {count} 类内容。这就是 Blurio 真正流程的最小版本。
onboarding.ui.demoSelected=已选 {selected} / {total}
onboarding.ui.demoReadyTitle=你的起步包已经准备好了。
onboarding.ui.demoReadyBody=现在即将进入结果页。
onboarding.ui.valueTitle=你的首个隐私就绪配置已生成。
onboarding.ui.valueLead=这就是成果时刻：一套只针对你最想保护内容的起步方案。
onboarding.ui.valueEyebrow=准备好处理你的第一支真实视频
onboarding.ui.valueCardTitle=Blurio 起步包
onboarding.ui.valueMetricOnDeviceTitle=本机处理
onboarding.ui.valueMetricOnDeviceBody=不需要先上传再处理隐私内容
onboarding.ui.valueMetricExportTitle=导出可控
onboarding.ui.valueMetricExportBody=分辨率、编码和音频都还能自己调
onboarding.ui.paywallEyebrow=占位付费页
onboarding.ui.paywallTitle=把每一次隐私修正都放进一个顺手的流程里。
onboarding.ui.paywallLead=Blurio 还没有接入订阅购买，这一页目前是一个打磨好的占位稿，等你接上购买 SDK 即可。
onboarding.ui.paywallTrialTitle=7 天免费试用
onboarding.ui.paywallTrialPrice=之后每年 $29.99
onboarding.ui.paywallReviewTitle=“把视频处理成可放心分享的状态，最快的方式就是它。” 
onboarding.ui.paywallReviewBody=这里暂时还是占位评价，之后换成真实订阅用户的反馈即可。
onboarding.ui.footerWelcome=开始我的第一次隐私处理
onboarding.ui.footerGoal=这就是我下载 Blurio 的原因
onboarding.ui.footerPains=让我看看更好的流程
onboarding.ui.footerNotReally=不太像
onboarding.ui.footerThatIsMe=这就是我
onboarding.ui.footerSolution=为我设置模糊起步包
onboarding.ui.footerPreferences=生成我的起步包
onboarding.ui.footerReady=我准备好了
onboarding.ui.footerSkipThis=跳过这个
onboarding.ui.footerBlurIt=就模糊它
onboarding.ui.footerPlans=看看方案
onboarding.ui.footerShare=分享我的设置
onboarding.ui.footerStartTrial=开始 7 天试用
onboarding.ui.footerContinueFree=继续使用免费工具
onboarding.ui.shareSetupFallback=隐私细节
onboarding.ui.shareSetupMessage=我刚用 Blurio 配好了 {labels} 的隐私保护，再分享视频会安心很多。
onboarding.content.goals.faces-fast.title=快速遮住人脸
onboarding.content.goals.faces-fast.goalPhrase=快速遮住人脸
onboarding.content.goals.faces-fast.body=让人物在视频离开手机前就无法被认出来。
onboarding.content.goals.cover-plates.title=遮住车牌和街景细节
onboarding.content.goals.cover-plates.goalPhrase=遮住车牌和街景细节
onboarding.content.goals.cover-plates.body=一次性模糊车牌、门牌号和其他识别信息。
onboarding.content.goals.protect-family.title=保护家人影像
onboarding.content.goals.protect-family.goalPhrase=保护家人影像
onboarding.content.goals.protect-family.body=在分享前先把孩子、住址和日常画面保护好。
onboarding.content.goals.client-footage.title=随时处理客户素材
onboarding.content.goals.client-footage.goalPhrase=随时处理客户素材
onboarding.content.goals.client-footage.body=不用打开桌面剪辑软件，也能快速完成隐私修正。
onboarding.content.goals.stay-offline.title=让原始素材始终离线
onboarding.content.goals.stay-offline.goalPhrase=让原始素材始终离线
onboarding.content.goals.stay-offline.body=避免把敏感视频交给以云端为先的工具。
onboarding.content.goals.ship-faster.title=更快导出成片
onboarding.content.goals.ship-faster.goalPhrase=更快导出成片
onboarding.content.goals.ship-faster.body=把隐私修正变成一个简短的手机流程，而不是完整剪辑流程。
onboarding.content.pains.cloud-risk.title=我不想上传私密素材
onboarding.content.pains.cloud-risk.body=带有人脸、车牌或地址的原始视频，放到云端总觉得不踏实。
onboarding.content.pains.too-slow.title=逐帧处理太耗时间
onboarding.content.pains.too-slow.body=本来只是一个小小的隐私修正，却变成了完整剪辑工作。
onboarding.content.pains.too-complex.title=大多数编辑器都比我需要的更重
onboarding.content.pains.too-complex.body=我只想要隐私处理工具，不需要整个后期制作工作流。
onboarding.content.pains.miss-detail.title=我担心漏掉某个细节
onboarding.content.pains.miss-detail.body=漏掉一个车牌、工牌或人脸，就足以毁掉这条内容。
onboarding.content.pains.quality-loss.title=其他 app 会毁掉画质或导出
onboarding.content.pains.quality-loss.body=我还是想自己控制分辨率、编码和音频。
onboarding.content.pains.mobile-workflow.title=我需要直接在手机上收尾
onboarding.content.pains.mobile-workflow.body=修正必须当下就能完成，而不是等回到电脑前。
onboarding.content.testimonials.parent.persona=家庭内容创作者
onboarding.content.testimonials.parent.quote=占位评价：我能在发出去之前先遮住孩子和家里的细节，而且原视频根本不用传到任何地方。
onboarding.content.testimonials.rideshare.persona=街头视频创作者
onboarding.content.testimonials.rideshare.quote=占位评价：Blurio 让车牌和路人脸的处理变成 30 秒的小动作，不再是桌面端的大工程。
onboarding.content.testimonials.freelance.persona=自由剪辑师
onboarding.content.testimonials.freelance.quote=占位评价：客户临时要补一个隐私处理，我直接在手机上就能搞定，导出也依然干净。
onboarding.content.statements.delay-posting=我总会拖到最后，因为画面里还有某个私人信息没有遮掉。
onboarding.content.statements.zoom-check=我会一遍又一遍放大检查，怕漏掉一张脸、一块车牌或一个地址。
onboarding.content.statements.privacy-tools=把私密素材交给在线编辑器，感觉和“隐私”完全是反着来的。
onboarding.content.statements.overkill=很多剪辑 app 会把一个很小的隐私修正，做成一个完整项目。
onboarding.content.preferences.face.title=人脸
onboarding.content.preferences.face.body=前景人物、人群和意外入镜的路人。
onboarding.content.preferences.plate.title=车牌
onboarding.content.preferences.plate.body=汽车、摩托车，以及背景里停着的任何车辆。
onboarding.content.preferences.address.title=门牌号
onboarding.content.preferences.address.body=门牌、邮箱、楼名和门口信息。
onboarding.content.preferences.badge.title=工牌和证件
onboarding.content.preferences.badge.body=工作证、门禁卡和所有可辨认的凭证。
onboarding.content.preferences.document.title=文件和屏幕
onboarding.content.preferences.document.body=纸张、显示器、小票，以及一切能看清内容的东西。
onboarding.content.preferences.tattoo.title=显著特征
onboarding.content.preferences.tattoo.body=纹身、Logo、制服以及容易识别身份的细节。
onboarding.content.solutions.cloud-risk.eyebrow=想要更私密？
onboarding.content.solutions.cloud-risk.headline=从导入到导出，全流程都留在设备本机。
onboarding.content.solutions.cloud-risk.detail=Blurio 就是为本地处理而生，你的原始视频不需要经过云端中转。
onboarding.content.solutions.too-slow.eyebrow=想更快一点？
onboarding.content.solutions.too-slow.headline=画出一个模糊区域，离开当前页面前就能看到效果。
onboarding.content.solutions.too-slow.detail=实时预览省掉来回反复，隐私修正不会再越拖越久。
onboarding.content.solutions.too-complex.eyebrow=想少一点负担？
onboarding.content.solutions.too-complex.headline=打开一个视频，放好模糊，继续往下走。
onboarding.content.solutions.too-complex.detail=整个流程只围绕隐私修正，不会被完整后期控制项拖慢。
onboarding.content.solutions.miss-detail.eyebrow=想更有把握？
onboarding.content.solutions.miss-detail.headline=叠加多个模糊区域，导出前沿时间线逐帧检查。
onboarding.content.solutions.miss-detail.detail=人脸、车牌或工牌出现在哪一帧，你都能精确确认。
onboarding.content.solutions.quality-loss.eyebrow=想让输出更干净？
onboarding.content.solutions.quality-loss.headline=在保存最终视频前，自己调好导出质量。
onboarding.content.solutions.quality-loss.detail=分辨率、帧率、编码和音频，全都由你掌控。
onboarding.content.solutions.mobile-workflow.eyebrow=想边走边完成？
onboarding.content.solutions.mobile-workflow.headline=用拍摄视频的那部手机，直接完成隐私修正。
onboarding.content.solutions.mobile-workflow.detail=从“照片”导入，模糊该遮的内容，再把处理好的版本存回去。
onboarding.content.demo.face.title=繁忙人行道自拍
onboarding.content.demo.face.subtitle=分享这一刻之前，先把路人遮掉。
onboarding.content.demo.face.label=人脸模糊
onboarding.content.demo.face.detail=轻点一下，就能用柔和的隐私遮罩盖住背景里的陌生人。
onboarding.content.demo.plate.title=街头短片与停放车辆
onboarding.content.demo.plate.subtitle=发布前先遮住画面里可见的车牌。
onboarding.content.demo.plate.label=车牌模糊
onboarding.content.demo.plate.detail=用适合车牌的区域模板，导出后场景依旧干净自然。
onboarding.content.demo.address.title=门口快递片段
onboarding.content.demo.address.subtitle=快速一笔，遮住房号。
onboarding.content.demo.address.label=地址模糊
onboarding.content.demo.address.detail=在号码上方放一个圆角模糊，位置就不会暴露。
onboarding.content.demo.badge.title=后台团队更新
onboarding.content.demo.badge.subtitle=不用重剪整条视频，也能把工牌遮掉。
onboarding.content.demo.badge.label=工牌模糊
onboarding.content.demo.badge.detail=只遮住证件信息，其余画面完全保持不动。
onboarding.content.demo.document.title=桌面文件片段
onboarding.content.demo.document.subtitle=在视频离开手机前，先遮住可读内容。
onboarding.content.demo.document.label=文件模糊
onboarding.content.demo.document.detail=不用重做整个场景，也能把名字和数字保护起来。
onboarding.content.demo.tattoo.title=幕后人像
onboarding.content.demo.tattoo.subtitle=柔化一个可能暴露身份的显著标记。
onboarding.content.demo.tattoo.label=细节模糊
onboarding.content.demo.tattoo.detail=保留镜头可用性，同时移除一个明显的识别特征。
onboarding.content.paywall.features.1=无限次隐私处理和项目历史
onboarding.content.paywall.features.2=把最常遮挡的内容保存成可复用模板
onboarding.content.paywall.features.3=未来的专业模糊工具和更快的导出预设
onboarding.content.comparison.privacy.label=原始素材保持私密
onboarding.content.comparison.privacy.withApp=本机处理流程
onboarding.content.comparison.privacy.withoutApp=往往需要上传云端
onboarding.content.comparison.speed.label=快速手机优先修正
onboarding.content.comparison.speed.withApp=聚焦隐私处理流程
onboarding.content.comparison.speed.withoutApp=完整编辑器负担太重
onboarding.content.comparison.confidence.label=检查每一处敏感细节
onboarding.content.comparison.confidence.withApp=时间线检查 + 多区域叠加
onboarding.content.comparison.confidence.withoutApp=很容易漏掉某一帧
app.name=Blurio
app.splashTagline=离线隐私模糊编辑器
app.sourceLabel=来源
app.qualityLabel=质量
common.untitledFolder=未命名文件夹
common.untitledProject=未命名项目
editor.addRegion=添加区域
editor.regions=区域
editor.params=参数
editor.keyframes=关键帧
editor.view=视图
editor.undo=撤销
editor.redo=重做
editor.noTrackTitle=没有激活的区域
editor.noTrackBody=选择一个区域后即可调整参数和关键帧。
editor.previewUnavailable=预览不可用
editor.fitToScreen=适应屏幕
editor.addKeyframe=添加关键帧
editor.deleteKeyframe=删除关键帧
editor.snapHint=已吸附到关键帧
editor.precisionOn=已开启精细时间线
editor.precisionOff=已关闭精细时间线
editor.markerMenuTitle=关键帧选项
editor.jumpToMarker=跳到关键帧
editor.editMarker=编辑插值
editor.deleteMarker=删除关键帧
editor.faceTemplate=人脸区域
editor.plateTemplate=车牌区域
editor.rectangle=矩形
editor.roundedRect=圆角矩形
editor.ellipse=椭圆
editor.path=路径
editor.removeRegion=移除区域
editor.saveAsTemplate=保存为模板
editor.saveTemplateTitle=保存区域模板
editor.templateNameLabel=模板名称
editor.templateNamePlaceholder=人脸模糊
editor.templateCategoryLabel=分类
editor.templateCategoryPlaceholder=通用
editor.templateDefaultCategory=通用
editor.applyTemplate=套用模板
editor.applyTemplateTitle=套用模板
editor.noTemplatesYet=还没有保存的模板。
editor.removeAllRegions=移除所有区域
editor.playPreview=播放预览
editor.pausePreview=暂停预览
params.strength=强度
params.feather=羽化
params.opacity=不透明度
params.positionX=水平位置
params.positionY=垂直位置
params.width=宽度
params.height=高度
params.rotation=旋转
params.cornerRadius=圆角半径
params.blendMode=模糊模式
params.gaussian=高斯
params.bokeh=散景
params.motionBlur=动态模糊
params.bilateral=双边
params.smartBlur=智能模糊
params.radial=径向
keyframes.interpolation=插值
keyframes.linear=线性
keyframes.easeInOut=缓动
keyframes.spring=弹簧
keyframes.hold=保持
keyframes.parameterControl=参数
view.previewQuality=预览质量
view.guides=参考线
view.thumbnails=缩略图
view.safeAreaOverlay=安全区域遮罩
view.ultra=超高
view.balanced=均衡
view.smooth=流畅
export.codecH264=H.264
export.codecHevc=HEVC
export.resolution4k=4K
settings.clearCache=清除缓存
edgeCases.largeVideoSwitched=检测到较大的 4K 视频源。预览已切换到“流畅”模式，以保证稳定播放。
edgeCases.backgroundPaused=预览已在后台暂停
edgeCases.backgroundExportContinues=导出会在后台任务模式下继续
edgeCases.backgroundExportPaused=导出已在后台模式下暂停
edgeCases.assetUnavailableTitle=资源不可用
edgeCases.assetUnavailableBody=源视频已不再保存在本机。请重新关联原始素材后继续。
accessibility.projectCard=项目卡片
accessibility.addRegionButton=添加模糊区域
accessibility.timeline=时间线拖动条
accessibility.playhead=时间线播放头
accessibility.exportProgress=导出进度环
accessibility.settingsButton=打开设置
accessibility.importButton=导入视频
accessibility.timelineModePrecision=精细模式
accessibility.timelineModeStandard=标准模式
accessibility.previewStubTitle=BlurioPreviewView 原生渲染占位视图
accessibility.selectTrack=选择 {name}
accessibility.deleteTrack=删除 {name}
accessibility.toggleVisibility=切换 {name} 的显示状态
accessibility.toggleLock=切换 {name} 的锁定状态
accessibility.openPanel=打开 {name} 面板
accessibility.collapseSheet=收起 {name}
accessibility.adjustTrackStart=调整 {name} 的起点
accessibility.adjustTrackEnd=调整 {name} 的终点
accessibility.keyframeAt=关键帧 {time}
accessibility.keyframeParameter={name} 关键帧参数
accessibility.continueAfterTestimonials=看完评价后继续
app.photoLibraryUsage=Blurio 需要访问照片库，以便导入视频并离线完成模糊编辑。
app.photoLibraryAddUsage=Blurio 需要权限，才能把导出的视频保存到你的资料库。
app.playbackFailed=播放失败
app.previewError=预览出错
naming.projectDefault=项目 {date}
naming.regionDefault=区域 {index}
naming.copySuffix={name} 副本
naming.templateDefault={name} 模板
`);

const JA_TRANSLATIONS = parseTranslations(`
common.cancel=キャンセル
common.close=閉じる
common.confirm=確認
common.save=保存
common.delete=削除
common.remove=削除
common.duplicate=複製
common.rename=名前を変更
common.done=完了
common.retry=再試行
common.continue=続ける
common.back=戻る
common.noProjectSelected=プロジェクトが選択されていません。
common.settings=設定
common.import=読み込み
common.export=書き出し
common.disabled=オフ
common.enabled=オン
common.yes=はい
common.no=いいえ
navigation.homeTitle=プロジェクト
navigation.importTitle=動画を読み込む
navigation.editorTitle=エディタ
navigation.exportTitle=書き出し
navigation.settingsTitle=設定
home.openSettings=設定を開く
home.emptyTitle=まだプロジェクトがありません
home.emptyBody=動画を読み込んで、ぼかしトラックの作成を始めましょう。
home.emptyButton=最初のプロジェクトを作成
home.createProjectFab=新しいプロジェクトを作成
home.contextTitle=プロジェクト操作
home.longPressHint=長押しでプロジェクト操作
home.duplicateAction=プロジェクトを複製
home.deleteAction=プロジェクトを削除
home.renameAction=名前を変更
home.moveToFolderAction=フォルダに移動
home.removeAction=移動
home.recoverAction=元に戻す
home.removePermanentlyAction=完全に削除
home.openAction=エディタを開く
home.deleteConfirmTitle=プロジェクトを削除しますか？
home.deleteConfirmBody=この端末上のメタデータとキャッシュされたプレビューが削除されます。
home.removeConfirmTitle=プロジェクトをゴミ箱へ移動しますか？
home.removeConfirmBody=あとでゴミ箱から復元できます。
home.allProjectsFolder=すべてのプロジェクト
home.trashFolder=ゴミ箱
home.defaultFolderName=プロジェクト
home.renameProjectTitle=プロジェクト名を変更
home.renameProjectPlaceholder=プロジェクト名
home.renameFolderTitle=フォルダ名を変更
home.renameFolderPlaceholder=フォルダ名
home.createFolderTitle=新しいフォルダ
home.createFolderPlaceholder=フォルダ名
home.newFolderAction=新しいフォルダ...
home.removeFolderConfirmTitle=フォルダを削除しますか？
home.removeFolderConfirmBody=このフォルダ内のプロジェクトは別のフォルダへ移動されます。
home.emptyTrashTitle=ゴミ箱は空です
home.noFolderTargets=ほかのフォルダがありません
import.pickButton=写真から選ぶ
import.preparing=プレビューを準備中
import.preparingBody=サムネイルとローカルメタデータを生成しています
import.iCloudWarningTitle=素材がまだ完全にダウンロードされていません
import.iCloudWarningBody=この動画は iCloud のみにあるようです。写真アプリで先にダウンロードしてから再読み込みしてください。
import.unsupportedTitle=動画を開けません
import.unsupportedBody=選択したファイルは未対応か破損しています。別の動画を試してください。
import.relinkButton=素材を再リンク
import.doneButton=エディタを開く
export.startButton=書き出し開始
export.cancelButton=書き出しを中止
export.successTitle=書き出し完了
export.successBody=動画をフォトライブラリの保存先に保存しました。
export.settingsTitle=書き出し設定
export.stageDecoding=デコード中
export.stageApplying=ぼかしを適用中
export.stageEncoding=エンコード中
export.stageSaving=保存中
export.hdrWarning=フォールバックモードでは HDR を保持できません。出力は SDR に変換されます。
export.lowStorageTitle=空き容量が足りません
export.lowStorageBody=容量を空けてから再度書き出してください。
export.toggleSettings=書き出し設定を切り替え
export.codecLabel=コーデック
export.framerateLabel=フレームレート
export.resolutionLabel=解像度
export.includeAudioLabel=音声を含める
export.includeAudioOn=音声あり
export.includeAudioOff=音声なし
export.cancelledLabel=中止しました
export.failedLabel=失敗
settings.appearance=外観
settings.motion=モーション
settings.preview=プレビュー
settings.export=書き出し
settings.storage=ストレージ
settings.about=このアプリについて
settings.appearanceSystem=iOSに合わせる
settings.appearanceDark=ダーク
settings.appearanceLight=ライト
settings.reduceMotionSystem=iOS設定を使う
settings.reduceMotionOn=視差効果を減らす
settings.reduceMotionOff=通常のモーション
settings.accentColor=アクセントカラー
settings.previewQualityDefault=既定のプレビュー品質
settings.autoThumbs=読み込み時にサムネイルを生成
settings.safeAreaDefault=デフォルトでセーフエリアを表示
settings.clearCache=キャッシュを削除
settings.cleanTrash=ゴミ箱を空にする
settings.cleanTrashTitle=ゴミ箱を空にしますか？
settings.cleanTrashBody=ゴミ箱内のすべてのプロジェクトを完全に削除します。
settings.storageUsage=推定プロジェクトキャッシュ
settings.projectsCached=キャッシュ済みプロジェクト
settings.version=バージョン
settings.offlineOnly=完全オフライン処理。ネットワークへのアップロードはありません。
settings.accentColorOption=アクセントカラー {color}
onboarding.ui.defaultGoalPhrase=守りたいものをきちんと守ること
onboarding.ui.welcomeBadge=オフラインのプライバシーワークフロー
onboarding.ui.welcomeTitle=共有するのは映像だけ。個人情報は残さない。
onboarding.ui.welcomeBody=顔、ナンバー、住所、社員証を、何かが端末の外へ出る前にオンデバイスでぼかせます。
onboarding.ui.previewFaceChip=顔
onboarding.ui.welcomeMetricPrivate=最初からプライベート
onboarding.ui.welcomeMetricNoUpload=先にアップロード不要
onboarding.ui.welcomeMetricFastPresets=すぐ使えるぼかしプリセット
onboarding.ui.goalTitle=まず何を守りたいですか？
onboarding.ui.goalLead=Blurio を今すぐ役立つものにしてくれる目的を 1 つ選んでください。
onboarding.ui.painsTitle={goal} を邪魔しているものは何ですか？
onboarding.ui.painsLead=今のあなたに当てはまる悩みをすべて選んでください。
onboarding.ui.proofTitle=同じ理由で Blurio を使っている人がいます。
onboarding.ui.proofLead=いまは仮のレビューですが、このアプリが実際に担っている役割と一致しています。
onboarding.ui.statementsTitle=どれがいちばんしっくりきますか？
onboarding.ui.statementsLead=深く考えすぎなくて大丈夫です。本当に感じている面倒さに合わせて体験を整えます。
onboarding.ui.statementProgress={current} / {total}
onboarding.ui.solutionTitle=もっとスマートなやり方はこちらです。
onboarding.ui.solutionLead=Blurio がいちばん力を発揮するのは、画面を守って、その場で確認し、プライバシーを外に渡さずに書き出すようなシンプルな仕事です。
onboarding.ui.comparisonTitle=短く、そして私的に完結するワークフロー
onboarding.ui.comparisonWhatMatters=重視すること
onboarding.ui.comparisonWithApp=Blurio
onboarding.ui.comparisonWithout=なし
onboarding.ui.preferencesTitle=最初に用意しておきたいぼかしプリセットは？
onboarding.ui.preferencesLead=よく隠す対象を選ぶと、下のデモがそれに合わせて変わります。
onboarding.ui.preferencesSummaryEyebrow=最初のデモ向けに最適化
onboarding.ui.preferencesSummaryTitle=スタート用のぼかし対象を選んでください。
onboarding.ui.preferencesSummaryBody=ここでの選択が下の案内に反映されます。あとから変更もできます。
onboarding.ui.preferencesBestMatches=おすすめ：
onboarding.ui.preferencesRecommended=おすすめ
onboarding.ui.preferencesIncluded=デモに追加済み
onboarding.ui.preferencesTapToInclude=タップして追加
onboarding.ui.permissionsTitle=素材の読み込みも保存も、プライベートなままで。
onboarding.ui.permissionsLead=Blurio は写真へのアクセスを使って動画を読み込み、必要な部分をぼかし、整えたバージョンをライブラリへ戻します。
onboarding.ui.permissionsImport=写真からワンタップで読み込み
onboarding.ui.permissionsExport=共有前提の編集をライブラリへ保存
onboarding.ui.permissionsSystemPrompts=システムの許可ダイアログは実際の操作に合わせて表示
onboarding.ui.permissionsFooter=最初の読み込みと保存のときに Blurio が許可を求めます。
onboarding.ui.processingTitle=あなた向けのプライバシースターターパックを作成中…
onboarding.ui.processingLead={goal} への最短ルートを準備しています。
onboarding.ui.processingSelected=必要なぼかしプリセットを選択済み
onboarding.ui.processingOnDevice=オンデバイスの流れを確認済み
onboarding.ui.processingDemoQueued=最初のデモシーンを準備済み
onboarding.ui.demoTitle=続ける前に、まずは核になる操作を試してください。
onboarding.ui.demoLead=最初にぼかしたい対象を {count} つ選んでください。これが Blurio の実際のループを最小限にした形です。
onboarding.ui.demoSelected={selected} / {total} を選択
onboarding.ui.demoReadyTitle=スターターパックの準備ができました。
onboarding.ui.demoReadyBody=これから結果画面へ移動します。
onboarding.ui.valueTitle=最初のプライバシー向けセットアップが完成しました。
onboarding.ui.valueLead=ここが成果の瞬間です。あなたが守りたい対象に絞ったスターターパックです。
onboarding.ui.valueEyebrow=最初の実動画に使う準備ができました
onboarding.ui.valueCardTitle=Blurio スターターパック
onboarding.ui.valueMetricOnDeviceTitle=オンデバイス
onboarding.ui.valueMetricOnDeviceBody=プライバシー処理のために先にアップロードする必要はありません
onboarding.ui.valueMetricExportTitle=書き出しを自分で調整
onboarding.ui.valueMetricExportBody=解像度、コーデック、音声を自分で選べます
onboarding.ui.paywallEyebrow=仮のペイウォール
onboarding.ui.paywallTitle=すべてのプライベート編集を、ひとつの速い流れで。
onboarding.ui.paywallLead=Blurio はまだ課金導線を接続していないため、この画面は購入 SDK を入れるための洗練されたプレースホルダーです。
onboarding.ui.paywallTrialTitle=7日間無料トライアル
onboarding.ui.paywallTrialPrice=その後は年額 $29.99
onboarding.ui.paywallReviewTitle=「映像を安心して共有できる状態にする最速ルート。」 
onboarding.ui.paywallReviewBody=ここは実際の加入者レビューに差し替えるまでの仮テキストです。
onboarding.ui.footerWelcome=最初のプライベート編集を始める
onboarding.ui.footerGoal=これが Blurio を入れた理由です
onboarding.ui.footerPains=もっといい流れを見せて
onboarding.ui.footerNotReally=そこまでは
onboarding.ui.footerThatIsMe=まさにそれ
onboarding.ui.footerSolution=ぼかしスターターパックを用意する
onboarding.ui.footerPreferences=スターターパックを作る
onboarding.ui.footerReady=準備できました
onboarding.ui.footerSkipThis=これはスキップ
onboarding.ui.footerBlurIt=ぼかす
onboarding.ui.footerPlans=プランを見る
onboarding.ui.footerShare=設定を共有
onboarding.ui.footerStartTrial=7日間トライアルを開始
onboarding.ui.footerContinueFree=無料ツールで続ける
onboarding.ui.shareSetupFallback=プライベートな情報
onboarding.ui.shareSetupMessage=共有前に {labels} を守れるよう、Blurio の設定を整えました。
onboarding.content.goals.faces-fast.title=すばやく顔を隠したい
onboarding.content.goals.faces-fast.goalPhrase=すばやく顔を隠すこと
onboarding.content.goals.faces-fast.body=動画が端末を離れる前に、人が特定できない状態にしたい。
onboarding.content.goals.cover-plates.title=ナンバーや街の情報を隠したい
onboarding.content.goals.cover-plates.goalPhrase=ナンバーや街の情報を隠すこと
onboarding.content.goals.cover-plates.body=車のナンバー、番地、識別につながる情報を一度でぼかしたい。
onboarding.content.goals.protect-family.title=家族の映像を守りたい
onboarding.content.goals.protect-family.goalPhrase=家族の映像を守ること
onboarding.content.goals.protect-family.body=子どもや自宅、日常の景色を共有前にきちんと守りたい。
onboarding.content.goals.client-footage.title=クライアント素材を外出先で整えたい
onboarding.content.goals.client-footage.goalPhrase=クライアント素材を外出先で整えること
onboarding.content.goals.client-footage.body=デスクトップを開かずに、急ぎのプライバシー編集を済ませたい。
onboarding.content.goals.stay-offline.title=元映像をオフラインのまま保ちたい
onboarding.content.goals.stay-offline.goalPhrase=元映像をオフラインのまま保つこと
onboarding.content.goals.stay-offline.body=機密性の高い動画をクラウド前提のツールに渡したくない。
onboarding.content.goals.ship-faster.title=もっと早く書き出したい
onboarding.content.goals.ship-faster.goalPhrase=もっと早く書き出すこと
onboarding.content.goals.ship-faster.body=プライバシー修正を、長い編集作業ではなく短いモバイル作業で終えたい。
onboarding.content.pains.cloud-risk.title=プライベートな素材をアップロードしたくない
onboarding.content.pains.cloud-risk.body=顔やナンバー、住所が映る元動画をクラウドへ上げるのは不安です。
onboarding.content.pains.too-slow.title=コマ単位の修正は時間がかかりすぎる
onboarding.content.pains.too-slow.body=ちょっとしたプライバシー修正が、丸ごとの編集作業になってしまう。
onboarding.content.pains.too-complex.title=多くの編集アプリは自分には重すぎる
onboarding.content.pains.too-complex.body=欲しいのはプライバシー用ツールだけで、フルのポスト制作環境ではない。
onboarding.content.pains.miss-detail.title=どこか一つ見落としそうで怖い
onboarding.content.pains.miss-detail.body=ナンバーや社員証、顔をひとつ見落とすだけで投稿が台無しになる。
onboarding.content.pains.quality-loss.title=ほかのアプリは画質や書き出しを壊しがち
onboarding.content.pains.quality-loss.body=解像度やコーデック、音声は自分でコントロールしたい。
onboarding.content.pains.mobile-workflow.title=最後までスマホだけで終わらせたい
onboarding.content.pains.mobile-workflow.body=修正はその場で済ませたい。机に戻ってからでは遅い。
onboarding.content.testimonials.parent.persona=家族系クリエイター
onboarding.content.testimonials.parent.quote=仮レビュー：投稿前に子どもや家の情報を隠せるし、元動画をどこかへ送る必要もありません。
onboarding.content.testimonials.rideshare.persona=ストリート映像クリエイター
onboarding.content.testimonials.rideshare.quote=仮レビュー：Blurio なら、ナンバーや背景の顔の処理がデスクトップ仕事ではなく 30 秒の修正で済みます。
onboarding.content.testimonials.freelance.persona=フリーランス編集者
onboarding.content.testimonials.freelance.quote=仮レビュー：クライアントから急ぎのプライバシー対応を頼まれても、スマホで処理してきれいに書き出せます。
onboarding.content.statements.delay-posting=画面内の個人情報をまだ隠していないから、投稿を後回しにしてしまう。
onboarding.content.statements.zoom-check=顔やナンバー、住所を見落としていないか不安で、何度も拡大して確認してしまう。
onboarding.content.statements.privacy-tools=プライベートな素材をオンライン編集に渡すのは、プライバシーと真逆に感じる。
onboarding.content.statements.overkill=多くの編集アプリは、小さなプライバシー修正を大仕事にしてしまう。
onboarding.content.preferences.face.title=顔
onboarding.content.preferences.face.body=前景の人物、人混み、偶然映り込んだ通行人。
onboarding.content.preferences.plate.title=ナンバープレート
onboarding.content.preferences.plate.body=車、バイク、背景に停まっているあらゆる乗り物。
onboarding.content.preferences.address.title=番地
onboarding.content.preferences.address.body=家番号、ポスト、建物名、玄関まわり。
onboarding.content.preferences.badge.title=社員証・ID
onboarding.content.preferences.badge.body=社章、入館証、見える状態の身分証。
onboarding.content.preferences.document.title=書類と画面
onboarding.content.preferences.document.body=書類、モニター、レシート、読めてしまうもの全般。
onboarding.content.preferences.tattoo.title=識別されやすい特徴
onboarding.content.preferences.tattoo.body=タトゥー、ロゴ、制服、本人特定につながる細部。
onboarding.content.solutions.cloud-risk.eyebrow=もっと安心したい？
onboarding.content.solutions.cloud-risk.headline=読み込みから書き出しまで、流れをすべて端末内で完結。
onboarding.content.solutions.cloud-risk.detail=Blurio はローカル編集のために作られているので、元動画をクラウドへ渡す必要がありません。
onboarding.content.solutions.too-slow.eyebrow=もっと速くしたい？
onboarding.content.solutions.too-slow.headline=ぼかし領域を置いたら、その場で動作を確認できます。
onboarding.content.solutions.too-slow.detail=ライブプレビューが往復確認を減らし、プライバシー修正の長引きを防ぎます。
onboarding.content.solutions.too-complex.eyebrow=もっと軽くしたい？
onboarding.content.solutions.too-complex.headline=動画を開いて、ぼかして、そのまま先へ進むだけ。
onboarding.content.solutions.too-complex.detail=フル制作向けの操作ではなく、プライバシー編集に集中した流れです。
onboarding.content.solutions.miss-detail.eyebrow=もっと確信がほしい？
onboarding.content.solutions.miss-detail.headline=複数のぼかしを重ねて、書き出し前にタイムラインで確認。
onboarding.content.solutions.miss-detail.detail=顔、ナンバー、社員証が現れる正確なフレームまでチェックできます。
onboarding.content.solutions.quality-loss.eyebrow=もっときれいに出したい？
onboarding.content.solutions.quality-loss.headline=保存前に書き出し品質をきちんと調整。
onboarding.content.solutions.quality-loss.detail=解像度、フレームレート、コーデック、音声を自分で管理できます。
onboarding.content.solutions.mobile-workflow.eyebrow=移動中に終わらせたい？
onboarding.content.solutions.mobile-workflow.headline=撮ったそのスマホで、プライバシー編集まで完了。
onboarding.content.solutions.mobile-workflow.detail=写真から読み込み、必要な場所をぼかし、整えた版をそのまま保存できます。
onboarding.content.demo.face.title=にぎやかな歩道でのセルフィー
onboarding.content.demo.face.subtitle=この瞬間を共有する前に、通行人をぼかす。
onboarding.content.demo.face.label=顔ぼかし
onboarding.content.demo.face.detail=タップひとつで、背景の見知らぬ人をやわらかいプライバシーマスクで隠せます。
onboarding.content.demo.plate.title=路上リールと停車中の車
onboarding.content.demo.plate.subtitle=投稿前に、見えているナンバーを隠す。
onboarding.content.demo.plate.label=ナンバーぼかし
onboarding.content.demo.plate.detail=ナンバー向けの領域を使えば、書き出し後もシーンの見た目を崩しません。
onboarding.content.demo.address.title=玄関先の配達動画
onboarding.content.demo.address.subtitle=建物番号をさっと一度で隠す。
onboarding.content.demo.address.label=住所ぼかし
onboarding.content.demo.address.detail=番号の上に角丸ぼかしを置けば、場所を自然に伏せられます。
onboarding.content.demo.badge.title=舞台裏のチーム更新
onboarding.content.demo.badge.subtitle=動画全体を作り直さずに社員証だけぼかす。
onboarding.content.demo.badge.label=社員証ぼかし
onboarding.content.demo.badge.detail=認証情報だけを隠し、ほかのショットはそのまま保てます。
onboarding.content.demo.document.title=机上の書類クリップ
onboarding.content.demo.document.subtitle=動画が端末を離れる前に、読める情報を隠す。
onboarding.content.demo.document.label=書類ぼかし
onboarding.content.demo.document.detail=シーン全体を作り直さずに、名前や数字だけを保護できます。
onboarding.content.demo.tattoo.title=舞台裏のポートレート
onboarding.content.demo.tattoo.subtitle=人物を特定しうる目立つ印をやわらげる。
onboarding.content.demo.tattoo.label=細部ぼかし
onboarding.content.demo.tattoo.detail=使えるショットのまま、識別につながる一点だけを取り除けます。
onboarding.content.paywall.features.1=プライバシー編集も履歴も無制限
onboarding.content.paywall.features.2=よく隠す対象をテンプレート化して再利用
onboarding.content.paywall.features.3=今後の高機能ぼかしツールと高速書き出しプリセット
onboarding.content.comparison.privacy.label=元映像をプライベートに保つ
onboarding.content.comparison.privacy.withApp=オンデバイス処理
onboarding.content.comparison.privacy.withoutApp=クラウドアップロードが必要になりがち
onboarding.content.comparison.speed.label=スマホ中心で素早く修正
onboarding.content.comparison.speed.withApp=プライバシー特化の流れ
onboarding.content.comparison.speed.withoutApp=フルエディタの負担
onboarding.content.comparison.confidence.label=すべての機微情報を確認
onboarding.content.comparison.confidence.withApp=タイムライン確認 + 複数領域
onboarding.content.comparison.confidence.withoutApp=1フレーム見落としやすい
app.name=Blurio
app.splashTagline=オフラインのプライバシーぼかしエディタ
app.sourceLabel=素材
app.qualityLabel=品質
common.untitledFolder=名称未設定フォルダ
common.untitledProject=名称未設定プロジェクト
editor.addRegion=領域を追加
editor.regions=領域
editor.params=パラメータ
editor.keyframes=キーフレーム
editor.view=表示
editor.undo=取り消す
editor.redo=やり直す
editor.noTrackTitle=選択中の領域がありません
editor.noTrackBody=領域を選ぶと、パラメータとキーフレームを調整できます。
editor.previewUnavailable=プレビューを表示できません
editor.fitToScreen=画面に合わせる
editor.addKeyframe=キーフレームを追加
editor.deleteKeyframe=キーフレームを削除
editor.snapHint=キーフレームにスナップしました
editor.precisionOn=精密タイムラインを有効化
editor.precisionOff=精密タイムラインを無効化
editor.markerMenuTitle=キーフレームオプション
editor.jumpToMarker=キーフレームへ移動
editor.editMarker=補間を編集
editor.deleteMarker=キーフレームを削除
editor.faceTemplate=顔領域
editor.plateTemplate=ナンバー領域
editor.rectangle=長方形
editor.roundedRect=角丸長方形
editor.ellipse=楕円
editor.path=パス
editor.removeRegion=領域を削除
editor.saveAsTemplate=テンプレートとして保存
editor.saveTemplateTitle=領域テンプレートを保存
editor.templateNameLabel=テンプレート名
editor.templateNamePlaceholder=顔ぼかし
editor.templateCategoryLabel=カテゴリ
editor.templateCategoryPlaceholder=一般
editor.templateDefaultCategory=一般
editor.applyTemplate=テンプレートを適用
editor.applyTemplateTitle=テンプレートを適用
editor.noTemplatesYet=保存済みテンプレートはまだありません。
editor.removeAllRegions=すべての領域を削除
editor.playPreview=プレビュー再生
editor.pausePreview=プレビュー停止
params.strength=強さ
params.feather=ぼかし縁
params.opacity=不透明度
params.positionX=横位置
params.positionY=縦位置
params.width=幅
params.height=高さ
params.rotation=回転
params.cornerRadius=角丸半径
params.blendMode=ぼかしモード
params.gaussian=ガウス
params.bokeh=ボケ
params.motionBlur=モーションブラー
params.bilateral=バイラテラル
params.smartBlur=スマートブラー
params.radial=放射
keyframes.interpolation=補間
keyframes.linear=線形
keyframes.easeInOut=イーズ
keyframes.spring=スプリング
keyframes.hold=保持
keyframes.parameterControl=パラメータ
view.previewQuality=プレビュー品質
view.guides=ガイド
view.thumbnails=サムネイル
view.safeAreaOverlay=セーフエリアオーバーレイ
view.ultra=高品質
view.balanced=標準
view.smooth=軽量
export.codecH264=H.264
export.codecHevc=HEVC
export.resolution4k=4K
settings.clearCache=キャッシュを消去
edgeCases.largeVideoSwitched=大きな 4K 素材を検出したため、安定再生のためにプレビューを軽量モードへ切り替えました。
edgeCases.backgroundPaused=バックグラウンドでプレビューを停止しました
edgeCases.backgroundExportContinues=書き出しはバックグラウンドタスクとして継続します
edgeCases.backgroundExportPaused=書き出しはバックグラウンドで一時停止しました
edgeCases.assetUnavailableTitle=素材を利用できません
edgeCases.assetUnavailableBody=元の動画がこの端末上で利用できなくなっています。続けるには再リンクしてください。
accessibility.projectCard=プロジェクトカード
accessibility.addRegionButton=ぼかし領域を追加
accessibility.timeline=タイムラインスクラバー
accessibility.playhead=タイムライン再生ヘッド
accessibility.exportProgress=書き出し進捗リング
accessibility.settingsButton=設定を開く
accessibility.importButton=動画を読み込む
accessibility.timelineModePrecision=精密モード
accessibility.timelineModeStandard=通常モード
accessibility.previewStubTitle=BlurioPreviewView ネイティブレンダラのスタブ
accessibility.selectTrack={name} を選択
accessibility.deleteTrack={name} を削除
accessibility.toggleVisibility={name} の表示を切り替え
accessibility.toggleLock={name} のロックを切り替え
accessibility.openPanel={name} パネルを開く
accessibility.collapseSheet={name} を折りたたむ
accessibility.adjustTrackStart={name} の開始位置を調整
accessibility.adjustTrackEnd={name} の終了位置を調整
accessibility.keyframeAt=キーフレーム {time}
accessibility.keyframeParameter={name} のキーフレームパラメータ
accessibility.continueAfterTestimonials=レビューのあとに続ける
app.photoLibraryUsage=Blurio がオフラインでぼかし編集するために、写真ライブラリへのアクセスが必要です。
app.photoLibraryAddUsage=書き出した動画をライブラリに保存するには、Blurio に許可が必要です。
app.playbackFailed=再生に失敗しました
app.previewError=プレビューエラー
naming.projectDefault=プロジェクト {date}
naming.regionDefault=領域 {index}
naming.copySuffix={name} のコピー
naming.templateDefault={name} テンプレート
`);

const KO_TRANSLATIONS = parseTranslations(`
common.cancel=취소
common.close=닫기
common.confirm=확인
common.save=저장
common.delete=삭제
common.remove=제거
common.duplicate=복제
common.rename=이름 변경
common.done=완료
common.retry=다시 시도
common.continue=계속
common.back=뒤로
common.noProjectSelected=선택된 프로젝트가 없습니다.
common.settings=설정
common.import=가져오기
common.export=내보내기
common.disabled=끔
common.enabled=켬
common.yes=예
common.no=아니요
navigation.homeTitle=프로젝트
navigation.importTitle=비디오 가져오기
navigation.editorTitle=편집기
navigation.exportTitle=내보내기
navigation.settingsTitle=설정
home.openSettings=설정 열기
home.emptyTitle=아직 프로젝트가 없습니다
home.emptyBody=비디오를 가져와 블러 트랙 작업을 시작하세요.
home.emptyButton=첫 프로젝트 만들기
home.createProjectFab=새 프로젝트 만들기
home.contextTitle=프로젝트 작업
home.longPressHint=길게 눌러 프로젝트 작업 보기
home.duplicateAction=프로젝트 복제
home.deleteAction=프로젝트 삭제
home.renameAction=이름 변경
home.moveToFolderAction=폴더로 이동
home.removeAction=이동
home.recoverAction=복구
home.removePermanentlyAction=영구 삭제
home.openAction=편집기 열기
home.deleteConfirmTitle=프로젝트를 삭제할까요?
home.deleteConfirmBody=이 기기에서 메타데이터와 캐시된 미리보기가 제거됩니다.
home.removeConfirmTitle=프로젝트를 휴지통으로 옮길까요?
home.removeConfirmBody=나중에 휴지통에서 복구할 수 있습니다.
home.allProjectsFolder=모든 프로젝트
home.trashFolder=휴지통
home.defaultFolderName=프로젝트
home.renameProjectTitle=프로젝트 이름 바꾸기
home.renameProjectPlaceholder=프로젝트 이름
home.renameFolderTitle=폴더 이름 바꾸기
home.renameFolderPlaceholder=폴더 이름
home.createFolderTitle=새 폴더
home.createFolderPlaceholder=폴더 이름
home.newFolderAction=새 폴더...
home.removeFolderConfirmTitle=폴더를 삭제할까요?
home.removeFolderConfirmBody=이 폴더의 프로젝트는 다른 폴더로 이동됩니다.
home.emptyTrashTitle=휴지통이 비어 있습니다
home.noFolderTargets=다른 폴더가 없습니다
import.pickButton=사진에서 선택
import.preparing=미리보기 준비 중
import.preparingBody=썸네일과 로컬 메타데이터를 생성하는 중입니다
import.iCloudWarningTitle=에셋이 완전히 다운로드되지 않았습니다
import.iCloudWarningBody=이 비디오는 현재 iCloud 에만 있는 것 같습니다. 사진 앱에서 먼저 다운로드한 뒤 다시 가져오세요.
import.unsupportedTitle=비디오를 열 수 없습니다
import.unsupportedBody=선택한 파일이 지원되지 않거나 손상되었습니다. 다른 비디오를 시도해 보세요.
import.relinkButton=에셋 다시 연결
import.doneButton=편집기 열기
settings.appearance=디자인
settings.motion=모션
settings.preview=미리보기
settings.export=내보내기
settings.storage=저장 공간
settings.about=정보
settings.appearanceSystem=iOS에 맞추기
settings.appearanceDark=다크
settings.appearanceLight=라이트
settings.reduceMotionSystem=iOS 설정 사용
settings.reduceMotionOn=모션 줄이기 켜짐
settings.reduceMotionOff=모션 줄이기 꺼짐
settings.accentColor=포인트 색상
settings.previewQualityDefault=기본 미리보기 품질
settings.autoThumbs=가져올 때 썸네일 생성
settings.safeAreaDefault=기본으로 안전 영역 표시
settings.cleanTrash=휴지통 비우기
settings.cleanTrashTitle=휴지통을 비울까요?
settings.cleanTrashBody=휴지통의 모든 프로젝트를 영구 삭제합니다.
settings.storageUsage=예상 프로젝트 캐시
settings.projectsCached=캐시된 프로젝트
settings.version=버전
settings.offlineOnly=완전한 오프라인 워크플로우. 네트워크 업로드 없음.
settings.accentColorOption=포인트 색상 {color}
onboarding.ui.defaultGoalPhrase=중요한 것을 제대로 보호하는 일
onboarding.ui.welcomeBadge=오프라인 프라이버시 워크플로우
onboarding.ui.welcomeTitle=공유할 건 영상이고, 개인 정보는 아닙니다.
onboarding.ui.welcomeBody=얼굴, 번호판, 주소, 출입증을 기기 밖으로 나가기 전에 온디바이스에서 처리할 수 있습니다.
onboarding.ui.previewFaceChip=얼굴
onboarding.ui.welcomeMetricPrivate=기본부터 더 안전하게
onboarding.ui.welcomeMetricNoUpload=먼저 업로드할 필요 없음
onboarding.ui.welcomeMetricFastPresets=빠른 블러 프리셋
onboarding.ui.goalTitle=가장 먼저 무엇을 보호하고 싶나요?
onboarding.ui.goalLead=Blurio 가 바로 유용해지는 결과를 하나 골라 주세요.
onboarding.ui.painsTitle={goal} 를 가로막는 건 무엇인가요?
onboarding.ui.painsLead=지금 실제로 느끼는 불편을 모두 골라 주세요.
onboarding.ui.proofTitle=같은 이유로 Blurio 를 쓰는 사람들이 있습니다.
onboarding.ui.proofLead=지금은 자리표시자 후기지만, 이 앱이 실제로 해결하는 일과 잘 맞는 문장들입니다.
onboarding.ui.statementsTitle=어떤 말이 가장 공감되나요?
onboarding.ui.statementsLead=직감대로 골라 주세요. 정말 답답한 지점을 기준으로 경험을 맞춥니다.
onboarding.ui.statementProgress={current} / {total}
onboarding.ui.solutionTitle=더 똑똑한 방법은 이렇습니다.
onboarding.ui.solutionLead=Blurio 가 가장 강한 순간은 단순합니다. 화면을 가리고, 바로 확인하고, 프라이버시를 넘기지 않은 채 내보내는 일입니다.
onboarding.ui.comparisonTitle=짧고 사적인 워크플로우
onboarding.ui.comparisonWhatMatters=중요한 점
onboarding.ui.comparisonWithApp=Blurio
onboarding.ui.comparisonWithout=없을 때
onboarding.ui.preferencesTitle=어떤 블러 프리셋을 먼저 준비할까요?
onboarding.ui.preferencesLead=자주 가리는 대상을 고르면 아래 데모가 그에 맞게 바뀝니다.
onboarding.ui.preferencesSummaryEyebrow=첫 데모에 맞춘 추천
onboarding.ui.preferencesSummaryTitle=시작용 블러 대상을 선택하세요.
onboarding.ui.preferencesSummaryBody=이 선택은 아래 안내 흐름을 바꾸며, 나중에 언제든 수정할 수 있습니다.
onboarding.ui.preferencesBestMatches=잘 맞는 항목:
onboarding.ui.preferencesRecommended=추천
onboarding.ui.preferencesIncluded=데모에 포함됨
onboarding.ui.preferencesTapToInclude=탭해서 포함
onboarding.ui.permissionsTitle=가져오고 저장하는 순간까지도 사적으로.
onboarding.ui.permissionsLead=Blurio 는 사진 접근 권한으로 비디오를 가져오고, 필요한 부분을 가린 뒤, 정리된 버전을 다시 저장합니다.
onboarding.ui.permissionsImport=사진에서 한 번에 가져오기
onboarding.ui.permissionsExport=공유 가능한 편집본을 다시 라이브러리에 저장
onboarding.ui.permissionsSystemPrompts=시스템 권한 안내는 실제 작업에 맞춰 바로 표시
onboarding.ui.permissionsFooter=첫 비디오를 가져오고 저장할 때 Blurio 가 권한을 요청합니다.
onboarding.ui.processingTitle=당신만의 프라이버시 스타터 팩을 만드는 중…
onboarding.ui.processingLead={goal} 를 위한 가장 빠른 경로를 준비하고 있습니다.
onboarding.ui.processingSelected=집중 블러 프리셋 선택 완료
onboarding.ui.processingOnDevice=온디바이스 흐름 확인 완료
onboarding.ui.processingDemoQueued=첫 데모 장면 준비 완료
onboarding.ui.demoTitle=계속하기 전에 핵심 동작을 먼저 체험해 보세요.
onboarding.ui.demoLead=가장 먼저 가리고 싶은 항목 {count}개를 골라 주세요. 이것이 Blurio 실제 루프의 가장 작은 버전입니다.
onboarding.ui.demoSelected={selected} / {total} 선택됨
onboarding.ui.demoReadyTitle=스타터 팩이 준비됐습니다.
onboarding.ui.demoReadyBody=이제 결과 화면으로 이동합니다.
onboarding.ui.valueTitle=첫 프라이버시 준비 세팅이 완성됐습니다.
onboarding.ui.valueLead=이 순간이 결과입니다. 당신이 보호하고 싶은 대상을 기준으로 만든 집중형 스타터 팩입니다.
onboarding.ui.valueEyebrow=첫 실제 영상에 바로 쓸 수 있습니다
onboarding.ui.valueCardTitle=Blurio 스타터 팩
onboarding.ui.valueMetricOnDeviceTitle=온디바이스
onboarding.ui.valueMetricOnDeviceBody=프라이버시 처리를 위해 먼저 업로드할 필요가 없습니다
onboarding.ui.valueMetricExportTitle=내보내기 제어
onboarding.ui.valueMetricExportBody=해상도, 코덱, 오디오를 직접 조절할 수 있습니다
onboarding.ui.paywallEyebrow=임시 페이월
onboarding.ui.paywallTitle=모든 프라이버시 편집을 하나의 빠른 흐름으로.
onboarding.ui.paywallLead=Blurio 는 아직 구독 결제가 연결되지 않아, 이 화면은 구매 SDK 를 붙이기 위한 세련된 자리표시자입니다.
onboarding.ui.paywallTrialTitle=7일 무료 체험
onboarding.ui.paywallTrialPrice=이후 연간 $29.99
onboarding.ui.paywallReviewTitle=“영상을 안심하고 공유 가능한 상태로 만드는 가장 빠른 방법.” 
onboarding.ui.paywallReviewBody=실제 구독자 후기로 교체하기 전까지 쓰는 자리표시자 후기입니다.
onboarding.ui.footerWelcome=첫 프라이버시 편집 시작하기
onboarding.ui.footerGoal=이게 제가 Blurio 를 받은 이유예요
onboarding.ui.footerPains=더 나은 흐름 보여주기
onboarding.ui.footerNotReally=그 정도는 아니에요
onboarding.ui.footerThatIsMe=딱 제 얘기예요
onboarding.ui.footerSolution=블러 스타터 팩 설정하기
onboarding.ui.footerPreferences=스타터 팩 만들기
onboarding.ui.footerReady=준비됐어요
onboarding.ui.footerSkipThis=이건 건너뛰기
onboarding.ui.footerBlurIt=가리기
onboarding.ui.footerPlans=플랜 보기
onboarding.ui.footerShare=내 설정 공유
onboarding.ui.footerStartTrial=7일 체험 시작
onboarding.ui.footerContinueFree=무료 도구로 계속
onboarding.ui.shareSetupFallback=민감한 정보
onboarding.ui.shareSetupMessage=공유 전에 {labels} 를 보호할 수 있도록 Blurio 세팅을 마쳤어요.
app.name=Blurio
app.splashTagline=오프라인 프라이버시 블러 편집기
app.sourceLabel=원본
app.qualityLabel=품질
common.untitledFolder=이름 없는 폴더
common.untitledProject=이름 없는 프로젝트
editor.addRegion=영역 추가
editor.regions=영역
editor.params=파라미터
editor.keyframes=키프레임
editor.view=보기
editor.undo=실행 취소
editor.redo=다시 실행
editor.noTrackTitle=선택된 영역이 없습니다
editor.noTrackBody=영역을 선택하면 파라미터와 키프레임을 조정할 수 있습니다.
editor.previewUnavailable=미리보기를 사용할 수 없습니다
editor.fitToScreen=화면에 맞추기
editor.addKeyframe=키프레임 추가
editor.deleteKeyframe=키프레임 삭제
editor.snapHint=키프레임에 맞춰졌습니다
editor.precisionOn=정밀 타임라인 켜짐
editor.precisionOff=정밀 타임라인 꺼짐
editor.markerMenuTitle=키프레임 옵션
editor.jumpToMarker=마커로 이동
editor.editMarker=보간 편집
editor.deleteMarker=마커 삭제
editor.faceTemplate=얼굴 영역
editor.plateTemplate=번호판 영역
editor.rectangle=직사각형
editor.roundedRect=둥근 사각형
editor.ellipse=타원
editor.path=패스
editor.removeRegion=영역 삭제
editor.saveAsTemplate=템플릿으로 저장
editor.saveTemplateTitle=영역 템플릿 저장
editor.templateNameLabel=템플릿 이름
editor.templateNamePlaceholder=얼굴 블러
editor.templateCategoryLabel=카테고리
editor.templateCategoryPlaceholder=일반
editor.templateDefaultCategory=일반
editor.applyTemplate=템플릿 적용
editor.applyTemplateTitle=템플릿 적용
editor.noTemplatesYet=저장된 템플릿이 아직 없습니다.
editor.removeAllRegions=모든 영역 삭제
editor.playPreview=미리보기 재생
editor.pausePreview=미리보기 일시 정지
params.strength=강도
params.feather=페더
params.opacity=불투명도
params.positionX=가로 위치
params.positionY=세로 위치
params.width=너비
params.height=높이
params.rotation=회전
params.cornerRadius=모서리 반경
params.blendMode=블러 방식
params.gaussian=가우시안
params.bokeh=보케
params.motionBlur=모션 블러
params.bilateral=양방향
params.smartBlur=스마트 블러
params.radial=방사형
keyframes.interpolation=보간
keyframes.linear=선형
keyframes.easeInOut=이스
keyframes.spring=스프링
keyframes.hold=고정
keyframes.parameterControl=파라미터
view.previewQuality=미리보기 품질
view.guides=가이드
view.thumbnails=썸네일
view.safeAreaOverlay=안전 영역 오버레이
view.ultra=최고 품질
view.balanced=균형
view.smooth=부드러움
export.startButton=내보내기 시작
export.cancelButton=내보내기 취소
export.successTitle=내보내기 완료
export.successBody=비디오가 사진 보관함에 저장되었습니다.
export.settingsTitle=내보내기 설정
export.stageDecoding=디코딩 중
export.stageApplying=블러 적용 중
export.stageEncoding=인코딩 중
export.stageSaving=저장 중
export.hdrWarning=대체 모드에서는 HDR 유지가 지원되지 않아 결과물이 SDR로 변환됩니다.
export.lowStorageTitle=여유 저장 공간이 부족합니다
export.lowStorageBody=저장 공간을 확보한 뒤 다시 시도하세요.
export.toggleSettings=내보내기 설정 전환
export.codecLabel=코덱
export.codecH264=H.264
export.codecHevc=HEVC
export.framerateLabel=프레임레이트
export.resolutionLabel=해상도
export.resolution4k=4K
export.includeAudioLabel=오디오 포함
export.includeAudioOn=오디오 켜짐
export.includeAudioOff=오디오 꺼짐
export.cancelledLabel=취소됨
export.failedLabel=실패
settings.clearCache=캐시 비우기
edgeCases.largeVideoSwitched=큰 4K 원본이 감지되어 안정적인 재생을 위해 미리보기가 부드러움 모드로 전환되었습니다.
edgeCases.backgroundPaused=백그라운드에서 미리보기가 일시 정지되었습니다
edgeCases.backgroundExportContinues=내보내기가 백그라운드 작업으로 계속 진행됩니다
edgeCases.backgroundExportPaused=내보내기가 백그라운드 모드에서 일시 정지되었습니다
edgeCases.assetUnavailableTitle=원본을 사용할 수 없습니다
edgeCases.assetUnavailableBody=원본 비디오를 더 이상 기기에서 찾을 수 없습니다. 계속하려면 원본을 다시 연결하세요.
accessibility.projectCard=프로젝트 카드
accessibility.addRegionButton=블러 영역 추가
accessibility.timeline=타임라인 스크러버
accessibility.playhead=타임라인 재생 헤드
accessibility.exportProgress=내보내기 진행 링
accessibility.settingsButton=설정 열기
accessibility.importButton=비디오 가져오기
accessibility.timelineModePrecision=정밀 모드
accessibility.timelineModeStandard=표준 모드
accessibility.previewStubTitle=BlurioPreviewView 네이티브 렌더러 자리표시자
accessibility.selectTrack={name} 선택
accessibility.deleteTrack={name} 삭제
accessibility.toggleVisibility={name} 표시 전환
accessibility.toggleLock={name} 잠금 전환
accessibility.openPanel={name} 패널 열기
accessibility.collapseSheet={name} 접기
accessibility.adjustTrackStart={name} 시작점 조절
accessibility.adjustTrackEnd={name} 끝점 조절
accessibility.keyframeAt=키프레임 {time}
accessibility.keyframeParameter={name} 키프레임 파라미터
accessibility.continueAfterTestimonials=후기 다음으로 계속
app.photoLibraryUsage=Blurio 가 비디오를 가져와 오프라인 블러 편집을 하려면 사진 보관함 접근 권한이 필요합니다.
app.photoLibraryAddUsage=내보낸 비디오를 보관함에 저장하려면 Blurio 에 권한이 필요합니다.
app.playbackFailed=재생에 실패했습니다
app.previewError=미리보기 오류
naming.projectDefault=프로젝트 {date}
naming.regionDefault=영역 {index}
naming.copySuffix={name} 복사본
naming.templateDefault={name} 템플릿
onboarding.content.goals.faces-fast.title=얼굴을 빠르게 가리기
onboarding.content.goals.faces-fast.goalPhrase=얼굴을 빠르게 가리는 일
onboarding.content.goals.faces-fast.body=영상이 휴대폰 밖으로 나가기 전에 사람을 알아볼 수 없게 만들고 싶습니다.
onboarding.content.goals.cover-plates.title=번호판과 거리 정보 가리기
onboarding.content.goals.cover-plates.goalPhrase=번호판과 거리 정보를 가리는 일
onboarding.content.goals.cover-plates.body=차량 번호판, 건물 번호, 식별 가능한 요소를 한 번에 흐리게 처리합니다.
onboarding.content.goals.protect-family.title=가족 영상을 보호하기
onboarding.content.goals.protect-family.goalPhrase=가족 영상을 보호하는 일
onboarding.content.goals.protect-family.body=공유 전에 아이들, 집, 일상 장면을 더 안전하게 지킵니다.
onboarding.content.goals.client-footage.title=이동 중에도 고객 영상을 정리하기
onboarding.content.goals.client-footage.goalPhrase=이동 중에도 고객 영상을 정리하는 일
onboarding.content.goals.client-footage.body=데스크톱 편집기를 열지 않고도 빠른 프라이버시 수정을 끝낼 수 있습니다.
onboarding.content.goals.stay-offline.title=원본 영상을 오프라인으로 유지하기
onboarding.content.goals.stay-offline.goalPhrase=원본 영상을 오프라인으로 유지하는 일
onboarding.content.goals.stay-offline.body=민감한 영상을 클라우드 우선 도구에 보내지 않아도 됩니다.
onboarding.content.goals.ship-faster.title=더 빨리 내보내기
onboarding.content.goals.ship-faster.goalPhrase=더 빨리 내보내는 일
onboarding.content.goals.ship-faster.body=프라이버시 수정을 긴 편집 세션이 아니라 짧은 모바일 작업으로 끝냅니다.
onboarding.content.pains.cloud-risk.title=사적인 영상을 업로드하고 싶지 않아요
onboarding.content.pains.cloud-risk.body=얼굴, 번호판, 주소가 담긴 원본 영상을 클라우드로 보내는 건 불안합니다.
onboarding.content.pains.too-slow.title=프레임 단위 수정은 너무 오래 걸려요
onboarding.content.pains.too-slow.body=간단한 프라이버시 수정이 전체 편집 작업으로 커집니다.
onboarding.content.pains.too-complex.title=대부분의 편집기는 제가 원하는 것보다 너무 무거워요
onboarding.content.pains.too-complex.body=필요한 건 프라이버시 도구뿐이지 전체 후반 작업 환경이 아닙니다.
onboarding.content.pains.miss-detail.title=한 가지라도 놓칠까 걱정돼요
onboarding.content.pains.miss-detail.body=번호판, 출입증, 얼굴 하나만 빠져도 게시물이 망가질 수 있습니다.
onboarding.content.pains.quality-loss.title=다른 앱은 화질이나 내보내기를 망쳐요
onboarding.content.pains.quality-loss.body=해상도, 코덱, 오디오는 제가 직접 제어하고 싶습니다.
onboarding.content.pains.mobile-workflow.title=휴대폰에서 바로 끝내야 해요
onboarding.content.pains.mobile-workflow.body=수정은 지금 있는 자리에서 끝나야지, 나중에 책상 앞에서 하면 늦습니다.
onboarding.content.testimonials.parent.persona=가족 콘텐츠 크리에이터
onboarding.content.testimonials.parent.quote=자리표시자 후기: 올리기 전에 아이들과 집 정보를 가릴 수 있고, 원본 영상을 어디에도 보낼 필요가 없어요.
onboarding.content.testimonials.rideshare.persona=거리 영상 크리에이터
onboarding.content.testimonials.rideshare.quote=자리표시자 후기: Blurio 덕분에 번호판과 배경 인물 얼굴 처리가 데스크톱 작업이 아니라 30초 수정이 됐어요.
onboarding.content.testimonials.freelance.persona=프리랜서 편집자
onboarding.content.testimonials.freelance.quote=자리표시자 후기: 고객이 급하게 프라이버시 수정을 요청해도 휴대폰에서 처리하고 깔끔하게 내보낼 수 있어요.
onboarding.content.statements.delay-posting=화면 속 개인 정보를 아직 가리지 못해서 게시를 미루게 됩니다.
onboarding.content.statements.zoom-check=얼굴, 번호판, 주소를 놓쳤을까 봐 몇 번이고 확대해서 확인합니다.
onboarding.content.statements.privacy-tools=사적인 영상을 온라인 편집기로 보내는 건 프라이버시와 정반대로 느껴집니다.
onboarding.content.statements.overkill=많은 편집 앱이 작은 프라이버시 수정을 큰 프로젝트로 만들어 버립니다.
onboarding.content.preferences.face.title=얼굴
onboarding.content.preferences.face.body=전경 인물, 군중, 우연히 찍힌 행인.
onboarding.content.preferences.plate.title=번호판
onboarding.content.preferences.plate.body=자동차, 오토바이, 배경에 주차된 모든 차량.
onboarding.content.preferences.address.title=건물 번호
onboarding.content.preferences.address.body=집 번호, 우편함, 건물 이름, 출입문 정보.
onboarding.content.preferences.badge.title=출입증과 신분증
onboarding.content.preferences.badge.body=사원증, 출입 카드, 눈에 보이는 자격 정보.
onboarding.content.preferences.document.title=문서와 화면
onboarding.content.preferences.document.body=서류, 모니터, 영수증처럼 읽을 수 있는 모든 것.
onboarding.content.preferences.tattoo.title=눈에 띄는 특징
onboarding.content.preferences.tattoo.body=문신, 로고, 유니폼, 신원을 드러낼 수 있는 디테일.
onboarding.content.solutions.cloud-risk.eyebrow=더 안전해야 하나요?
onboarding.content.solutions.cloud-risk.headline=가져오기부터 내보내기까지 전체 흐름을 기기 안에서 끝내세요.
onboarding.content.solutions.cloud-risk.detail=Blurio 는 로컬 편집을 위해 만들어져 원본 영상을 클라우드에 넘길 필요가 없습니다.
onboarding.content.solutions.too-slow.eyebrow=더 빨라야 하나요?
onboarding.content.solutions.too-slow.headline=블러 영역을 올려두고 화면을 벗어나기 전에 바로 결과를 확인하세요.
onboarding.content.solutions.too-slow.detail=실시간 미리보기가 왕복 확인 시간을 줄여 프라이버시 수정을 길게 끌지 않게 합니다.
onboarding.content.solutions.too-complex.eyebrow=더 단순해야 하나요?
onboarding.content.solutions.too-complex.headline=비디오를 열고, 블러를 놓고, 바로 다음 단계로 가세요.
onboarding.content.solutions.too-complex.detail=전체 제작 도구 대신 프라이버시 수정에만 집중한 흐름입니다.
onboarding.content.solutions.miss-detail.eyebrow=더 확신이 필요하신가요?
onboarding.content.solutions.miss-detail.headline=여러 블러 영역을 겹쳐 두고 내보내기 전에 타임라인으로 확인하세요.
onboarding.content.solutions.miss-detail.detail=얼굴, 번호판, 출입증이 나오는 정확한 프레임까지 확인할 수 있습니다.
onboarding.content.solutions.quality-loss.eyebrow=더 깔끔한 결과가 필요하신가요?
onboarding.content.solutions.quality-loss.headline=최종 저장 전에 내보내기 품질을 직접 조정하세요.
onboarding.content.solutions.quality-loss.detail=해상도, 프레임레이트, 코덱, 오디오 설정을 계속 직접 다룰 수 있습니다.
onboarding.content.solutions.mobile-workflow.eyebrow=이동 중에 끝내야 하나요?
onboarding.content.solutions.mobile-workflow.headline=촬영한 바로 그 휴대폰에서 프라이버시 수정을 마무리하세요.
onboarding.content.solutions.mobile-workflow.detail=사진에서 가져오고, 중요한 부분을 가리고, 정리된 버전을 다시 저장하면 됩니다.
onboarding.content.demo.face.title=붐비는 거리 셀피
onboarding.content.demo.face.subtitle=이 순간을 공유하기 전에 배경 인물을 가리세요.
onboarding.content.demo.face.label=얼굴 블러
onboarding.content.demo.face.detail=탭 한 번으로 배경의 낯선 사람을 부드러운 프라이버시 마스크로 숨길 수 있습니다.
onboarding.content.demo.plate.title=주차된 차가 보이는 거리 릴
onboarding.content.demo.plate.subtitle=게시 전에 보이는 번호판을 덮으세요.
onboarding.content.demo.plate.label=번호판 블러
onboarding.content.demo.plate.detail=번호판에 맞는 영역을 쓰면 내보낸 뒤에도 장면이 깔끔하게 유지됩니다.
onboarding.content.demo.address.title=현관 앞 배송 영상
onboarding.content.demo.address.subtitle=건물 번호를 한 번에 빠르게 가리세요.
onboarding.content.demo.address.label=주소 블러
onboarding.content.demo.address.detail=번호 위에 둥근 블러를 얹어 위치 정보가 드러나지 않게 합니다.
onboarding.content.demo.badge.title=백스테이지 팀 업데이트
onboarding.content.demo.badge.subtitle=영상 전체를 다시 편집하지 않고 출입증만 가리세요.
onboarding.content.demo.badge.label=출입증 블러
onboarding.content.demo.badge.detail=자격 정보만 가리고 나머지 장면은 그대로 유지할 수 있습니다.
onboarding.content.demo.document.title=서류가 있는 책상 클립
onboarding.content.demo.document.subtitle=영상이 휴대폰을 떠나기 전에 읽히는 정보를 가리세요.
onboarding.content.demo.document.label=문서 블러
onboarding.content.demo.document.detail=장면을 다시 만들지 않고도 이름과 숫자를 보호할 수 있습니다.
onboarding.content.demo.tattoo.title=비하인드 포트레이트
onboarding.content.demo.tattoo.subtitle=대상을 식별할 수 있는 눈에 띄는 표시를 부드럽게 줄이세요.
onboarding.content.demo.tattoo.label=디테일 블러
onboarding.content.demo.tattoo.detail=샷의 활용도는 유지하면서 식별 요소 하나만 없앨 수 있습니다.
onboarding.content.paywall.features.1=무제한 프라이버시 수정과 프로젝트 기록
onboarding.content.paywall.features.2=자주 가리는 요소를 재사용 가능한 템플릿으로 저장
onboarding.content.paywall.features.3=앞으로 추가될 프로급 블러 도구와 더 빠른 내보내기 프리셋
onboarding.content.comparison.privacy.label=원본 영상은 사적으로 유지
onboarding.content.comparison.privacy.withApp=온디바이스 워크플로우
onboarding.content.comparison.privacy.withoutApp=클라우드 업로드가 필요한 경우가 많음
onboarding.content.comparison.speed.label=휴대폰 중심의 빠른 수정
onboarding.content.comparison.speed.withApp=프라이버시에 집중된 흐름
onboarding.content.comparison.speed.withoutApp=전체 편집기 부담
onboarding.content.comparison.confidence.label=민감한 디테일을 하나씩 확인
onboarding.content.comparison.confidence.withApp=타임라인 확인 + 다중 영역
onboarding.content.comparison.confidence.withoutApp=한 프레임 놓치기 쉬움
`);

const TRANSLATIONS: Partial<Record<SupportedLocale, TranslationDict>> = {
  en: ENGLISH_TRANSLATIONS,
  'zh-Hans': ZH_HANS_TRANSLATIONS,
  ja: JA_TRANSLATIONS,
  ko: KO_TRANSLATIONS,
};

const t = (
  locale: SupportedLocale,
  key: string,
  values?: Record<string, string | number>,
): string =>
  interpolate(TRANSLATIONS[locale]?.[key] ?? ENGLISH_TRANSLATIONS[key] ?? key, values);

const goalIds = [
  'faces-fast',
  'cover-plates',
  'protect-family',
  'client-footage',
  'stay-offline',
  'ship-faster',
] as const;

const painIds = [
  'cloud-risk',
  'too-slow',
  'too-complex',
  'miss-detail',
  'quality-loss',
  'mobile-workflow',
] as const;

const preferenceIds = ['face', 'plate', 'address', 'badge', 'document', 'tattoo'] as const;
const demoIds = ['face', 'plate', 'address', 'badge', 'document', 'tattoo'] as const;

const createStrings = (locale: SupportedLocale) => ({
  app: {
    name: t(locale, 'app.name'),
    splashTagline: t(locale, 'app.splashTagline'),
    sourceLabel: t(locale, 'app.sourceLabel'),
    qualityLabel: t(locale, 'app.qualityLabel'),
    photoLibraryUsage: t(locale, 'app.photoLibraryUsage'),
    photoLibraryAddUsage: t(locale, 'app.photoLibraryAddUsage'),
    playbackFailed: t(locale, 'app.playbackFailed'),
    previewError: t(locale, 'app.previewError'),
  },
  common: {
    cancel: t(locale, 'common.cancel'),
    close: t(locale, 'common.close'),
    confirm: t(locale, 'common.confirm'),
    save: t(locale, 'common.save'),
    delete: t(locale, 'common.delete'),
    remove: t(locale, 'common.remove'),
    duplicate: t(locale, 'common.duplicate'),
    rename: t(locale, 'common.rename'),
    done: t(locale, 'common.done'),
    retry: t(locale, 'common.retry'),
    continue: t(locale, 'common.continue'),
    back: t(locale, 'common.back'),
    noProjectSelected: t(locale, 'common.noProjectSelected'),
    settings: t(locale, 'common.settings'),
    import: t(locale, 'common.import'),
    export: t(locale, 'common.export'),
    disabled: t(locale, 'common.disabled'),
    enabled: t(locale, 'common.enabled'),
    yes: t(locale, 'common.yes'),
    no: t(locale, 'common.no'),
    untitledFolder: t(locale, 'common.untitledFolder'),
    untitledProject: t(locale, 'common.untitledProject'),
  },
  navigation: {
    homeTitle: t(locale, 'navigation.homeTitle'),
    importTitle: t(locale, 'navigation.importTitle'),
    editorTitle: t(locale, 'navigation.editorTitle'),
    exportTitle: t(locale, 'navigation.exportTitle'),
    settingsTitle: t(locale, 'navigation.settingsTitle'),
  },
  home: {
    openSettings: t(locale, 'home.openSettings'),
    emptyTitle: t(locale, 'home.emptyTitle'),
    emptyBody: t(locale, 'home.emptyBody'),
    emptyButton: t(locale, 'home.emptyButton'),
    createProjectFab: t(locale, 'home.createProjectFab'),
    contextTitle: t(locale, 'home.contextTitle'),
    longPressHint: t(locale, 'home.longPressHint'),
    duplicateAction: t(locale, 'home.duplicateAction'),
    deleteAction: t(locale, 'home.deleteAction'),
    renameAction: t(locale, 'home.renameAction'),
    moveToFolderAction: t(locale, 'home.moveToFolderAction'),
    removeAction: t(locale, 'home.removeAction'),
    recoverAction: t(locale, 'home.recoverAction'),
    removePermanentlyAction: t(locale, 'home.removePermanentlyAction'),
    openAction: t(locale, 'home.openAction'),
    deleteConfirmTitle: t(locale, 'home.deleteConfirmTitle'),
    deleteConfirmBody: t(locale, 'home.deleteConfirmBody'),
    removeConfirmTitle: t(locale, 'home.removeConfirmTitle'),
    removeConfirmBody: t(locale, 'home.removeConfirmBody'),
    allProjectsFolder: t(locale, 'home.allProjectsFolder'),
    trashFolder: t(locale, 'home.trashFolder'),
    defaultFolderName: t(locale, 'home.defaultFolderName'),
    renameProjectTitle: t(locale, 'home.renameProjectTitle'),
    renameProjectPlaceholder: t(locale, 'home.renameProjectPlaceholder'),
    renameFolderTitle: t(locale, 'home.renameFolderTitle'),
    renameFolderPlaceholder: t(locale, 'home.renameFolderPlaceholder'),
    createFolderTitle: t(locale, 'home.createFolderTitle'),
    createFolderPlaceholder: t(locale, 'home.createFolderPlaceholder'),
    newFolderAction: t(locale, 'home.newFolderAction'),
    removeFolderConfirmTitle: t(locale, 'home.removeFolderConfirmTitle'),
    removeFolderConfirmBody: t(locale, 'home.removeFolderConfirmBody'),
    emptyTrashTitle: t(locale, 'home.emptyTrashTitle'),
    noFolderTargets: t(locale, 'home.noFolderTargets'),
  },
  import: {
    pickButton: t(locale, 'import.pickButton'),
    preparing: t(locale, 'import.preparing'),
    preparingBody: t(locale, 'import.preparingBody'),
    iCloudWarningTitle: t(locale, 'import.iCloudWarningTitle'),
    iCloudWarningBody: t(locale, 'import.iCloudWarningBody'),
    unsupportedTitle: t(locale, 'import.unsupportedTitle'),
    unsupportedBody: t(locale, 'import.unsupportedBody'),
    relinkButton: t(locale, 'import.relinkButton'),
    doneButton: t(locale, 'import.doneButton'),
  },
  editor: {
    addRegion: t(locale, 'editor.addRegion'),
    regions: t(locale, 'editor.regions'),
    params: t(locale, 'editor.params'),
    keyframes: t(locale, 'editor.keyframes'),
    view: t(locale, 'editor.view'),
    undo: t(locale, 'editor.undo'),
    redo: t(locale, 'editor.redo'),
    noTrackTitle: t(locale, 'editor.noTrackTitle'),
    noTrackBody: t(locale, 'editor.noTrackBody'),
    previewUnavailable: t(locale, 'editor.previewUnavailable'),
    fitToScreen: t(locale, 'editor.fitToScreen'),
    addKeyframe: t(locale, 'editor.addKeyframe'),
    deleteKeyframe: t(locale, 'editor.deleteKeyframe'),
    snapHint: t(locale, 'editor.snapHint'),
    precisionOn: t(locale, 'editor.precisionOn'),
    precisionOff: t(locale, 'editor.precisionOff'),
    markerMenuTitle: t(locale, 'editor.markerMenuTitle'),
    jumpToMarker: t(locale, 'editor.jumpToMarker'),
    editMarker: t(locale, 'editor.editMarker'),
    deleteMarker: t(locale, 'editor.deleteMarker'),
    faceTemplate: t(locale, 'editor.faceTemplate'),
    plateTemplate: t(locale, 'editor.plateTemplate'),
    rectangle: t(locale, 'editor.rectangle'),
    roundedRect: t(locale, 'editor.roundedRect'),
    ellipse: t(locale, 'editor.ellipse'),
    path: t(locale, 'editor.path'),
    removeRegion: t(locale, 'editor.removeRegion'),
    saveAsTemplate: t(locale, 'editor.saveAsTemplate'),
    saveTemplateTitle: t(locale, 'editor.saveTemplateTitle'),
    templateNameLabel: t(locale, 'editor.templateNameLabel'),
    templateNamePlaceholder: t(locale, 'editor.templateNamePlaceholder'),
    templateCategoryLabel: t(locale, 'editor.templateCategoryLabel'),
    templateCategoryPlaceholder: t(locale, 'editor.templateCategoryPlaceholder'),
    templateDefaultCategory: t(locale, 'editor.templateDefaultCategory'),
    applyTemplate: t(locale, 'editor.applyTemplate'),
    applyTemplateTitle: t(locale, 'editor.applyTemplateTitle'),
    noTemplatesYet: t(locale, 'editor.noTemplatesYet'),
    removeAllRegions: t(locale, 'editor.removeAllRegions'),
    playPreview: t(locale, 'editor.playPreview'),
    pausePreview: t(locale, 'editor.pausePreview'),
  },
  params: {
    strength: t(locale, 'params.strength'),
    feather: t(locale, 'params.feather'),
    opacity: t(locale, 'params.opacity'),
    positionX: t(locale, 'params.positionX'),
    positionY: t(locale, 'params.positionY'),
    width: t(locale, 'params.width'),
    height: t(locale, 'params.height'),
    rotation: t(locale, 'params.rotation'),
    cornerRadius: t(locale, 'params.cornerRadius'),
    blendMode: t(locale, 'params.blendMode'),
    gaussian: t(locale, 'params.gaussian'),
    bokeh: t(locale, 'params.bokeh'),
    motionBlur: t(locale, 'params.motionBlur'),
    bilateral: t(locale, 'params.bilateral'),
    smartBlur: t(locale, 'params.smartBlur'),
    radial: t(locale, 'params.radial'),
  },
  keyframes: {
    interpolation: t(locale, 'keyframes.interpolation'),
    linear: t(locale, 'keyframes.linear'),
    easeInOut: t(locale, 'keyframes.easeInOut'),
    spring: t(locale, 'keyframes.spring'),
    hold: t(locale, 'keyframes.hold'),
    parameterControl: t(locale, 'keyframes.parameterControl'),
  },
  view: {
    previewQuality: t(locale, 'view.previewQuality'),
    guides: t(locale, 'view.guides'),
    thumbnails: t(locale, 'view.thumbnails'),
    safeAreaOverlay: t(locale, 'view.safeAreaOverlay'),
    ultra: t(locale, 'view.ultra'),
    balanced: t(locale, 'view.balanced'),
    smooth: t(locale, 'view.smooth'),
  },
  export: {
    startButton: t(locale, 'export.startButton'),
    cancelButton: t(locale, 'export.cancelButton'),
    successTitle: t(locale, 'export.successTitle'),
    successBody: t(locale, 'export.successBody'),
    settingsTitle: t(locale, 'export.settingsTitle'),
    stageDecoding: t(locale, 'export.stageDecoding'),
    stageApplying: t(locale, 'export.stageApplying'),
    stageEncoding: t(locale, 'export.stageEncoding'),
    stageSaving: t(locale, 'export.stageSaving'),
    hdrWarning: t(locale, 'export.hdrWarning'),
    lowStorageTitle: t(locale, 'export.lowStorageTitle'),
    lowStorageBody: t(locale, 'export.lowStorageBody'),
    toggleSettings: t(locale, 'export.toggleSettings'),
    codecLabel: t(locale, 'export.codecLabel'),
    codecH264: t(locale, 'export.codecH264'),
    codecHevc: t(locale, 'export.codecHevc'),
    framerateLabel: t(locale, 'export.framerateLabel'),
    resolutionLabel: t(locale, 'export.resolutionLabel'),
    resolution4k: t(locale, 'export.resolution4k'),
    includeAudioLabel: t(locale, 'export.includeAudioLabel'),
    includeAudioOn: t(locale, 'export.includeAudioOn'),
    includeAudioOff: t(locale, 'export.includeAudioOff'),
    cancelledLabel: t(locale, 'export.cancelledLabel'),
    failedLabel: t(locale, 'export.failedLabel'),
  },
  settings: {
    appearance: t(locale, 'settings.appearance'),
    motion: t(locale, 'settings.motion'),
    preview: t(locale, 'settings.preview'),
    export: t(locale, 'settings.export'),
    storage: t(locale, 'settings.storage'),
    about: t(locale, 'settings.about'),
    appearanceSystem: t(locale, 'settings.appearanceSystem'),
    appearanceDark: t(locale, 'settings.appearanceDark'),
    appearanceLight: t(locale, 'settings.appearanceLight'),
    reduceMotionSystem: t(locale, 'settings.reduceMotionSystem'),
    reduceMotionOn: t(locale, 'settings.reduceMotionOn'),
    reduceMotionOff: t(locale, 'settings.reduceMotionOff'),
    accentColor: t(locale, 'settings.accentColor'),
    previewQualityDefault: t(locale, 'settings.previewQualityDefault'),
    autoThumbs: t(locale, 'settings.autoThumbs'),
    safeAreaDefault: t(locale, 'settings.safeAreaDefault'),
    clearCache: t(locale, 'settings.clearCache'),
    cleanTrash: t(locale, 'settings.cleanTrash'),
    cleanTrashTitle: t(locale, 'settings.cleanTrashTitle'),
    cleanTrashBody: t(locale, 'settings.cleanTrashBody'),
    storageUsage: t(locale, 'settings.storageUsage'),
    projectsCached: t(locale, 'settings.projectsCached'),
    version: t(locale, 'settings.version'),
    offlineOnly: t(locale, 'settings.offlineOnly'),
    accentColorOption: (color: string) =>
      t(locale, 'settings.accentColorOption', { color }),
  },
  edgeCases: {
    largeVideoSwitched: t(locale, 'edgeCases.largeVideoSwitched'),
    backgroundPaused: t(locale, 'edgeCases.backgroundPaused'),
    backgroundExportContinues: t(locale, 'edgeCases.backgroundExportContinues'),
    backgroundExportPaused: t(locale, 'edgeCases.backgroundExportPaused'),
    assetUnavailableTitle: t(locale, 'edgeCases.assetUnavailableTitle'),
    assetUnavailableBody: t(locale, 'edgeCases.assetUnavailableBody'),
  },
  accessibility: {
    projectCard: t(locale, 'accessibility.projectCard'),
    addRegionButton: t(locale, 'accessibility.addRegionButton'),
    timeline: t(locale, 'accessibility.timeline'),
    playhead: t(locale, 'accessibility.playhead'),
    exportProgress: t(locale, 'accessibility.exportProgress'),
    settingsButton: t(locale, 'accessibility.settingsButton'),
    importButton: t(locale, 'accessibility.importButton'),
    timelineModePrecision: t(locale, 'accessibility.timelineModePrecision'),
    timelineModeStandard: t(locale, 'accessibility.timelineModeStandard'),
    previewStubTitle: t(locale, 'accessibility.previewStubTitle'),
    selectTrack: (name: string) => t(locale, 'accessibility.selectTrack', { name }),
    deleteTrack: (name: string) => t(locale, 'accessibility.deleteTrack', { name }),
    toggleVisibility: (name: string) => t(locale, 'accessibility.toggleVisibility', { name }),
    toggleLock: (name: string) => t(locale, 'accessibility.toggleLock', { name }),
    openPanel: (name: string) => t(locale, 'accessibility.openPanel', { name }),
    collapseSheet: (name: string) => t(locale, 'accessibility.collapseSheet', { name }),
    adjustTrackStart: (name: string) =>
      t(locale, 'accessibility.adjustTrackStart', { name }),
    adjustTrackEnd: (name: string) =>
      t(locale, 'accessibility.adjustTrackEnd', { name }),
    keyframeAt: (time: string | number) => t(locale, 'accessibility.keyframeAt', { time }),
    keyframeParameter: (name: string) =>
      t(locale, 'accessibility.keyframeParameter', { name }),
    continueAfterTestimonials: t(locale, 'accessibility.continueAfterTestimonials'),
  },
  naming: {
    projectDefault: (date: string) => t(locale, 'naming.projectDefault', { date }),
    regionDefault: (index: number) => t(locale, 'naming.regionDefault', { index }),
    copySuffix: (name: string) => t(locale, 'naming.copySuffix', { name }),
    templateDefault: (name: string) => t(locale, 'naming.templateDefault', { name }),
  },
  onboarding: {
    defaultGoalPhrase: t(locale, 'onboarding.ui.defaultGoalPhrase'),
    welcomeBadge: t(locale, 'onboarding.ui.welcomeBadge'),
    welcomeTitle: t(locale, 'onboarding.ui.welcomeTitle'),
    welcomeBody: t(locale, 'onboarding.ui.welcomeBody'),
    previewFaceChip: t(locale, 'onboarding.ui.previewFaceChip'),
    welcomeMetricPrivate: t(locale, 'onboarding.ui.welcomeMetricPrivate'),
    welcomeMetricNoUpload: t(locale, 'onboarding.ui.welcomeMetricNoUpload'),
    welcomeMetricFastPresets: t(locale, 'onboarding.ui.welcomeMetricFastPresets'),
    goalTitle: t(locale, 'onboarding.ui.goalTitle'),
    goalLead: t(locale, 'onboarding.ui.goalLead'),
    painsTitle: (goal: string) => t(locale, 'onboarding.ui.painsTitle', { goal }),
    painsLead: t(locale, 'onboarding.ui.painsLead'),
    proofTitle: t(locale, 'onboarding.ui.proofTitle'),
    proofLead: t(locale, 'onboarding.ui.proofLead'),
    statementsTitle: t(locale, 'onboarding.ui.statementsTitle'),
    statementsLead: t(locale, 'onboarding.ui.statementsLead'),
    statementProgress: (current: number, total: number) =>
      t(locale, 'onboarding.ui.statementProgress', { current, total }),
    solutionTitle: t(locale, 'onboarding.ui.solutionTitle'),
    solutionLead: t(locale, 'onboarding.ui.solutionLead'),
    comparisonTitle: t(locale, 'onboarding.ui.comparisonTitle'),
    comparisonWhatMatters: t(locale, 'onboarding.ui.comparisonWhatMatters'),
    comparisonWithApp: t(locale, 'onboarding.ui.comparisonWithApp'),
    comparisonWithout: t(locale, 'onboarding.ui.comparisonWithout'),
    preferencesTitle: t(locale, 'onboarding.ui.preferencesTitle'),
    preferencesLead: t(locale, 'onboarding.ui.preferencesLead'),
    preferencesSummaryEyebrow: t(locale, 'onboarding.ui.preferencesSummaryEyebrow'),
    preferencesSummaryTitle: t(locale, 'onboarding.ui.preferencesSummaryTitle'),
    preferencesSummaryBody: t(locale, 'onboarding.ui.preferencesSummaryBody'),
    preferencesBestMatches: t(locale, 'onboarding.ui.preferencesBestMatches'),
    preferencesRecommended: t(locale, 'onboarding.ui.preferencesRecommended'),
    preferencesIncluded: t(locale, 'onboarding.ui.preferencesIncluded'),
    preferencesTapToInclude: t(locale, 'onboarding.ui.preferencesTapToInclude'),
    permissionsTitle: t(locale, 'onboarding.ui.permissionsTitle'),
    permissionsLead: t(locale, 'onboarding.ui.permissionsLead'),
    permissionsImport: t(locale, 'onboarding.ui.permissionsImport'),
    permissionsExport: t(locale, 'onboarding.ui.permissionsExport'),
    permissionsSystemPrompts: t(locale, 'onboarding.ui.permissionsSystemPrompts'),
    permissionsFooter: t(locale, 'onboarding.ui.permissionsFooter'),
    processingTitle: t(locale, 'onboarding.ui.processingTitle'),
    processingLead: (goal: string) =>
      t(locale, 'onboarding.ui.processingLead', { goal }),
    processingSelected: t(locale, 'onboarding.ui.processingSelected'),
    processingOnDevice: t(locale, 'onboarding.ui.processingOnDevice'),
    processingDemoQueued: t(locale, 'onboarding.ui.processingDemoQueued'),
    demoTitle: t(locale, 'onboarding.ui.demoTitle'),
    demoLead: (count: number) => t(locale, 'onboarding.ui.demoLead', { count }),
    demoSelected: (selected: number, total: number) =>
      t(locale, 'onboarding.ui.demoSelected', { selected, total }),
    demoReadyTitle: t(locale, 'onboarding.ui.demoReadyTitle'),
    demoReadyBody: t(locale, 'onboarding.ui.demoReadyBody'),
    valueTitle: t(locale, 'onboarding.ui.valueTitle'),
    valueLead: t(locale, 'onboarding.ui.valueLead'),
    valueEyebrow: t(locale, 'onboarding.ui.valueEyebrow'),
    valueCardTitle: t(locale, 'onboarding.ui.valueCardTitle'),
    valueMetricOnDeviceTitle: t(locale, 'onboarding.ui.valueMetricOnDeviceTitle'),
    valueMetricOnDeviceBody: t(locale, 'onboarding.ui.valueMetricOnDeviceBody'),
    valueMetricExportTitle: t(locale, 'onboarding.ui.valueMetricExportTitle'),
    valueMetricExportBody: t(locale, 'onboarding.ui.valueMetricExportBody'),
    paywallEyebrow: t(locale, 'onboarding.ui.paywallEyebrow'),
    paywallTitle: t(locale, 'onboarding.ui.paywallTitle'),
    paywallLead: t(locale, 'onboarding.ui.paywallLead'),
    paywallTrialTitle: t(locale, 'onboarding.ui.paywallTrialTitle'),
    paywallTrialPrice: t(locale, 'onboarding.ui.paywallTrialPrice'),
    paywallReviewTitle: t(locale, 'onboarding.ui.paywallReviewTitle'),
    paywallReviewBody: t(locale, 'onboarding.ui.paywallReviewBody'),
    footerWelcome: t(locale, 'onboarding.ui.footerWelcome'),
    footerGoal: t(locale, 'onboarding.ui.footerGoal'),
    footerPains: t(locale, 'onboarding.ui.footerPains'),
    footerNotReally: t(locale, 'onboarding.ui.footerNotReally'),
    footerThatIsMe: t(locale, 'onboarding.ui.footerThatIsMe'),
    footerSolution: t(locale, 'onboarding.ui.footerSolution'),
    footerPreferences: t(locale, 'onboarding.ui.footerPreferences'),
    footerReady: t(locale, 'onboarding.ui.footerReady'),
    footerSkipThis: t(locale, 'onboarding.ui.footerSkipThis'),
    footerBlurIt: t(locale, 'onboarding.ui.footerBlurIt'),
    footerPlans: t(locale, 'onboarding.ui.footerPlans'),
    footerShare: t(locale, 'onboarding.ui.footerShare'),
    footerStartTrial: t(locale, 'onboarding.ui.footerStartTrial'),
    footerContinueFree: t(locale, 'onboarding.ui.footerContinueFree'),
    shareSetupFallback: t(locale, 'onboarding.ui.shareSetupFallback'),
    shareSetupMessage: (labels: string[]) =>
      t(locale, 'onboarding.ui.shareSetupMessage', {
        labels:
          formatList(labels) || t(locale, 'onboarding.ui.shareSetupFallback'),
      }),
  },
  onboardingContent: {
    goals: goalIds.map(id => ({
      id,
      title: t(locale, `onboarding.content.goals.${id}.title`),
      goalPhrase: t(locale, `onboarding.content.goals.${id}.goalPhrase`),
      body: t(locale, `onboarding.content.goals.${id}.body`),
    })),
    pains: painIds.map(id => ({
      id,
      title: t(locale, `onboarding.content.pains.${id}.title`),
      body: t(locale, `onboarding.content.pains.${id}.body`),
    })),
    testimonials: [
      {
        id: 'parent',
        name: 'Mila K.',
        persona: t(locale, 'onboarding.content.testimonials.parent.persona'),
        quote: t(locale, 'onboarding.content.testimonials.parent.quote'),
      },
      {
        id: 'rideshare',
        name: 'Dante R.',
        persona: t(locale, 'onboarding.content.testimonials.rideshare.persona'),
        quote: t(locale, 'onboarding.content.testimonials.rideshare.quote'),
      },
      {
        id: 'freelance',
        name: 'Noah P.',
        persona: t(locale, 'onboarding.content.testimonials.freelance.persona'),
        quote: t(locale, 'onboarding.content.testimonials.freelance.quote'),
      },
    ],
    statements: [
      {
        id: 'delay-posting',
        quote: t(locale, 'onboarding.content.statements.delay-posting'),
      },
      {
        id: 'zoom-check',
        quote: t(locale, 'onboarding.content.statements.zoom-check'),
      },
      {
        id: 'privacy-tools',
        quote: t(locale, 'onboarding.content.statements.privacy-tools'),
      },
      {
        id: 'overkill',
        quote: t(locale, 'onboarding.content.statements.overkill'),
      },
    ],
    preferences: preferenceIds.map(id => ({
      id,
      title: t(locale, `onboarding.content.preferences.${id}.title`),
      body: t(locale, `onboarding.content.preferences.${id}.body`),
    })),
    solutions: Object.fromEntries(
      painIds.map(id => [
        id,
        {
          id,
          eyebrow: t(locale, `onboarding.content.solutions.${id}.eyebrow`),
          headline: t(locale, `onboarding.content.solutions.${id}.headline`),
          detail: t(locale, `onboarding.content.solutions.${id}.detail`),
        },
      ]),
    ),
    demoTargets: demoIds.map(id => ({
      id,
      title: t(locale, `onboarding.content.demo.${id}.title`),
      subtitle: t(locale, `onboarding.content.demo.${id}.subtitle`),
      label: t(locale, `onboarding.content.demo.${id}.label`),
      detail: t(locale, `onboarding.content.demo.${id}.detail`),
    })),
    paywallFeatures: [1, 2, 3].map(index =>
      t(locale, `onboarding.content.paywall.features.${index}`),
    ),
    comparisonRows: ['privacy', 'speed', 'confidence'].map(id => ({
      id,
      label: t(locale, `onboarding.content.comparison.${id}.label`),
      withApp: t(locale, `onboarding.content.comparison.${id}.withApp`),
      withoutApp: t(locale, `onboarding.content.comparison.${id}.withoutApp`),
    })),
  },
});

export const STRINGS = createStrings(APP_LOCALE);
export type AppStrings = ReturnType<typeof createStrings>;
