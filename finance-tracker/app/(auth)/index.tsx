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
import { useState, useRef } from 'react';
import { router } from 'expo-router';
import { authApi } from '@/lib/api';
import { storage } from '@/lib/storage';

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';

  let result = '+7';
  const body = digits.startsWith('7') ? digits.slice(1) : digits.startsWith('8') ? digits.slice(1) : digits;

  if (body.length > 0) result += ` (${body.slice(0, 3)}`;
  if (body.length >= 3) result += ')';
  if (body.length > 3) result += ` ${body.slice(3, 6)}`;
  if (body.length > 6) result += `-${body.slice(6, 8)}`;
  if (body.length > 8) result += `-${body.slice(8, 10)}`;

  return result;
}

function extractDigits(formatted: string): string {
  return formatted.replace(/\D/g, '');
}

export default function PhoneEntryScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const [phone, setPhone] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const inputBg = isDark ? '#2C2C2E' : '#F2F2F7';
  const inputBorder = isFocused
    ? colors.tint
    : isDark
      ? 'rgba(255,255,255,0.12)'
      : 'rgba(0,0,0,0.08)';
  const accentGradientStart = '#0a7ea4';

  const digits = extractDigits(phone);
  // Valid Russian phone: 11 digits starting with 7/8, or 10 digits (body only)
  const isValid = digits.length >= 11 || (digits.length === 10 && !digits.startsWith('7') && !digits.startsWith('8'));

  const handlePhoneChange = (text: string) => {
    const rawDigits = text.replace(/\D/g, '');
    setPhone(formatPhone(rawDigits));
  };

  const handleSendCode = async () => {
    if (!isValid) return;
    
    setIsLoading(true);
    try {
      // Normalize phone to strict +7XXXXXXXXXX format (no spaces/brackets)
      const digitsOnly = extractDigits(phone);
      const last10 = digitsOnly.slice(-10); // guard if введено с 8 или 7 в начале
      const normalizedPhone = `+7${last10}`;
      
      const result = await authApi.sendCode(normalizedPhone);
      if (result.error) {
        alert(`Ошибка: ${result.error}`);
        setIsLoading(false);
        return;
      }
      
      // Save phone for verification screen
      await storage.setPhone(normalizedPhone);
      
      router.push({
        pathname: '/(auth)/verify' as any,
        params: { phone: normalizedPhone },
      });
    } catch (error) {
      alert(`Ошибка отправки кода: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setIsLoading(false);
    }
  };

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
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: accentGradientStart + '15' }]}>
              <View style={[styles.iconInner, { backgroundColor: accentGradientStart + '25' }]}>
                <IconSymbol name="phone.fill" size={36} color={accentGradientStart} />
              </View>
            </View>
          </View>

          {/* Title & Subtitle */}
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              Добро пожаловать
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.icon }]}>
              Введите номер телефона для входа{'\n'}или регистрации
            </ThemedText>
          </View>

          {/* Card */}
          <View style={[styles.card, { backgroundColor: cardBg, shadowColor: isDark ? '#000' : '#8E8E93' }]}>
            <ThemedText type="defaultSemiBold" style={styles.fieldLabel}>
              Номер телефона
            </ThemedText>

            <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: inputBorder }]}>
              <View style={[styles.flagContainer, { backgroundColor: isDark ? '#3A3A3C' : '#E8E8ED' }]}>
                <ThemedText style={styles.flag}>🇷🇺</ThemedText>
              </View>
              <TextInput
                ref={inputRef}
                style={[styles.input, { color: colors.text }]}
                placeholder="+7 (999) 123-45-67"
                placeholderTextColor={colors.icon + '80'}
                value={phone}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                autoComplete="tel"
                maxLength={18}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
              {phone.length > 0 && (
                <Pressable
                  style={styles.clearButton}
                  onPress={() => setPhone('')}
                  hitSlop={8}
                >
                  <IconSymbol name="xmark.circle.fill" size={20} color={colors.icon + '80'} />
                </Pressable>
              )}
            </View>

            <View style={styles.infoRow}>
              <IconSymbol name="lock.fill" size={14} color={colors.icon + '90'} />
              <ThemedText style={[styles.infoText, { color: colors.icon }]}>
                Мы отправим SMS с кодом подтверждения
              </ThemedText>
            </View>
          </View>

          {/* Submit */}
          <Pressable
            style={({ pressed }) => [
              styles.submitButton,
              { backgroundColor: isValid && !isLoading ? accentGradientStart : isDark ? '#2C2C2E' : '#E8E8ED' },
              pressed && isValid && !isLoading && styles.submitPressed,
              (!isValid || isLoading) && styles.submitDisabled,
            ]}
            onPress={handleSendCode}
            disabled={!isValid || isLoading}
          >
            <ThemedText
              type="defaultSemiBold"
              style={[
                styles.submitText,
                { color: isValid && !isLoading ? '#FFFFFF' : colors.icon },
              ]}
            >
              {isLoading ? 'Отправка...' : 'Получить код'}
            </ThemedText>
            {!isLoading && (
              <IconSymbol
                name="arrow.right"
                size={18}
                color={isValid ? '#FFFFFF' : colors.icon}
              />
            )}
          </Pressable>

          {/* Terms */}
          <ThemedText style={[styles.terms, { color: colors.icon }]}>
            Нажимая «Получить код», вы соглашаетесь с{' '}
            <ThemedText type="link" style={styles.termsLink}>
              Условиями использования
            </ThemedText>{' '}
            и{' '}
            <ThemedText type="link" style={styles.termsLink}>
              Политикой конфиденциальности
            </ThemedText>
          </ThemedText>
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
    paddingTop: 48,
    paddingBottom: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
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
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  fieldLabel: {
    fontSize: 14,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 4,
    height: 56,
  },
  flagContainer: {
    width: 44,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    marginRight: 8,
  },
  flag: {
    fontSize: 22,
  },
  input: {
    flex: 1,
    fontSize: 17,
    letterSpacing: 0.3,
    paddingVertical: 0,
  },
  clearButton: {
    paddingHorizontal: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 17,
    borderRadius: 14,
    marginBottom: 20,
  },
  submitPressed: {
    opacity: 0.85,
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitText: {
    fontSize: 17,
  },
  terms: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  termsLink: {
    fontSize: 12,
  },
});
