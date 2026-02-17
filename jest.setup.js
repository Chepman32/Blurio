/* eslint-env jest */
import 'react-native-gesture-handler/jestSetup';

const animationBuilder = {
  delay: () => animationBuilder,
  springify: () => animationBuilder,
  duration: () => animationBuilder,
};

jest.mock('react-native-worklets', () => ({}));

jest.mock('react-native-reanimated', () => {
  const Animated = {
    View: 'AnimatedView',
    Text: 'AnimatedText',
    Image: 'AnimatedImage',
    ScrollView: 'AnimatedScrollView',
    createAnimatedComponent: Component => Component,
  };

  return {
    __esModule: true,
    default: Animated,
    createAnimatedComponent: Component => Component,
    useSharedValue: value => ({ value }),
    useAnimatedStyle: updater => updater(),
    useAnimatedProps: updater => updater(),
    withSpring: value => value,
    withTiming: value => value,
    withRepeat: value => value,
    withDelay: (_delay, value) => value,
    withSequence: (...values) => values[values.length - 1],
    withDecay: value => value,
    runOnJS: fn => fn,
    runOnUI: fn => (...args) => fn(...args),
    cancelAnimation: jest.fn(),
    scrollTo: jest.fn(),
    measure: jest.fn(() => ({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      pageX: 0,
      pageY: 0,
    })),
    useDerivedValue: updater => ({ value: updater() }),
    useAnimatedReaction: jest.fn(),
    useAnimatedRef: () => ({ current: null }),
    useFrameCallback: jest.fn(),
    interpolate: (value, input, output) => {
      if (!input.length || !output.length || input.length !== output.length) {
        return value;
      }
      if (value <= input[0]) {
        return output[0];
      }
      const last = input.length - 1;
      if (value >= input[last]) {
        return output[last];
      }
      for (let i = 1; i < input.length; i += 1) {
        if (value <= input[i]) {
          const t = (value - input[i - 1]) / (input[i] - input[i - 1]);
          return output[i - 1] + (output[i] - output[i - 1]) * t;
        }
      }
      return output[last];
    },
    Easing: {
      linear: jest.fn(),
      quad: jest.fn(),
      cubic: jest.fn(),
      out: fn => fn,
      inOut: fn => fn,
    },
    FadeIn: animationBuilder,
    FadeOut: animationBuilder,
    FadeInDown: animationBuilder,
    ZoomIn: animationBuilder,
    ZoomOut: animationBuilder,
  };
});

jest.mock('react-native-mmkv', () => ({
  createMMKV: () => {
    const store = new Map();
    return {
      getString: key => store.get(key),
      set: (key, value) => store.set(key, value),
      remove: key => store.delete(key),
    };
  },
}));

jest.mock('react-native-fs', () => ({
  TemporaryDirectoryPath: '/tmp',
  CachesDirectoryPath: '/tmp',
  getFSInfo: jest.fn(async () => ({ freeSpace: 9_000_000_000 })),
  exists: jest.fn(async () => true),
  unlink: jest.fn(async () => {}),
}));

jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
}));

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(async () => ({ assets: [] })),
}));

jest.mock('react-native-blur', () => ({
  BlurView: 'BlurView',
}));

jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('react-native-svg', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: View,
    Svg: View,
    Circle: View,
    Rect: View,
    Polygon: View,
  };
});

jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');

jest.mock('react-native-screens', () => {
  const { View } = require('react-native');
  return {
    enableScreens: jest.fn(),
    Screen: View,
    ScreenContainer: View,
    NativeScreen: View,
    NativeScreenContainer: View,
    FullWindowOverlay: View,
  };
});
