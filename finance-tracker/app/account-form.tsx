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
  Alert,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useAccounts } from '@/store/accounts-context';

const CURRENCIES = ['₽', '$', '€', '£', '¥'];

const BANKS = [
  'Сбербанк',
  'Тинькофф',
  'ВТБ',
  'Альфа-Банк',
  'Газпромбанк',
  'Райффайзен',
  'Открытие',
  'Другой',
];

export default function AccountFormScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const { accountId } = useLocalSearchParams<{ accountId?: string }>();
  const { addAccount, updateAccount, deleteAccount, getAccount } = useAccounts();

  const isEditing = !!accountId;
  const existingAccount = accountId ? getAccount(accountId) : undefined;

  const [name, setName] = useState('');
  const [bankName, setBankName] = useState('');
  const [balance, setBalance] = useState('');
  const [currency, setCurrency] = useState('₽');
  const [lastFour, setLastFour] = useState('');
  const [showBankPicker, setShowBankPicker] = useState(false);

  useEffect(() => {
    if (existingAccount) {
      setName(existingAccount.name);
      setBankName(existingAccount.bankName);
      setBalance(String(existingAccount.balance));
      setCurrency(existingAccount.currency);
      setLastFour(existingAccount.lastFour ?? '');
    }
  }, [existingAccount]);

  const inputBg = isDark ? '#2C2C2E' : '#F2F2F7';
  const inputBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const accentColor = '#0a7ea4';

  const isValid = name.trim().length > 0 && bankName.trim().length > 0 && balance.trim().length > 0;

  const handleSave = () => {
    if (!isValid) return;

    const parsedBalance = parseFloat(balance.replace(/[^\d.-]/g, '')) || 0;

    if (isEditing && existingAccount) {
      updateAccount({
        id: existingAccount.id,
        name: name.trim(),
        bankName: bankName.trim(),
        balance: parsedBalance,
        currency,
        lastFour: lastFour.trim() || undefined,
      });
    } else {
      addAccount({
        name: name.trim(),
        bankName: bankName.trim(),
        balance: parsedBalance,
        currency,
        lastFour: lastFour.trim() || undefined,
      });
    }
    router.back();
  };

  const handleDelete = () => {
    if (!existingAccount) return;
    Alert.alert(
      'Удалить счёт',
      `Вы уверены, что хотите удалить «${existingAccount.name}»? Это действие нельзя отменить.`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => {
            deleteAccount(existingAccount.id);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
          <Pressable
            style={({ pressed }) => [styles.headerButton, pressed && { opacity: 0.6 }]}
            onPress={() => router.back()}
          >
            <IconSymbol name="xmark" size={16} color={colors.text} />
            <ThemedText style={styles.headerButtonText}>Отмена</ThemedText>
          </Pressable>

          <ThemedText type="defaultSemiBold" style={styles.headerTitle}>
            {isEditing ? 'Редактирование' : 'Новый счёт'}
          </ThemedText>

          <Pressable
            style={({ pressed }) => [
              styles.headerButton,
              pressed && { opacity: 0.6 },
            ]}
            onPress={handleSave}
            disabled={!isValid}
          >
            <ThemedText
              type="defaultSemiBold"
              style={[styles.headerSaveText, { color: isValid ? accentColor : colors.icon }]}
            >
              {isEditing ? 'Сохранить' : 'Добавить'}
            </ThemedText>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Account Name */}
          <View style={[styles.card, { backgroundColor: cardBg, shadowColor: isDark ? '#000' : '#8E8E93' }]}>
            <View style={styles.fieldRow}>
              <View style={[styles.fieldIcon, { backgroundColor: accentColor + '15' }]}>
                <IconSymbol name="textformat" size={18} color={accentColor} />
              </View>
              <View style={styles.fieldContent}>
                <ThemedText style={[styles.fieldLabel, { color: colors.icon }]}>Название счёта</ThemedText>
                <TextInput
                  style={[styles.fieldInput, { color: colors.text, backgroundColor: inputBg, borderColor: inputBorder }]}
                  placeholder="Например: Основной счёт"
                  placeholderTextColor={colors.icon + '80'}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="sentences"
                />
              </View>
            </View>
          </View>

          {/* Bank Name */}
          <View style={[styles.card, { backgroundColor: cardBg, shadowColor: isDark ? '#000' : '#8E8E93' }]}>
            <View style={styles.fieldRow}>
              <View style={[styles.fieldIcon, { backgroundColor: '#34C75915' }]}>
                <IconSymbol name="building.columns.fill" size={18} color="#34C759" />
              </View>
              <View style={styles.fieldContent}>
                <ThemedText style={[styles.fieldLabel, { color: colors.icon }]}>Банк</ThemedText>
                <Pressable
                  style={[styles.fieldInput, styles.selectInput, { backgroundColor: inputBg, borderColor: inputBorder }]}
                  onPress={() => setShowBankPicker(!showBankPicker)}
                >
                  <ThemedText style={bankName ? {} : { color: colors.icon + '80' }}>
                    {bankName || 'Выберите банк'}
                  </ThemedText>
                  <IconSymbol name="chevron.right" size={14} color={colors.icon} />
                </Pressable>
              </View>
            </View>

            {showBankPicker && (
              <View style={[styles.pickerList, { borderTopColor: inputBorder }]}>
                {BANKS.map((bank) => (
                  <Pressable
                    key={bank}
                    style={({ pressed }) => [
                      styles.pickerItem,
                      { backgroundColor: pressed ? (isDark ? '#3A3A3C' : '#E8E8ED') : 'transparent' },
                      bankName === bank && { backgroundColor: accentColor + '12' },
                    ]}
                    onPress={() => {
                      setBankName(bank === 'Другой' ? '' : bank);
                      setShowBankPicker(false);
                      if (bank === 'Другой') {
                        // Let user type custom bank name
                        setBankName('');
                      }
                    }}
                  >
                    <ThemedText style={bankName === bank ? { color: accentColor, fontWeight: '600' } : {}}>
                      {bank}
                    </ThemedText>
                    {bankName === bank && (
                      <IconSymbol name="checkmark" size={16} color={accentColor} />
                    )}
                  </Pressable>
                ))}
                {/* Custom input when "Другой" is selected */}
                <View style={styles.customBankRow}>
                  <TextInput
                    style={[styles.fieldInput, { flex: 1, color: colors.text, backgroundColor: inputBg, borderColor: inputBorder }]}
                    placeholder="Или введите название"
                    placeholderTextColor={colors.icon + '80'}
                    value={BANKS.includes(bankName) ? '' : bankName}
                    onChangeText={(text) => {
                      setBankName(text);
                    }}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Balance + Currency */}
          <View style={[styles.card, { backgroundColor: cardBg, shadowColor: isDark ? '#000' : '#8E8E93' }]}>
            <View style={styles.fieldRow}>
              <View style={[styles.fieldIcon, { backgroundColor: '#FF950015' }]}>
                <IconSymbol name="banknote.fill" size={18} color="#FF9500" />
              </View>
              <View style={styles.fieldContent}>
                <ThemedText style={[styles.fieldLabel, { color: colors.icon }]}>Баланс</ThemedText>
                <View style={styles.balanceRow}>
                  <TextInput
                    style={[styles.fieldInput, styles.balanceInput, { color: colors.text, backgroundColor: inputBg, borderColor: inputBorder }]}
                    placeholder="0"
                    placeholderTextColor={colors.icon + '80'}
                    value={balance}
                    onChangeText={setBalance}
                    keyboardType="decimal-pad"
                  />
                  <View style={styles.currencyRow}>
                    {CURRENCIES.map((c) => (
                      <Pressable
                        key={c}
                        style={[
                          styles.currencyButton,
                          {
                            backgroundColor: currency === c ? accentColor : inputBg,
                            borderColor: currency === c ? accentColor : inputBorder,
                          },
                        ]}
                        onPress={() => setCurrency(c)}
                      >
                        <ThemedText
                          style={[
                            styles.currencyText,
                            { color: currency === c ? '#FFFFFF' : colors.text },
                          ]}
                        >
                          {c}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Last Four Digits */}
          <View style={[styles.card, { backgroundColor: cardBg, shadowColor: isDark ? '#000' : '#8E8E93' }]}>
            <View style={styles.fieldRow}>
              <View style={[styles.fieldIcon, { backgroundColor: '#AF52DE15' }]}>
                <IconSymbol name="number" size={18} color="#AF52DE" />
              </View>
              <View style={styles.fieldContent}>
                <ThemedText style={[styles.fieldLabel, { color: colors.icon }]}>
                  Последние 4 цифры карты
                </ThemedText>
                <TextInput
                  style={[styles.fieldInput, { color: colors.text, backgroundColor: inputBg, borderColor: inputBorder }]}
                  placeholder="Необязательно"
                  placeholderTextColor={colors.icon + '80'}
                  value={lastFour}
                  onChangeText={(text) => setLastFour(text.replace(/\D/g, '').slice(0, 4))}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>
            </View>
          </View>

          {/* Delete button (only when editing) */}
          {isEditing && (
            <Pressable
              style={({ pressed }) => [
                styles.deleteButton,
                pressed && { opacity: 0.7 },
              ]}
              onPress={handleDelete}
            >
              <IconSymbol name="trash.fill" size={18} color="#E53935" />
              <ThemedText style={styles.deleteText}>Удалить счёт</ThemedText>
            </Pressable>
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 4,
    minWidth: 80,
  },
  headerButtonText: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 17,
    textAlign: 'center',
  },
  headerSaveText: {
    fontSize: 16,
    textAlign: 'right',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  fieldIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerList: {
    marginTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 2,
  },
  customBankRow: {
    flexDirection: 'row',
    paddingTop: 8,
  },
  balanceRow: {
    gap: 10,
  },
  balanceInput: {
    fontSize: 20,
    fontWeight: '600',
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  currencyButton: {
    width: 42,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyText: {
    fontSize: 17,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: '#E5393510',
  },
  deleteText: {
    color: '#E53935',
    fontSize: 16,
    fontWeight: '600',
  },
});
