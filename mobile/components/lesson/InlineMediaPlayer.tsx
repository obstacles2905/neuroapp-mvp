import * as WebBrowser from 'expo-web-browser';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Video, ResizeMode, type AVPlaybackStatus } from 'expo-av';
import type { AppTokens } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useCallback, useEffect, useMemo, useRef, useState, type JSX } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

type Props = {
  url: string;
};

const DEFAULT_ASPECT_RATIO = 16 / 9;
const MAX_VIDEO_HEIGHT_RATIO = 0.58;
const USE_NATIVE_CONTROLS = Platform.OS !== 'web';
const SEEK_THUMB_SIZE = 14;

type VideoReadyEvent = {
  naturalSize?: {
    width: number;
    height: number;
  };
};

type InlineMediaStyles = ReturnType<typeof createInlineMediaStyles>;

type VideoSeekBarProps = {
  durationMillis: number;
  positionMillis: number;
  styles: InlineMediaStyles;
  tint: string;
  onSeek: (millis: number) => void;
  onSeekingChange: (seeking: boolean) => void;
};

function readNaturalAspectRatio(
  naturalSize: { width: number; height: number } | undefined,
): number | null {
  if (naturalSize == null) {
    return null;
  }
  const { width, height } = naturalSize;
  if (width <= 0 || height <= 0) {
    return null;
  }
  return width / height;
}

function fitVideoBox(
  containerWidth: number,
  aspectRatio: number,
  maxHeight: number,
): { width: number; height: number } {
  let width = containerWidth;
  let height = width / aspectRatio;
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }
  return {
    width: Math.round(width),
    height: Math.round(height),
  };
}

function formatPlaybackTime(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function millisFromLocationX(
  locationX: number,
  trackWidth: number,
  durationMillis: number,
): number {
  if (trackWidth <= 0 || durationMillis <= 0) {
    return 0;
  }
  const ratio = Math.max(0, Math.min(1, locationX / trackWidth));
  return Math.round(ratio * durationMillis);
}

async function safeUnloadVideo(video: Video): Promise<void> {
  try {
    const status = await video.getStatusAsync();
    if (!status.isLoaded) {
      return;
    }
    await video.unloadAsync();
  } catch {
    /* teardown race: player never loaded or already disposed */
  }
}

function VideoSeekBar(props: VideoSeekBarProps): JSX.Element {
  const {
    durationMillis,
    positionMillis,
    styles,
    tint,
    onSeek,
    onSeekingChange,
  } = props;
  const trackWidthRef = useRef(0);
  const [previewMillis, setPreviewMillis] = useState<number | null>(null);
  const displayMillis = previewMillis ?? positionMillis;
  const ratio =
    durationMillis > 0 ? Math.max(0, Math.min(1, displayMillis / durationMillis)) : 0;

  const updatePreview = useCallback(
    (locationX: number) => {
      setPreviewMillis(
        millisFromLocationX(locationX, trackWidthRef.current, durationMillis),
      );
    },
    [durationMillis],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: () => durationMillis > 0,
        onPanResponderGrant: (event) => {
          onSeekingChange(true);
          updatePreview(event.nativeEvent.locationX);
        },
        onPanResponderMove: (event) => {
          updatePreview(event.nativeEvent.locationX);
        },
        onPanResponderRelease: (event) => {
          const target = millisFromLocationX(
            event.nativeEvent.locationX,
            trackWidthRef.current,
            durationMillis,
          );
          setPreviewMillis(null);
          onSeekingChange(false);
          onSeek(target);
        },
        onPanResponderTerminate: () => {
          setPreviewMillis(null);
          onSeekingChange(false);
        },
        onStartShouldSetPanResponder: () => durationMillis > 0,
      }),
    [durationMillis, onSeek, onSeekingChange, updatePreview],
  );

  return (
    <View
      style={styles.seekTrackHit}
      onLayout={(event) => {
        trackWidthRef.current = event.nativeEvent.layout.width;
      }}
      {...panResponder.panHandlers}
    >
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { backgroundColor: tint, width: `${ratio * 100}%` },
          ]}
        />
      </View>
      <View
        pointerEvents="none"
        style={[
          styles.seekThumb,
          {
            left: `${ratio * 100}%`,
            marginLeft: -SEEK_THUMB_SIZE / 2,
          },
        ]}
      />
    </View>
  );
}

