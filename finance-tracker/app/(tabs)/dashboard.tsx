import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { StyleSheet, ScrollView, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useTransactions,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  ExpenseCategory,
  IncomeCategory,
} from '@/store/transactions-context';

function fmt(n: number) {
  return n.toLocaleString('ru-RU');
}

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const { totalExpenses, totalIncome, expensesByCategory, incomeByCategory } = useTransactions();

  const balance = totalIncome - totalExpenses;
  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const barTrack = isDark ? '#2C2C2E' : '#E8E8ED';

  const expenseCatKeys = (Object.keys(EXPENSE_CATEGORIES) as ExpenseCategory[])
    .filter((k) => (expensesByCategory[k] ?? 0) > 0)
    .sort((a, b) => (expensesByCategory[b] ?? 0) - (expensesByCategory[a] ?? 0));

  const incomeCatKeys = (Object.keys(INCOME_CATEGORIES) as IncomeCategory[])
    .filter((k) => (incomeByCategory[k] ?? 0) > 0)
    .sort((a, b) => (incomeByCategory[b] ?? 0) - (incomeByCategory[a] ?? 0));

  // For the donut-style ring
  const maxTotal = Math.max(totalExpenses, totalIncome, 1);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
        <ThemedText type="title">Обзор</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Summary cards ── */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: '#00B89415' }]}>
            <ThemedText style={[styles.summaryLabel, { color: '#00B894' }]}>Доходы</ThemedText>
            <ThemedText type="title" style={[styles.summaryAmount, { color: '#00B894' }]}>
              {fmt(totalIncome)} ₽
            </ThemedText>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#E5393515' }]}>
            <ThemedText style={[styles.summaryLabel, { color: '#E53935' }]}>Расходы</ThemedText>
            <ThemedText type="title" style={[styles.summaryAmount, { color: '#E53935' }]}>
              {fmt(totalExpenses)} ₽
            </ThemedText>
          </View>
        </View>

        {/* Balance */}
        <View style={[styles.balanceCard, { backgroundColor: cardBg }, isDark ? styles.shadowDark : styles.shadowLight]}>
          <ThemedText style={[styles.balanceLabel, { color: colors.icon }]}>Баланс (доходы − расходы)</ThemedText>
          <ThemedText
            type="title"
            style={[styles.balanceAmount, { color: balance >= 0 ? '#00B894' : '#E53935' }]}
          >
            {balance >= 0 ? '+' : ''}{fmt(balance)} ₽
          </ThemedText>

          {/* Proportion bar */}
          <View style={styles.proportionRow}>
            <View style={[styles.proportionSegment, { flex: totalIncome || 1, backgroundColor: '#00B894', borderTopLeftRadius: 4, borderBottomLeftRadius: 4 }]} />
            <View style={{ width: 2 }} />
            <View style={[styles.proportionSegment, { flex: totalExpenses || 1, backgroundColor: '#E53935', borderTopRightRadius: 4, borderBottomRightRadius: 4 }]} />
          </View>
          <View style={styles.proportionLabels}>
            <ThemedText style={[styles.proportionPct, { color: '#00B894' }]}>
              {totalIncome + totalExpenses > 0 ? ((totalIncome / (totalIncome + totalExpenses)) * 100).toFixed(0) : 0}% доходы
            </ThemedText>
            <ThemedText style={[styles.proportionPct, { color: '#E53935' }]}>
              {totalIncome + totalExpenses > 0 ? ((totalExpenses / (totalIncome + totalExpenses)) * 100).toFixed(0) : 0}% расходы
            </ThemedText>
          </View>
        </View>

        {/* ── Expenses breakdown ── */}
        <View style={[styles.section, { backgroundColor: cardBg }, isDark ? styles.shadowDark : styles.shadowLight]}>
          <View style={styles.sectionHeader}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Куда уходят деньги</ThemedText>
            <ThemedText style={[styles.sectionTotal, { color: '#E53935' }]}>{fmt(totalExpenses)} ₽</ThemedText>
          </View>

          {expenseCatKeys.length === 0 ? (
            <ThemedText style={[styles.emptyHint, { color: colors.icon }]}>Нет данных о расходах</ThemedText>
          ) : (
            expenseCatKeys.map((key, i) => {
              const cat = EXPENSE_CATEGORIES[key];
              const amount = expensesByCategory[key] ?? 0;
              const pct = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
              return (
                <View key={key} style={[styles.breakdownRow, i < expenseCatKeys.length - 1 && styles.breakdownBorder, { borderBottomColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
                  <View style={styles.breakdownLeft}>
                    <View style={[styles.breakdownDot, { backgroundColor: cat.color }]} />
                    <ThemedText style={styles.breakdownEmoji}>{cat.emoji}</ThemedText>
                    <ThemedText style={styles.breakdownName}>{cat.label}</ThemedText>
                  </View>
                  <View style={styles.breakdownRight}>
                    <View style={styles.breakdownBarWrap}>
                      <View style={[styles.breakdownBarTrack, { backgroundColor: barTrack }]}>
                        <View style={[styles.breakdownBarFill, { width: `${pct}%`, backgroundColor: cat.color }]} />
                      </View>
                    </View>
                    <ThemedText style={[styles.breakdownPct, { color: colors.icon }]}>{pct.toFixed(1)}%</ThemedText>
                    <ThemedText type="defaultSemiBold" style={styles.breakdownAmount}>{fmt(amount)} ₽</ThemedText>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* ── Income breakdown ── */}
        <View style={[styles.section, { backgroundColor: cardBg }, isDark ? styles.shadowDark : styles.shadowLight]}>
          <View style={styles.sectionHeader}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Откуда доходы</ThemedText>
            <ThemedText style={[styles.sectionTotal, { color: '#00B894' }]}>{fmt(totalIncome)} ₽</ThemedText>
          </View>

          {incomeCatKeys.length === 0 ? (
            <ThemedText style={[styles.emptyHint, { color: colors.icon }]}>Нет данных о доходах</ThemedText>
          ) : (
            incomeCatKeys.map((key, i) => {
              const cat = INCOME_CATEGORIES[key];
              const amount = incomeByCategory[key] ?? 0;
              const pct = totalIncome > 0 ? (amount / totalIncome) * 100 : 0;
              return (
                <View key={key} style={[styles.breakdownRow, i < incomeCatKeys.length - 1 && styles.breakdownBorder, { borderBottomColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
                  <View style={styles.breakdownLeft}>
                    <View style={[styles.breakdownDot, { backgroundColor: cat.color }]} />
                    <ThemedText style={styles.breakdownEmoji}>{cat.emoji}</ThemedText>
                    <ThemedText style={styles.breakdownName}>{cat.label}</ThemedText>
                  </View>
                  <View style={styles.breakdownRight}>
                    <View style={styles.breakdownBarWrap}>
                      <View style={[styles.breakdownBarTrack, { backgroundColor: barTrack }]}>
                        <View style={[styles.breakdownBarFill, { width: `${pct}%`, backgroundColor: cat.color }]} />
                      </View>
                    </View>
                    <ThemedText style={[styles.breakdownPct, { color: colors.icon }]}>{pct.toFixed(1)}%</ThemedText>
                    <ThemedText type="defaultSemiBold" style={styles.breakdownAmount}>{fmt(amount)} ₽</ThemedText>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* ── Top 3 expenses ── */}
        {expenseCatKeys.length > 0 && (
          <View style={[styles.section, { backgroundColor: cardBg }, isDark ? styles.shadowDark : styles.shadowLight]}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Топ-3 категории расходов</ThemedText>
            {expenseCatKeys.slice(0, 3).map((key, i) => {
              const cat = EXPENSE_CATEGORIES[key];
              const amount = expensesByCategory[key] ?? 0;
              const pct = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
              return (
                <View key={key} style={styles.topRow}>
                  <View style={[styles.topRank, { backgroundColor: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : '#CD7F32' }]}>
                    <ThemedText style={styles.topRankText}>{i + 1}</ThemedText>
                  </View>
                  <ThemedText style={styles.topEmoji}>{cat.emoji}</ThemedText>
                  <View style={styles.topInfo}>
                    <ThemedText type="defaultSemiBold">{cat.label}</ThemedText>
                    <ThemedText style={{ color: colors.icon, fontSize: 13 }}>{pct.toFixed(1)}% от всех расходов</ThemedText>
                  </View>
                  <ThemedText type="defaultSemiBold" style={{ color: '#E53935' }}>{fmt(amount)} ₽</ThemedText>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  scrollContent: { padding: 16, paddingBottom: 40 },

  // Summary
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  summaryCard: { flex: 1, borderRadius: 14, padding: 16, alignItems: 'center' },
  summaryLabel: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  summaryAmount: { fontSize: 20 },

  // Balance
  balanceCard: { borderRadius: 14, padding: 20, marginBottom: 16 },
  shadowLight: { shadowColor: '#8E8E93', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  shadowDark: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 2 },
  balanceLabel: { fontSize: 14, marginBottom: 8 },
  balanceAmount: { fontSize: 28, marginBottom: 16 },
  proportionRow: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden' },
  proportionSegment: { height: 8 },
  proportionLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  proportionPct: { fontSize: 13, fontWeight: '600' },

  // Section
  section: { borderRadius: 14, padding: 16, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 16 },
  sectionTotal: { fontSize: 15, fontWeight: '700' },
  emptyHint: { textAlign: 'center', paddingVertical: 20, fontSize: 14 },

  // Breakdown row
  breakdownRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  breakdownBorder: { borderBottomWidth: StyleSheet.hairlineWidth },
  breakdownLeft: { flexDirection: 'row', alignItems: 'center', width: 120 },
  breakdownDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  breakdownEmoji: { fontSize: 18, marginRight: 6 },
  breakdownName: { fontSize: 14 },
  breakdownRight: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  breakdownBarWrap: { flex: 1 },
  breakdownBarTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  breakdownBarFill: { height: 6, borderRadius: 3 },
  breakdownPct: { fontSize: 12, width: 42, textAlign: 'right' },
  breakdownAmount: { fontSize: 13, minWidth: 70, textAlign: 'right' },

  // Top rows
  topRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  topRank: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  topRankText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  topEmoji: { fontSize: 24, marginRight: 10 },
  topInfo: { flex: 1 },
});
