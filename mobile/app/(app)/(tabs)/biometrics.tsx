import {
  onboardingBiometricCopy,
  repeatBiometricCopy,
} from '@/constants/onboarding-flow.copy';
import { useAuth } from '@/contexts/AuthContext';
import {
  BiometricsUnifiedHistoryScreen,
  type BiometricsHistoryKind,
} from '@/features/biometrics/BiometricsUnifiedHistoryScreen';
import { FaceExpressionCaptureFlow } from '@/features/biometrics/FaceExpressionCaptureFlow';
import { PostureBurstCapture } from '@/features/biometrics/PostureBurstCapture';
import {
  PoseHistoryDetailScreen,
} from '@/features/biometrics/PoseHistoryScreens';
import { VoiceCaptureFlow } from '@/features/biometrics/VoiceCaptureFlow';
import {
  VoiceHistoryDetailScreen,
} from '@/features/biometrics/VoiceHistoryScreens';
import { useBiometricFlowStyles } from '@/features/biometrics/biometric-flow-styles';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

type BioRepeatPhase =
  | 'intro'
  | 'm2_about'
  | 'm2_action'
  | 'history'
  | 'history_detail'
  | 'voice_intro'
  | 'voice_capture'
  | 'face_intro'
  | 'face_capture'
  | 'done';

type HistoryDetailTarget = {
  kind: BiometricsHistoryKind;
  sessionId: string;
};

type BioFlowMode = 'full' | 'single_posture' | 'single_voice' | 'single_face';

