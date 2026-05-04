import * as WebBrowser from 'expo-web-browser';
import { Video, ResizeMode } from 'expo-av';
import type { AppTokens } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useCallback, useEffect, useMemo, useRef, useState, type JSX } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  url: string;
};

export function InlineMediaPlayer({ url }: Props): JSX.Element {
  const ref = useRef<Video | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const theme = useAppTheme();
  const styles = useMemo(() => createInlineMediaStyles(theme), [theme]);

  useEffect(() => {
    setLoadFailed(false);
  }, [url]);

  useEffect(() => {
    const v = ref.current;
    return () => {
      void v?.unloadAsync();
    };
  }, []);

  const openExternal = useCallback(() => {
    void WebBrowser.openBrowserAsync(url);
  }, [url]);

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
    <View style={styles.wrap}>
      <Video
        ref={ref}
        style={styles.video}
        source={{ uri: url }}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        isLooping={false}
        onError={() => setLoadFailed(true)}
      />
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
    fallbackBox: {
      marginTop: 4,
    },
    fallbackText: {
      color: t.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
    video: {
      aspectRatio: 16 / 9,
      backgroundColor: '#0F172A',
      borderRadius: 14,
      overflow: 'hidden',
      width: '100%',
    },
    wrap: {
      marginTop: 4,
      width: '100%',
    },
  });
}
