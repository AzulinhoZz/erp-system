import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Screen, Card, AppButton, AppInput, EmptyState, ErrorBanner } from '../../components/ui';
import { journalEntriesService, accountsService } from '../../services/resources';
import { usePermission } from '../../hooks/usePermission';
import { apiErrorMessage } from '../../services/api';
import { formatMoney, toDecimalString } from '../../utils/money';

export default function JournalEntriesScreen({ navigation }) {
  const isSuperAdmin = usePermission('*');
  const hasWrite = usePermission('journalEntries:write');
  const canWrite = isSuperAdmin || hasWrite;

  const [entries, setEntries] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [reference, setReference] = useState('');
  const [accountId, setAccountId] = useState('');
  const [debit, setDebit] = useState('');
  const [credit, setCredit] = useState('');
  const [lines, setLines] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await journalEntriesService.list({ limit: 50 });
      setEntries(data.items || []);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!modalOpen) return;
    let alive = true;
    (async () => {
      try {
        const data = await accountsService.list({ limit: 200 });
        if (alive) setAccounts(data.items || []);
      } catch (err) {
        if (alive) setError(apiErrorMessage(err));
      }
    })();
    return () => {
      alive = false;
    };
  }, [modalOpen]);

  const totalDebit = lines.reduce((s, l) => s + Number(l.debit), 0);
  const totalCredit = lines.reduce((s, l) => s + Number(l.credit), 0);
  const balanced = lines.length >= 2 && Math.abs(totalDebit - totalCredit) < 0.005 && totalDebit > 0;

  const openCreate = () => {
    setLines([]);
    setAccountId('');
    setDebit('');
    setCredit('');
    setReference('');
    setError('');
    setModalOpen(true);
  };

  const addLine = () => {
    if (!accountId) return setError('Selecciona una cuenta');
    const d = debit ? toDecimalString(debit) : '0.00';
    const c = credit ? toDecimalString(credit) : '0.00';
    if (Number(d) === 0 && Number(c) === 0) return setError('La línea necesita débito o crédito');
    if (Number(d) > 0 && Number(c) > 0) return setError('Una línea no puede tener débito y crédito');
    setLines((prev) => [
      ...prev,
      {
        accountId,
        debit: d,
        credit: c,
        label:
          accounts.find((a) => (a.id || a._id) === accountId)?.code +
          ' ' +
          accounts.find((a) => (a.id || a._id) === accountId)?.name,
      },
    ]);
    setAccountId('');
    setDebit('');
    setCredit('');
    setError('');
    return undefined;
  };

  const removeLine = (index) => setLines((prev) => prev.filter((_, i) => i !== index));

  const save = async () => {
    if (!balanced) return setError('La póliza debe cuadrar: Σdébitos = Σcréditos (mín. 2 líneas)');
    setSaving(true);
    setError('');
    try {
      await journalEntriesService.create({
        reference,
        lines: lines.map(({ accountId: id, debit: d, credit: c }) => ({
          accountId: id,
          debit: d,
          credit: c,
        })),
      });
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
    return undefined;
  };

  return (
    <Screen
      title="Pólizas contables"
      subtitle="Partida doble: Σ débitos = Σ créditos (validado en el servidor)"
      onBack={() => navigation.goBack()}
      headerRight={
        canWrite ? <AppButton title="+ Nueva póliza" onPress={openCreate} /> : null
      }
    >
      <ErrorBanner message={error} />
      <FlatList
        data={entries}
        keyExtractor={(e) => e.id || e._id}
        refreshing={loading}
        onRefresh={load}
        ListEmptyComponent={!loading ? <EmptyState text="No hay pólizas registradas" /> : null}
        renderItem={({ item }) => {
          const total = (item.lines || []).reduce((s, l) => s + Number(l.debit?.$numberDecimal ?? l.debit ?? 0), 0);
          return (
            <Card>
              <View style={styles.headerRow}>
                <Text style={styles.date}>{new Date(item.date).toLocaleDateString('es-MX')}</Text>
                <Text style={styles.amount}>{formatMoney(total)}</Text>
              </View>
              {item.reference ? <Text style={styles.ref}>Ref: {item.reference}</Text> : null}
              {(item.lines || []).map((line, i) => (
                <View key={i} style={styles.line}>
                  <Text style={styles.lineAccount}>
                    {line.accountId?.code} · {line.accountId?.name}
                  </Text>
                  <Text style={styles.lineAmounts}>
                    {Number(line.debit?.$numberDecimal ?? line.debit ?? 0) > 0
                      ? `D: ${formatMoney(line.debit)}`
                      : `C: ${formatMoney(line.credit)}`}
                  </Text>
                </View>
              ))}
            </Card>
          );
        }}
      />

      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.backdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nueva póliza</Text>
            <ErrorBanner message={error} />
            <ScrollView>
              <AppInput
                label="Referencia (ej. INV-XXXX / manual)"
                value={reference}
                onChangeText={setReference}
              />

              <Text style={styles.label}>Cuenta</Text>
              <View style={styles.chips}>
                {accounts.map((a) => {
                  const id = a.id || a._id;
                  const on = accountId === id;
                  return (
                    <TouchableOpacity
                      key={id}
                      style={[styles.chip, on && styles.chipOn]}
                      onPress={() => setAccountId(id)}
                    >
                      <Text style={[styles.chipText, on && styles.chipTextOn]}>
                        {a.code} {a.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.amountRow}>
                <View style={{ flex: 1 }}>
                  <AppInput label="Débito" value={debit} onChangeText={setDebit} placeholder="0.00" />
                </View>
                <View style={{ flex: 1 }}>
                  <AppInput label="Crédito" value={credit} onChangeText={setCredit} placeholder="0.00" />
                </View>
                <AppButton title="＋" onPress={addLine} />
              </View>

              {lines.map((line, index) => (
                <View key={index} style={styles.lineRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.lineLabel}>{line.label}</Text>
                    <Text style={styles.lineAmounts}>
                      {Number(line.debit) > 0
                        ? `D: ${formatMoney(line.debit)}`
                        : `C: ${formatMoney(line.credit)}`}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => removeLine(index)}>
                    <Text style={styles.remove}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <View style={styles.totals}>
                <Text style={styles.totalText}>Σ D: {formatMoney(totalDebit)}</Text>
                <Text style={styles.totalText}>Σ C: {formatMoney(totalCredit)}</Text>
                <Text style={[styles.balanced, balanced ? styles.ok : styles.bad]}>
                  {balanced ? '✓ Cuadra' : '✗ No cuadra'}
                </Text>
              </View>
            </ScrollView>
            <View style={styles.actions}>
              <AppButton title="Cancelar" variant="ghost" onPress={() => setModalOpen(false)} />
              <AppButton
                title="Registrar"
                onPress={save}
                loading={saving}
                disabled={!balanced}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  date: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  amount: { fontSize: 14, fontWeight: '800', color: '#1d4ed8' },
  ref: { fontSize: 12, color: '#64748b', marginTop: 2 },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  lineAccount: { fontSize: 13, color: '#334155', flex: 1 },
  lineAmounts: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 10 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  chipOn: { backgroundColor: '#1d4ed8', borderColor: '#1d4ed8' },
  chipText: { color: '#334155', fontSize: 12 },
  chipTextOn: { color: '#fff', fontWeight: '600' },
  amountRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  lineLabel: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  remove: { fontSize: 16, color: '#dc2626', paddingHorizontal: 8 },
  totals: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#e2e8f0',
  },
  totalText: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  balanced: { fontSize: 13, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, overflow: 'hidden' },
  ok: { color: '#166534', backgroundColor: '#dcfce7' },
  bad: { color: '#991b1b', backgroundColor: '#fee2e2' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
});
