import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';

/**
 * Общие стили экранов замеров (онбординг и повтор).
 */
export function useBiometricFlowStyles() {
  const t = useAppTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        cameraPreview: {
          borderRadius: 16,
          flex: 1,
          minHeight: 320,
          overflow: 'hidden',
        },
        captureBar: {
          alignItems: 'center',
          gap: 12,
          paddingBottom: 8,
          paddingTop: 16,
        },
        captureHint: {
          color: t.textSecondary,
          fontSize: 14,
          lineHeight: 20,
          textAlign: 'center',
        },
        captureScreen: {
          backgroundColor: t.background,
          flex: 1,
        },
        captureTitle: {
          color: t.text,
          fontSize: 18,
          fontWeight: '800',
          marginBottom: 4,
        },
        blockTitle: {
          color: t.text,
          fontSize: 22,
          fontWeight: '800',
          letterSpacing: -0.4,
          marginBottom: 12,
        },
        ghostTop: {
          alignSelf: 'flex-start',
          marginBottom: 12,
        },
        ghostTopText: {
          color: t.link,
          fontSize: 15,
          fontWeight: '600',
        },
        instructionBox: {
          backgroundColor: t.backgroundMuted,
          borderRadius: 12,
          color: t.textSecondary,
          fontSize: 15,
          lineHeight: 22,
          marginTop: 8,
          overflow: 'hidden',
          padding: 16,
        },
        lead: {
          color: t.textSecondary,
          fontSize: 15,
          lineHeight: 23,
          marginBottom: 10,
        },
        mockBioArea: {
          alignItems: 'center',
          alignSelf: 'stretch',
          backgroundColor: t.backgroundMuted,
          borderColor: t.border,
          borderRadius: 16,
          borderStyle: 'dashed',
          borderWidth: 1,
          justifyContent: 'center',
          marginVertical: 16,
          minHeight: 140,
          padding: 16,
        },
        mockBioHint: {
          color: t.textMuted,
          fontSize: 14,
          lineHeight: 20,
          textAlign: 'center',
        },
        primary: {
          alignItems: 'center',
          alignSelf: 'stretch',
          backgroundColor: t.tint,
          borderRadius: 14,
          marginTop: 24,
          paddingVertical: 16,
        },
        primaryText: {
          color: t.tintForeground,
          fontSize: 17,
          fontWeight: '700',
        },
        privacyBox: {
          backgroundColor: t.warningSurface,
          borderColor: t.warningBorder,
          borderRadius: 12,
          borderWidth: 1,
          color: t.warningText,
          fontSize: 14,
          lineHeight: 20,
          marginTop: 12,
          padding: 14,
        },
        scroll: { paddingHorizontal: 20, paddingVertical: 8, paddingBottom: 44 },
        secondary: { alignSelf: 'flex-start', marginTop: 16, paddingVertical: 8 },
        secondaryText: { color: t.link, fontSize: 16, fontWeight: '600' },
        summaryBox: {
          backgroundColor: t.backgroundMuted,
          borderRadius: 12,
          gap: 8,
          marginTop: 12,
          padding: 16,
        },
        summaryLabel: {
          color: t.textMuted,
          fontSize: 13,
        },
        summaryValue: {
          color: t.text,
          fontSize: 15,
          lineHeight: 22,
        },
      }),
    [t],
  );
}