export default function BiometricsRepeatScreen(): React.JSX.Element {
  const { isLoggedIn, isReady } = useAuth();
  const t = useAppTheme();
  const bf = useBiometricFlowStyles();
  const [phase, setPhase] = useState<BioRepeatPhase>('intro');
  const [flowMode, setFlowMode] = useState<BioFlowMode>('full');
  const [historyDetail, setHistoryDetail] = useState<HistoryDetailTarget | null>(null);

  const returnToHub = (): void => {
    setFlowMode('full');
    setPhase('intro');
  };

  const isFullCycle = flowMode === 'full';
  const skipPosture = (): void => setPhase('voice_intro');
  const skipVoice = (): void => setPhase('face_intro');
  const skipFace = (): void => setPhase('done');

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

  if (phase === 'history_detail' && historyDetail != null) {
    if (historyDetail.kind === 'pose') {
      return (
        <PoseHistoryDetailScreen
          sessionId={historyDetail.sessionId}
          onBack={() => {
            setHistoryDetail(null);
            setPhase('history');
          }}
        />
      );
    }
    return (
      <VoiceHistoryDetailScreen
        sessionId={historyDetail.sessionId}
        onBack={() => {
          setHistoryDetail(null);
          setPhase('history');
        }}
      />
    );
  }

  if (phase === 'history') {
    return (
      <BiometricsUnifiedHistoryScreen
        emptyHint={repeatBiometricCopy.historyEmpty}
        leadCopy={repeatBiometricCopy.historyLead}
        title={repeatBiometricCopy.historyTitle}
        onBack={() => setPhase('intro')}
        onOpenSession={(kind, sessionId) => {
          setHistoryDetail({ kind, sessionId });
          setPhase('history_detail');
        }}
      />
    );
  }

  if (phase === 'face_capture') {
    return (
      <FaceExpressionCaptureFlow
        screenTitle={repeatBiometricCopy.faceIntroTitle}
        onBack={() => setPhase('face_intro')}
        onComplete={() => {
          if (flowMode === 'single_face') {
            returnToHub();
            return;
          }
          setPhase('done');
        }}
        onSkip={isFullCycle ? skipFace : undefined}
      />
    );
  }

  if (phase === 'face_intro') {
    return (
      <ScrollView
        contentContainerStyle={bf.scroll}
        style={{ backgroundColor: t.background, flex: 1 }}
      >
        <Text style={bf.blockTitle}>{repeatBiometricCopy.faceIntroTitle}</Text>
        <Text style={bf.lead}>{repeatBiometricCopy.faceIntroBody}</Text>
        <Text style={bf.privacyBox}>{repeatBiometricCopy.faceConsentLead}</Text>
        <Pressable style={bf.primary} onPress={() => setPhase('face_capture')}>
          <Text style={bf.primaryText}>{repeatBiometricCopy.faceCtaStart}</Text>
        </Pressable>
        <Pressable
          style={bf.secondary}
          onPress={() => {
            if (flowMode === 'single_face') {
              returnToHub();
              return;
            }
            setPhase('voice_intro');
          }}
        >
          <Text style={bf.secondaryText}>← Назад</Text>
        </Pressable>
        {isFullCycle ? (
          <Pressable style={bf.ghost} onPress={skipFace}>
            <Text style={bf.ghostText}>{repeatBiometricCopy.skipFace}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    );
  }

  if (phase === 'voice_capture') {
    return (
      <VoiceCaptureFlow
        enableRemoteSync={isLoggedIn}
        screenTitle={repeatBiometricCopy.voiceIntroTitle}
        onBack={() => setPhase('voice_intro')}
        onComplete={() => {
          if (flowMode === 'single_voice') {
            returnToHub();
            return;
          }
          setPhase('face_intro');
        }}
        onSkip={isFullCycle ? skipVoice : undefined}
      />
    );
  }

  if (phase === 'voice_intro') {
    return (
      <ScrollView
        contentContainerStyle={bf.scroll}
        style={{ backgroundColor: t.background, flex: 1 }}
      >
        <Text style={bf.blockTitle}>{repeatBiometricCopy.voiceIntroTitle}</Text>
        <Text style={bf.lead}>{repeatBiometricCopy.voiceIntroBody}</Text>
        <Text style={bf.privacyBox}>{onboardingBiometricCopy.privacyNote}</Text>
        <Pressable style={bf.primary} onPress={() => setPhase('voice_capture')}>
          <Text style={bf.primaryText}>{repeatBiometricCopy.voiceCtaStart}</Text>
        </Pressable>
        <Pressable
          style={bf.secondary}
          onPress={() => {
            if (flowMode === 'single_voice') {
              returnToHub();
              return;
            }
            setPhase('m2_about');
          }}
        >
          <Text style={bf.secondaryText}>← Назад</Text>
        </Pressable>
        {isFullCycle ? (
          <Pressable style={bf.ghost} onPress={skipVoice}>
            <Text style={bf.ghostText}>{repeatBiometricCopy.skipVoice}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
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
        <Pressable style={bf.secondary} onPress={() => setPhase('history')}>
          <Text style={bf.secondaryText}>{repeatBiometricCopy.historyCta}</Text>
        </Pressable>
        <Pressable
          style={bf.primary}
          onPress={() => {
            setFlowMode('single_posture');
            setPhase('m2_about');
          }}
        >
          <Text style={bf.primaryText}>{repeatBiometricCopy.ctaPosture}</Text>
        </Pressable>
        <Pressable
          style={bf.primary}
          onPress={() => {
            setFlowMode('single_voice');
            setPhase('voice_intro');
          }}
        >
          <Text style={bf.primaryText}>{repeatBiometricCopy.ctaVoice}</Text>
        </Pressable>
        <Pressable
          style={bf.primary}
          onPress={() => {
            setFlowMode('single_face');
            setPhase('face_intro');
          }}
        >
          <Text style={bf.primaryText}>{repeatBiometricCopy.ctaFace}</Text>
        </Pressable>
        <Pressable
          style={bf.secondary}
          onPress={() => {
            setFlowMode('full');
            setPhase('m2_about');
          }}
        >
          <Text style={bf.secondaryText}>{repeatBiometricCopy.ctaStart}</Text>
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
        <Pressable
          style={bf.secondary}
          onPress={() => {
            returnToHub();
          }}
        >
          <Text style={bf.secondaryText}>← Назад</Text>
        </Pressable>
        {isFullCycle ? (
          <Pressable style={bf.ghost} onPress={skipPosture}>
            <Text style={bf.ghostText}>{repeatBiometricCopy.skipPosture}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    );
  }

  if (phase === 'm2_action') {
    return (
      <PostureBurstCapture
        screenTitle={onboardingBiometricCopy.m2Title}
        onBack={() => setPhase('m2_about')}
        onComplete={() => {
          if (flowMode === 'single_posture') {
            returnToHub();
            return;
          }
          setPhase('voice_intro');
        }}
        onSkip={isFullCycle ? skipPosture : undefined}
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
      <Pressable style={bf.primary} onPress={() => setPhase('history')}>
        <Text style={bf.primaryText}>{repeatBiometricCopy.historyCta}</Text>
      </Pressable>
      <Pressable style={bf.secondary} onPress={returnToHub}>
        <Text style={bf.secondaryText}>{repeatBiometricCopy.doneCta}</Text>
      </Pressable>
    </ScrollView>
  );
}
