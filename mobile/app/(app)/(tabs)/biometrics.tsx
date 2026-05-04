import {
  onboardingBiometricCopy,
  repeatBiometricCopy,
} from '@/constants/onboarding-flow.copy';
import { useAuth } from '@/contexts/AuthContext';
import { PostureBurstCapture } from '@/features/biometrics/PostureBurstCapture';
import { useBiometricFlowStyles } from '@/features/biometrics/biometric-flow-styles';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

type BioRepeatPhase =
  | 'intro'
  | 'm1_about'
  | 'm1_action'
  | 'm2_about'
  | 'm2_action'
  | 'done';

export default function BiometricsRepeatScreen(): React.JSX.Element {
  const { isLoggedIn, isReady } = useAuth();
  const t = useAppTheme();
  const bf = useBiometricFlowStyles();
  const [phase, setPhase] = useState<BioRepeatPhase>('intro');

  useFocusEffect(
    useCallback(() => {
      setPhase('intro');
    }, []),
  );

  if (!isReady || !isLoggedIn) {
    return (
      <View
        style={{
          backgroundColor: t.background,
          flex: 1,
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <Text style={bf.blockTitle}>{repeatBiometricCopy.introTitle}</Text>
        <Text style={bf.lead}>Войдите, чтобы проходить замеры.</Text>
      </View>
    );
  }

  if (phase === 'intro') {
    return (
      <ScrollView
        contentContainerStyle={bf.scroll}
        style={{ backgroundColor: t.background, flex: 1 }}
      >
        <Text style={bf.blockTitle}>{repeatBiometricCopy.introTitle}</Text>
        <Text style={bf.lead}>{repeatBiometricCopy.introBody}</Text>
        <Text style={bf.privacyBox}>{onboardingBiometricCopy.privacyNote}</Text>
        <Pressable style={bf.primary} onPress={() => setPhase('m1_about')}>
          <Text style={bf.primaryText}>{repeatBiometricCopy.ctaStart}</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (phase === 'm1_about') {
    return (
      <ScrollView
        contentContainerStyle={bf.scroll}
        style={{ backgroundColor: t.background, flex: 1 }}
      >
        <Text style={bf.blockTitle}>{onboardingBiometricCopy.m1Title}</Text>
        <Text style={bf.lead}>{onboardingBiometricCopy.m1About}</Text>
        <Pressable style={bf.primary} onPress={() => setPhase('m1_action')}>
          <Text style={bf.primaryText}>Дальше</Text>
        </Pressable>
        <Pressable style={bf.secondary} onPress={() => setPhase('intro')}>
          <Text style={bf.secondaryText}>← Назад</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (phase === 'm1_action') {
    return (
      <ScrollView
        contentContainerStyle={bf.scroll}
        style={{ backgroundColor: t.background, flex: 1 }}
      >
        <Text style={bf.blockTitle}>{onboardingBiometricCopy.m1Title}</Text>
        <Text style={bf.instructionBox}>{onboardingBiometricCopy.m1Instruction}</Text>
        <View style={bf.mockBioArea}>
          <Text style={bf.mockBioHint}>
            Место для модуля камеры / ППГ (появится в био-обновлении)
          </Text>
        </View>
        <Pressable style={bf.primary} onPress={() => setPhase('m2_about')}>
          <Text style={bf.primaryText}>Готово — к замеру 2</Text>
        </Pressable>
        <Pressable style={bf.secondary} onPress={() => setPhase('m1_about')}>
          <Text style={bf.secondaryText}>← Назад</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (phase === 'm2_about') {
    return (
      <ScrollView
        contentContainerStyle={bf.scroll}
        style={{ backgroundColor: t.background, flex: 1 }}
      >
        <Text style={bf.blockTitle}>{onboardingBiometricCopy.m2Title}</Text>
        <Text style={bf.lead}>{onboardingBiometricCopy.m2About}</Text>
        <Pressable style={bf.primary} onPress={() => setPhase('m2_action')}>
          <Text style={bf.primaryText}>Дальше</Text>
        </Pressable>
        <Pressable style={bf.secondary} onPress={() => setPhase('m1_action')}>
          <Text style={bf.secondaryText}>← Назад</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (phase === 'm2_action') {
    return (
      <PostureBurstCapture
        screenTitle={onboardingBiometricCopy.m2Title}
        onBack={() => setPhase('m2_about')}
        onComplete={() => setPhase('done')}
      />
    );
  }

  return (
    <ScrollView
      contentContainerStyle={bf.scroll}
      style={{ backgroundColor: t.background, flex: 1 }}
    >
      <Text style={bf.blockTitle}>{repeatBiometricCopy.doneTitle}</Text>
      <Text style={bf.lead}>{repeatBiometricCopy.doneBody}</Text>
      <Pressable style={bf.primary} onPress={() => setPhase('intro')}>
        <Text style={bf.primaryText}>{repeatBiometricCopy.doneCta}</Text>
      </Pressable>
    </ScrollView>
  );
}
