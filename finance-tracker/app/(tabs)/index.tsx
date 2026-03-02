import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { StyleSheet, ScrollView, Pressable, View, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAccounts, BankAccount } from '@/store/accounts-context';

function formatBalance(value: number): string {
  return value.toLocaleString('ru-RU');
}

export default function AccountsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const { accounts, deleteAccount } = useAccounts();

  const totalBalance = accounts.reduce(
    (sum, a) => sum + (a.currency === '₽' ? a.balance : 0),
    0,
  );

  const handleAdd = () => {
    router.push('/account-form' as any);
  };

  const handleEdit = (id: string) => {
    router.push({ pathname: '/account-form' as any, params: { accountId: id } });
  };

  const handleDelete = (account: BankAccount) => {
    Alert.alert(
      'Удалить счёт',
      `Удалить «${account.name}»? Это действие нельзя отменить.`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => deleteAccount(account.id),
        },
      ],
    );
  };

  const handleLongPress = (account: BankAccount) => {
    Alert.alert(account.name, `${account.bankName}${account.lastFour ? ` •••• ${account.lastFour}` : ''}`, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Редактировать', onPress: () => handleEdit(account.id) },
      { text: 'Удалить', style: 'destructive', onPress: () => handleDelete(account) },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
        <View>
          <ThemedText type="title">Счета</ThemedText>
          {accounts.length > 0 && (
            <ThemedText style={[styles.totalBalance, { color: colors.icon }]}>
              Всего: {formatBalance(totalBalance)} ₽
            </ThemedText>
          )}
        </View>
        <Pressable
          style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
          onPress={handleAdd}
        >
          <IconSymbol name="plus.circle.fill" size={28} color={colors.tint} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {accounts.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.tint + '12' }]}>
              <IconSymbol name="creditcard.fill" size={40} color={colors.tint + '50'} />
            </View>
            <ThemedText type="defaultSemiBold" style={styles.emptyTitle}>
              Нет счетов
            </ThemedText>
            <ThemedText style={[styles.emptySubtitle, { color: colors.icon }]}>
              Добавьте свой первый банковский{'\n'}счёт для учёта финансов
            </ThemedText>
            <Pressable
              style={({ pressed }) => [
                styles.emptyButton,
                { backgroundColor: colors.tint },
                pressed && { opacity: 0.85 },
              ]}
              onPress={handleAdd}
            >
              <IconSymbol name="plus.circle.fill" size={20} color="#FFFFFF" />
              <ThemedText style={styles.emptyButtonText}>Добавить счёт</ThemedText>
            </Pressable>
          </View>
        ) : (
          <>
            {accounts.map((account) => (
              <Pressable
                key={account.id}
                style={({ pressed }) => [
                  styles.card,
                  { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' },
                  isDark ? styles.cardDarkShadow : styles.cardLightShadow,
                  pressed && styles.cardPressed,
                ]}
                onPress={() => handleEdit(account.id)}
                onLongPress={() => handleLongPress(account)}
                delayLongPress={400}
              >
                <View style={styles.cardRow}>
                  <View style={[styles.iconWrap, { backgroundColor: colors.tint + '15' }]}>
                    <IconSymbol name="creditcard.fill" size={24} color={colors.tint} />
                  </View>
                  <View style={styles.cardInfo}>
                    <ThemedText type="defaultSemiBold" style={styles.accountName}>
                      {account.name}
                    </ThemedText>
                    <ThemedText style={[styles.bankName, { color: colors.icon }]}>
                      {account.bankName}
                      {account.lastFour ? ` •••• ${account.lastFour}` : ''}
                    </ThemedText>
                  </View>
                  <View style={styles.balanceWrap}>
                    <ThemedText type="defaultSemiBold" style={styles.balanceText}>
                      {formatBalance(account.balance)} {account.currency}
                    </ThemedText>
                    <IconSymbol name="chevron.right" size={14} color={colors.icon + '60'} />
                  </View>
                </View>
              </Pressable>
            ))}

            <ThemedText style={[styles.hint, { color: colors.icon }]}>
              Нажмите на счёт для редактирования.{'\n'}Удерживайте для быстрых действий.
            </ThemedText>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  totalBalance: {
    fontSize: 14,
    marginTop: 4,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonPressed: {
    opacity: 0.7,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  cardLightShadow: {
    shadowColor: '#8E8E93',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardDarkShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.92,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
  },
  bankName: {
    fontSize: 14,
    marginTop: 3,
  },
  balanceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  balanceText: {
    fontSize: 16,
  },
  hint: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
