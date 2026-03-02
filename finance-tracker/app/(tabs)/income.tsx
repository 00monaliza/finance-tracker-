import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  View,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import {
  useTransactions,
  INCOME_CATEGORIES,
  IncomeCategory,
  Transaction,
} from '@/store/transactions-context';

function fmt(n: number) {
  return n.toLocaleString('ru-RU');
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

const categoryKeys = Object.keys(INCOME_CATEGORIES) as IncomeCategory[];

export default function IncomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const { income, totalIncome, incomeByCategory, addTransaction, updateTransaction, deleteTransaction } =
    useTransactions();

  const [showForm, setShowForm] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [formCategory, setFormCategory] = useState<IncomeCategory>('salary');
  const [formAmount, setFormAmount] = useState('');
  const [formDesc, setFormDesc] = useState('');

  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const inputBg = isDark ? '#2C2C2E' : '#F2F2F7';
  const inputBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';

  const openAdd = () => {
    setEditingTx(null);
    setFormCategory('salary');
    setFormAmount('');
    setFormDesc('');
    setShowForm(true);
  };

  const openEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setFormCategory(tx.category as IncomeCategory);
    setFormAmount(String(tx.amount));
    setFormDesc(tx.description);
    setShowForm(true);
  };

  const handleSave = () => {
    const amount = parseFloat(formAmount) || 0;
    if (amount <= 0) return;
    if (editingTx) {
      updateTransaction({ ...editingTx, category: formCategory, amount, description: formDesc.trim() });
    } else {
      addTransaction({
        type: 'income',
        category: formCategory,
        amount,
        currency: '₽',
        description: formDesc.trim() || INCOME_CATEGORIES[formCategory].label,
        date: new Date().toISOString(),
      });
    }
    setShowForm(false);
  };

  const handleDelete = (tx: Transaction) => {
    Alert.alert('Удалить доход', `Удалить «${tx.description}»?`, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => deleteTransaction(tx.id) },
    ]);
  };

  const sortedCategories = categoryKeys
    .filter((k) => (incomeByCategory[k] ?? 0) > 0)
    .sort((a, b) => (incomeByCategory[b] ?? 0) - (incomeByCategory[a] ?? 0));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
        <View>
          <ThemedText type="title">Доходы</ThemedText>
          <ThemedText style={[styles.totalLabel, { color: colors.icon }]}>
            Всего: {fmt(totalIncome)} ₽
          </ThemedText>
        </View>
        <Pressable style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.7 }]} onPress={openAdd}>
          <IconSymbol name="plus.circle.fill" size={28} color={colors.tint} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Category summary */}
        {sortedCategories.length > 0 && (
          <View style={[styles.section, { backgroundColor: cardBg }, isDark ? styles.shadowDark : styles.shadowLight]}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>По категориям</ThemedText>
            {sortedCategories.map((key) => {
              const cat = INCOME_CATEGORIES[key];
              const amount = incomeByCategory[key] ?? 0;
              const pct = totalIncome > 0 ? (amount / totalIncome) * 100 : 0;
              return (
                <View key={key} style={styles.catRow}>
                  <ThemedText style={styles.catEmoji}>{cat.emoji}</ThemedText>
                  <View style={styles.catInfo}>
                    <View style={styles.catNameRow}>
                      <ThemedText type="defaultSemiBold" style={styles.catName}>{cat.label}</ThemedText>
                      <ThemedText type="defaultSemiBold">{fmt(amount)} ₽</ThemedText>
                    </View>
                    <View style={[styles.barBg, { backgroundColor: isDark ? '#2C2C2E' : '#E8E8ED' }]}>
                      <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: cat.color }]} />
                    </View>
                    <ThemedText style={[styles.catPct, { color: colors.icon }]}>{pct.toFixed(1)}%</ThemedText>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Transaction list */}
        <ThemedText type="defaultSemiBold" style={styles.listTitle}>Последние доходы</ThemedText>
        {income.length === 0 ? (
          <ThemedText style={[styles.emptyText, { color: colors.icon }]}>Нет доходов</ThemedText>
        ) : (
          income
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((tx) => {
              const cat = INCOME_CATEGORIES[tx.category as IncomeCategory];
              return (
                <Pressable
                  key={tx.id}
                  style={({ pressed }) => [
                    styles.txCard,
                    { backgroundColor: cardBg },
                    isDark ? styles.shadowDark : styles.shadowLight,
                    pressed && { opacity: 0.92 },
                  ]}
                  onPress={() => openEdit(tx)}
                  onLongPress={() => handleDelete(tx)}
                  delayLongPress={400}
                >
                  <ThemedText style={styles.txEmoji}>{cat?.emoji ?? '💵'}</ThemedText>
                  <View style={styles.txInfo}>
                    <ThemedText type="defaultSemiBold">{tx.description}</ThemedText>
                    <ThemedText style={[styles.txMeta, { color: colors.icon }]}>
                      {cat?.label ?? tx.category} · {fmtDate(tx.date)}
                    </ThemedText>
                  </View>
                  <ThemedText type="defaultSemiBold" style={{ color: '#00B894' }}>
                    +{fmt(tx.amount)} ₽
                  </ThemedText>
                </Pressable>
              );
            })
        )}
      </ScrollView>

      {/* ── Add / Edit Modal ── */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modalSafe, { backgroundColor: colors.background }]}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={[styles.modalHeader, { borderBottomColor: inputBorder }]}>
              <Pressable onPress={() => setShowForm(false)}>
                <ThemedText style={{ fontSize: 16 }}>Отмена</ThemedText>
              </Pressable>
              <ThemedText type="defaultSemiBold" style={{ fontSize: 17 }}>
                {editingTx ? 'Редактировать' : 'Новый доход'}
              </ThemedText>
              <Pressable onPress={handleSave}>
                <ThemedText type="defaultSemiBold" style={{ fontSize: 16, color: '#0a7ea4' }}>
                  {editingTx ? 'Сохранить' : 'Добавить'}
                </ThemedText>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
              <ThemedText style={[styles.modalLabel, { color: colors.icon }]}>СУММА</ThemedText>
              <TextInput
                style={[styles.modalInput, styles.amountInput, { backgroundColor: inputBg, borderColor: inputBorder, color: colors.text }]}
                placeholder="0"
                placeholderTextColor={colors.icon + '80'}
                value={formAmount}
                onChangeText={setFormAmount}
                keyboardType="decimal-pad"
                autoFocus
              />

              <ThemedText style={[styles.modalLabel, { color: colors.icon }]}>ОПИСАНИЕ</ThemedText>
              <TextInput
                style={[styles.modalInput, { backgroundColor: inputBg, borderColor: inputBorder, color: colors.text }]}
                placeholder="Откуда доход?"
                placeholderTextColor={colors.icon + '80'}
                value={formDesc}
                onChangeText={setFormDesc}
              />

              <ThemedText style={[styles.modalLabel, { color: colors.icon }]}>КАТЕГОРИЯ</ThemedText>
              <View style={styles.catGrid}>
                {categoryKeys.map((key) => {
                  const cat = INCOME_CATEGORIES[key];
                  const selected = formCategory === key;
                  return (
                    <Pressable
                      key={key}
                      style={[
                        styles.catChip,
                        { backgroundColor: selected ? cat.color + '20' : inputBg, borderColor: selected ? cat.color : 'transparent' },
                      ]}
                      onPress={() => setFormCategory(key)}
                    >
                      <ThemedText style={styles.catChipEmoji}>{cat.emoji}</ThemedText>
                      <ThemedText style={[styles.catChipText, selected && { fontWeight: '700', color: cat.color }]}>
                        {cat.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              {editingTx && (
                <Pressable
                  style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => { setShowForm(false); handleDelete(editingTx); }}
                >
                  <IconSymbol name="trash.fill" size={18} color="#E53935" />
                  <ThemedText style={styles.deleteTxt}>Удалить доход</ThemedText>
                </Pressable>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  totalLabel: { fontSize: 14, marginTop: 4 },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  section: { borderRadius: 14, padding: 16, marginBottom: 20 },
  shadowLight: { shadowColor: '#8E8E93', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  shadowDark: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 2 },
  sectionTitle: { fontSize: 16, marginBottom: 16 },
  catRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  catEmoji: { fontSize: 24, marginRight: 12, marginTop: 2 },
  catInfo: { flex: 1 },
  catNameRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  catName: { fontSize: 15 },
  barBg: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  barFill: { height: 6, borderRadius: 3 },
  catPct: { fontSize: 12 },
  listTitle: { fontSize: 16, marginBottom: 12, marginTop: 4 },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 15 },
  txCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 14, marginBottom: 8 },
  txEmoji: { fontSize: 28, marginRight: 12 },
  txInfo: { flex: 1 },
  txMeta: { fontSize: 13, marginTop: 2 },
  modalSafe: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  modalContent: { padding: 20, paddingBottom: 40 },
  modalLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8, marginTop: 16 },
  modalInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  amountInput: { fontSize: 28, fontWeight: '700', paddingVertical: 16, textAlign: 'center' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5 },
  catChipEmoji: { fontSize: 18 },
  catChipText: { fontSize: 14 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, marginTop: 32, borderRadius: 14, backgroundColor: '#E5393510' },
  deleteTxt: { color: '#E53935', fontSize: 16, fontWeight: '600' },
});