export function InlineMediaPlayer({ url }: Props): JSX.Element {
  const ref = useRef<Video | null>(null);
  const shellRef = useRef<View | null>(null);
  const isSeekingRef = useRef(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(DEFAULT_ASPECT_RATIO);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);
  const [viewportTick, setViewportTick] = useState(0);
  const theme = useAppTheme();
  const styles = useMemo(() => createInlineMediaStyles(theme), [theme]);
  const maxVideoHeight = useMemo(
    () => Math.round(Dimensions.get('window').height * MAX_VIDEO_HEIGHT_RATIO),
    [],
  );

  useEffect(() => {
    setLoadFailed(false);
    setAspectRatio(DEFAULT_ASPECT_RATIO);
    setContainerWidth(0);
    setIsLoaded(false);
    setIsPlaying(false);
    setIsFullscreen(false);
    setPositionMillis(0);
    setDurationMillis(0);
    isSeekingRef.current = false;

    return () => {
      const video = ref.current;
      if (video != null) {
        void safeUnloadVideo(video);
      }
    };
  }, [url]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }
    const syncFullscreen = (): void => {
      const shell = shellRef.current as unknown as HTMLElement | null;
      const active =
        shell != null &&
        typeof document !== 'undefined' &&
        document.fullscreenElement === shell;
      setIsFullscreen(active);
      if (active) {
        setViewportTick((tick) => tick + 1);
      }
    };
    document.addEventListener('fullscreenchange', syncFullscreen);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const onResize = (): void => {
        if (typeof document !== 'undefined' && document.fullscreenElement != null) {
          setViewportTick((tick) => tick + 1);
        }
      };
      window.addEventListener('resize', onResize);
      return () => {
        document.removeEventListener('fullscreenchange', syncFullscreen);
        window.removeEventListener('resize', onResize);
      };
    }
    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreen);
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || !isFullscreen || !isLoaded) {
      return;
    }
    const shell = shellRef.current as unknown as HTMLElement | null;
    const videoEl = shell?.querySelector('video');
    if (videoEl == null) {
      return;
    }
    videoEl.style.width = '100%';
    videoEl.style.height = '100%';
    videoEl.style.objectFit = 'contain';
    videoEl.style.display = 'block';
  }, [isFullscreen, isLoaded, viewportTick]);

  const openExternal = useCallback(() => {
    void WebBrowser.openBrowserAsync(url);
  }, [url]);

  const applyAspectRatio = useCallback(
    (naturalSize: { width: number; height: number } | undefined) => {
      const next = readNaturalAspectRatio(naturalSize);
      if (next == null) {
        return;
      }
      setAspectRatio(next);
    },
    [],
  );

  const handleReadyForDisplay = useCallback(
    (event?: VideoReadyEvent) => {
      applyAspectRatio(event?.naturalSize);
    },
    [applyAspectRatio],
  );

  const handlePlaybackStatusUpdate = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) {
        return;
      }
      applyAspectRatio(status.naturalSize);
      setIsLoaded(true);
      setIsPlaying(status.isPlaying);
      if (!isSeekingRef.current) {
        setPositionMillis(status.positionMillis);
      }
      setDurationMillis(status.durationMillis ?? 0);
    },
    [applyAspectRatio],
  );

  const togglePlayback = useCallback(async () => {
    const video = ref.current;
    if (video == null) {
      return;
    }
    const status = await video.getStatusAsync();
    if (!status.isLoaded) {
      return;
    }
    if (status.isPlaying) {
      await video.pauseAsync();
      return;
    }
    await video.playAsync();
  }, []);

  const seekTo = useCallback(async (millis: number) => {
    const video = ref.current;
    if (video == null || durationMillis <= 0) {
      return;
    }
    const clamped = Math.max(0, Math.min(durationMillis, millis));
    setPositionMillis(clamped);
    await video.setPositionAsync(clamped);
  }, [durationMillis]);

  const handleSeekingChange = useCallback((seeking: boolean) => {
    isSeekingRef.current = seeking;
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (Platform.OS !== 'web') {
      try {
        await ref.current?.presentFullscreenPlayer?.();
      } catch {
        /* native fullscreen may be unavailable */
      }
      return;
    }
    const shell = shellRef.current as unknown as HTMLElement | null;
    if (shell == null || typeof document === 'undefined') {
      return;
    }
    if (document.fullscreenElement != null) {
      await document.exitFullscreen();
      setIsFullscreen(false);
      return;
    }
    setIsFullscreen(true);
    if (shell.requestFullscreen != null) {
      await shell.requestFullscreen();
      return;
    }
    const legacyShell = shell as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
    };
    await legacyShell.webkitRequestFullscreen?.();
  }, []);

  const videoShellStyle = useMemo((): ViewStyle[] => {
    if (isFullscreen) {
      const { width, height } = Dimensions.get('window');
      return [
        styles.videoBox,
        styles.videoBoxFullscreen,
        { width, height },
      ];
    }
    if (containerWidth <= 0) {
      return [styles.videoBox, { aspectRatio }];
    }
    const size = fitVideoBox(containerWidth, aspectRatio, maxVideoHeight);
    return [styles.videoBox, size];
  }, [
    aspectRatio,
    containerWidth,
    isFullscreen,
    maxVideoHeight,
    styles.videoBox,
    styles.videoBoxFullscreen,
    viewportTick,
  ]);

  const videoResizeMode = ResizeMode.CONTAIN;

  if (loadFailed) {
    return (
      <View style={styles.fallbackBox}>
        <Text style={styles.fallbackText}>
          Не удалось воспроизвести файл в приложении (возможен неподдерживаемый формат).
        </Text>
        <Pressable style={styles.btnSecondary} onPress={openExternal}>
          <Text style={styles.btnSecondaryText}>Открыть в браузере</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      style={styles.wrap}
      onLayout={(event) => {
        const nextWidth = event.nativeEvent.layout.width;
        if (nextWidth > 0) {
          setContainerWidth(nextWidth);
        }
      }}
    >
      <View ref={shellRef} style={videoShellStyle}>
        <View style={[styles.videoStage, isFullscreen && styles.videoStageFullscreen]}>
          <Video
            ref={ref}
            style={[styles.videoFill, isFullscreen && styles.videoFillFullscreen]}
            source={{ uri: url }}
            useNativeControls={USE_NATIVE_CONTROLS}
            resizeMode={videoResizeMode}
            isLooping={false}
            progressUpdateIntervalMillis={250}
            onReadyForDisplay={handleReadyForDisplay}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            onError={() => setLoadFailed(true)}
          />

          {!isLoaded ? (
            <View style={styles.loadingOverlay} pointerEvents="none">
              <ActivityIndicator color="#FFFFFF" size="large" />
            </View>
          ) : null}

          {!USE_NATIVE_CONTROLS && isLoaded ? (
            <Pressable
              style={[
                styles.videoTapLayer,
                !isPlaying && styles.videoTapLayerPaused,
              ]}
              accessibilityRole="button"
              accessibilityLabel={isPlaying ? 'Пауза' : 'Воспроизвести видео'}
              onPress={() => {
                void togglePlayback();
              }}
            >
              {!isPlaying ? (
                <>
                  <View style={styles.playButton}>
                    <FontAwesome color="#FFFFFF" name="play" size={28} />
                  </View>
                  <Text style={styles.playHint}>Нажмите, чтобы воспроизвести</Text>
                </>
              ) : null}
            </Pressable>
          ) : null}
        </View>

        {!USE_NATIVE_CONTROLS && isLoaded ? (
          <View
            style={[
              styles.controlsBar,
              isFullscreen && styles.controlsBarFullscreen,
            ]}
          >
            <Pressable
              style={styles.controlsBtn}
              accessibilityRole="button"
              accessibilityLabel={isPlaying ? 'Пауза' : 'Воспроизвести'}
              onPress={() => {
                void togglePlayback();
              }}
            >
              <FontAwesome
                color="#FFFFFF"
                name={isPlaying ? 'pause' : 'play'}
                size={16}
              />
            </Pressable>
            <VideoSeekBar
              durationMillis={durationMillis}
              positionMillis={positionMillis}
              styles={styles}
              tint={theme.tint}
              onSeek={(millis) => {
                void seekTo(millis);
              }}
              onSeekingChange={handleSeekingChange}
            />
            <Text style={styles.timeText}>
              {formatPlaybackTime(positionMillis)}
              {durationMillis > 0 ? ` / ${formatPlaybackTime(durationMillis)}` : ''}
            </Text>
            <Pressable
              style={styles.controlsBtn}
              accessibilityRole="button"
              accessibilityLabel={isFullscreen ? 'Выйти из полноэкранного режима' : 'Полный экран'}
              onPress={() => {
                void toggleFullscreen();
              }}
            >
              <FontAwesome
                color="#FFFFFF"
                name={isFullscreen ? 'compress' : 'expand'}
                size={16}
              />
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function createInlineMediaStyles(t: AppTokens) {
  return StyleSheet.create({
    btnSecondary: {
      alignSelf: 'flex-start',
      backgroundColor: t.tint,
      borderRadius: 12,
      marginTop: 8,
      paddingHorizontal: 16,
      paddingVertical: 11,
    },
    btnSecondaryText: {
      color: t.tintForeground,
      fontSize: 15,
      fontWeight: '700',
    },
    controlsBar: {
      alignItems: 'center',
      backgroundColor: 'rgba(15, 23, 42, 0.92)',
      borderTopColor: 'rgba(255, 255, 255, 0.12)',
      borderTopWidth: StyleSheet.hairlineWidth,
      bottom: 0,
      flexDirection: 'row',
      gap: 8,
      left: 0,
      paddingHorizontal: 10,
      paddingVertical: 8,
      position: 'absolute',
      right: 0,
      zIndex: 3,
    },
    controlsBarFullscreen: {
      bottom: undefined,
      flexShrink: 0,
      left: undefined,
      position: 'relative',
      right: undefined,
    },
    controlsBtn: {
      alignItems: 'center',
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    fallbackBox: {
      marginTop: 4,
    },
    fallbackText: {
      color: t.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      backgroundColor: 'rgba(15, 23, 42, 0.45)',
      justifyContent: 'center',
      zIndex: 1,
    },
    playButton: {
      alignItems: 'center',
      backgroundColor: t.tint,
      borderRadius: 36,
      height: 72,
      justifyContent: 'center',
      paddingLeft: 4,
      width: 72,
    },
    playHint: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
      marginTop: 12,
      textAlign: 'center',
    },
    progressFill: {
      borderRadius: 999,
      height: '100%',
    },
    progressTrack: {
      backgroundColor: 'rgba(255, 255, 255, 0.24)',
      borderRadius: 999,
      height: 6,
      overflow: 'hidden',
      width: '100%',
    },
    seekThumb: {
      backgroundColor: '#FFFFFF',
      borderColor: t.tint,
      borderRadius: SEEK_THUMB_SIZE / 2,
      borderWidth: 2,
      height: SEEK_THUMB_SIZE,
      position: 'absolute',
      top: '50%',
      transform: [{ translateY: -SEEK_THUMB_SIZE / 2 }],
      width: SEEK_THUMB_SIZE,
    },
    seekTrackHit: {
      flex: 1,
      height: 28,
      justifyContent: 'center',
      minWidth: 80,
      position: 'relative',
    },
    timeText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontVariant: ['tabular-nums'],
      minWidth: 68,
      textAlign: 'right',
    },
    videoBox: {
      alignSelf: 'center',
      backgroundColor: '#0F172A',
      borderRadius: 14,
      overflow: 'hidden',
      position: 'relative',
      width: '100%',
    },
    videoBoxFullscreen: {
      alignSelf: 'stretch',
      borderRadius: 0,
      flexDirection: 'column',
    },
    videoFill: {
      height: '100%',
      width: '100%',
    },
    videoFillFullscreen: Platform.select({
      web: {
        height: '100%',
        objectFit: 'contain',
        width: '100%',
      },
      default: {
        flex: 1,
        height: '100%',
        width: '100%',
      },
    }),
    videoStage: {
      bottom: 0,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
    },
    videoStageFullscreen: {
      flex: 1,
      minHeight: 0,
      position: 'relative',
    },
    videoTapLayer: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      backgroundColor: 'transparent',
      justifyContent: 'center',
      zIndex: 2,
    },
    videoTapLayerPaused: {
      backgroundColor: 'rgba(15, 23, 42, 0.35)',
    },
    wrap: {
      alignItems: 'center',
      marginTop: 4,
      width: '100%',
    },
  });
}
