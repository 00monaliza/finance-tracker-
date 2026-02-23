import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef, useEffect, useCallback } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { authApi } from '@/lib/api';
import { storage } from '@/lib/storage';

const CODE_LENGTH = 4;
const RESEND_SECONDS = 60;

export default function VerifyScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const { phone } = useLocalSearchParams<{ phone: string }>();

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  const inputs = useRef<(TextInput | null)[]>([]);

  const accentColor = '#0a7ea4';
  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const cellBg = isDark ? '#2C2C2E' : '#F2F2F7';
  const cellBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
  const cellBorderActive = accentColor;

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const formatTimer = useCallback((seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, []);

  const handleChange = (text: string, index: number) => {
    setError('');
    const digit = text.replace(/\D/g, '');

    if (digit.length === 0) {
      const newCode = [...code];
      newCode[index] = '';
      setCode(newCode);
      return;
    }

    // Handle paste of full code
    if (digit.length >= CODE_LENGTH) {
      const pastedCode = digit.slice(0, CODE_LENGTH).split('');
      setCode(pastedCode);
      inputs.current[CODE_LENGTH - 1]?.focus();
      // Auto-verify on paste
      setTimeout(() => handleVerify(pastedCode), 300);
      return;
    }

    const newCode = [...code];
    newCode[index] = digit.slice(-1);
    setCode(newCode);

    // Move to next input
    if (digit.length > 0 && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }

    // Auto-verify when all filled
    if (index === CODE_LENGTH - 1 && newCode.every((d) => d !== '')) {
      setTimeout(() => handleVerify(newCode), 300);
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && code[index] === '' && index > 0) {
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (codeArr?: string[]) => {
    const currentCode = codeArr ?? code;
    const fullCode = currentCode.join('');

    if (fullCode.length < CODE_LENGTH) return;

    setIsVerifying(true);
    setError('');

    try {
      const phoneNumber = phone || (await storage.getPhone());
      if (!phoneNumber) {
        setError('Номер телефона не найден');
        setIsVerifying(false);
        return;
      }

      const result = await authApi.verifyCode(phoneNumber, fullCode);
      if (result.error) {
        setError(result.error);
        setIsVerifying(false);
        return;
      }

      if (result.data) {
        // Save user_id for future API requests
        await storage.setUserId(result.data.user_id);
        await storage.setPhone(result.data.phone);
        
        // Navigate to main app
        router.replace('/(tabs)');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ошибка верификации');
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    
    try {
      const phoneNumber = phone || (await storage.getPhone());
      if (!phoneNumber) {
        setError('Номер телефона не найден');
        return;
      }

      const result = await authApi.sendCode(phoneNumber);
      if (result.error) {
        setError(result.error);
        return;
      }

      setTimer(RESEND_SECONDS);
      setCode(Array(CODE_LENGTH).fill(''));
      setError('');
      inputs.current[0]?.focus();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ошибка отправки кода');
    }
  };

  const filledCount = code.filter((d) => d !== '').length;
  const isComplete = filledCount === CODE_LENGTH;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <Pressable
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={20} color={accentColor} />
            <ThemedText style={{ color: accentColor, fontSize: 16 }}>Назад</ThemedText>
          </Pressable>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: accentColor + '15' }]}>
              <View style={[styles.iconInner, { backgroundColor: accentColor + '25' }]}>
                <IconSymbol name="envelope.badge.fill" size={34} color={accentColor} />
              </View>
            </View>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              Подтверждение
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.icon }]}>
              Введите {CODE_LENGTH}-значный код,{'\n'}отправленный на номер
            </ThemedText>
            {phone ? (
              <ThemedText type="defaultSemiBold" style={[styles.phoneDisplay, { color: colors.text }]}>
                {phone}
              </ThemedText>
            ) : null}
          </View>

          {/* Code Card */}
          <View style={[styles.card, { backgroundColor: cardBg, shadowColor: isDark ? '#000' : '#8E8E93' }]}>
            <ThemedText type="defaultSemiBold" style={styles.codeLabel}>
              Код из SMS
            </ThemedText>

            <View style={styles.codeRow}>
              {Array.from({ length: CODE_LENGTH }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.codeCell,
                    {
                      backgroundColor: cellBg,
                      borderColor: code[i] ? cellBorderActive : cellBorder,
                    },
                    code[i] !== '' && { borderColor: accentColor, borderWidth: 2 },
                  ]}
                >
                  <TextInput
                    ref={(ref) => { inputs.current[i] = ref; }}
                    style={[styles.codeCellInput, { color: colors.text }]}
                    value={code[i]}
                    onChangeText={(text) => handleChange(text, i)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                    keyboardType="number-pad"
                    maxLength={i === 0 ? CODE_LENGTH : 1}
                    selectTextOnFocus
                    autoFocus={i === 0}
                  />
                </View>
              ))}
            </View>

            {error ? (
              <View style={styles.errorRow}>
                <IconSymbol name="exclamationmark.circle.fill" size={16} color="#E53935" />
                <ThemedText style={styles.errorText}>{error}</ThemedText>
              </View>
            ) : null}

            {/* Timer & Resend */}
            <View style={styles.resendRow}>
              {timer > 0 ? (
                <View style={styles.timerRow}>
                  <IconSymbol name="clock.fill" size={16} color={colors.icon + '90'} />
                  <ThemedText style={[styles.timerText, { color: colors.icon }]}>
                    Повторная отправка через {formatTimer(timer)}
                  </ThemedText>
                </View>
              ) : (
                <Pressable
                  style={({ pressed }) => [styles.resendButton, pressed && { opacity: 0.7 }]}
                  onPress={handleResend}
                >
                  <IconSymbol name="arrow.clockwise" size={16} color={accentColor} />
                  <ThemedText style={[styles.resendText, { color: accentColor }]}>
                    Отправить код повторно
                  </ThemedText>
                </Pressable>
              )}
            </View>
          </View>

          {/* Verify Button */}
          <Pressable
            style={({ pressed }) => [
              styles.verifyButton,
              {
                backgroundColor: isComplete && !isVerifying
                  ? accentColor
                  : isDark ? '#2C2C2E' : '#E8E8ED',
              },
              pressed && isComplete && styles.verifyPressed,
              (!isComplete || isVerifying) && styles.verifyDisabled,
            ]}
            onPress={() => handleVerify()}
            disabled={!isComplete || isVerifying}
          >
            {isVerifying ? (
              <ThemedText type="defaultSemiBold" style={[styles.verifyText, { color: '#FFFFFF' }]}>
                Проверяем...
              </ThemedText>
            ) : (
              <>
                <ThemedText
                  type="defaultSemiBold"
                  style={[
                    styles.verifyText,
                    { color: isComplete ? '#FFFFFF' : colors.icon },
                  ]}
                >
                  Подтвердить
                </ThemedText>
                <IconSymbol
                  name="checkmark.circle.fill"
                  size={20}
                  color={isComplete ? '#FFFFFF' : colors.icon}
                />
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    marginBottom: 16,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
  },
  phoneDisplay: {
    fontSize: 18,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  codeLabel: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  codeCell: {
    width: 60,
    height: 64,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeCellInput: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
    height: '100%',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  errorText: {
    color: '#E53935',
    fontSize: 14,
  },
  resendRow: {
    alignItems: 'center',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerText: {
    fontSize: 14,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  resendText: {
    fontSize: 15,
    fontWeight: '600',
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 17,
    borderRadius: 14,
  },
  verifyPressed: {
    opacity: 0.85,
  },
  verifyDisabled: {
    opacity: 0.7,
  },
  verifyText: {
    fontSize: 17,
  },
});
