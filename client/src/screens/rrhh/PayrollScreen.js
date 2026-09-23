import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Screen, Card, AppButton, AppInput, EmptyState, ErrorBanner } from '../../components/ui';
import { payrollService } from '../../services/resources';
import { usePermission } from '../../hooks/usePermission';
import { apiErrorMessage } from '../../services/api';
import { formatMoney, decimalToNumber } from '../../utils/money';

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function PayrollScreen({ navigation }) {
  const isSuperAdmin = usePermission('*');
  const hasWrite = usePermission('payroll:write');
  const canWrite = isSuperAdmin || hasWrite;

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [period, setPeriod] = useState(currentPeriod());
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await payrollService.list({ limit: 100 });
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

  const run = async () => {
    setRunning(true);
    setError('');
    setResult('');
    try {
      const res = await payrollService.run({ period });
      setResult(
        `Periodo ${res.period}: ${res.created} nómina(s) generada(s), ${res.skipped} ya existente(s)`
      );
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setRunning(false);
    }
  };

  // Aggregated totals per period
  const totals = entries.reduce((acc, e) => {
    const key = e.period;
    if (!acc[key]) acc[key] = { gross: 0, deductions: 0, net: 0 };
    acc[key].gross += decimalToNumber(e.grossPay);
    acc[key].deductions += decimalToNumber(e.deductions);
    acc[key].net += decimalToNumber(e.netPay);
    return acc;
  }, {});

  return (
    <Screen
      title="Nómina"
      subtitle="POST /payroll/run: gross − deducciones = neto (transaccional, idempotente)"
      onBack={() => navigation.goBack()}
      headerRight={
        canWrite ? <AppButton title="Correr nómina" onPress={() => setModalOpen(true)} /> : null
      }
    >
      <ErrorBanner message={error} />
      <FlatList
        data={entries}
        keyExtractor={(e) => e.id || e._id}
        refreshing={loading}
        onRefresh={load}
        ListEmptyComponent={!loading ? <EmptyState text="No hay registros de nómina" /> : null}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.row}>
              <Text style={styles.name}>{item.employeeId?.name || 'Empleado'}</Text>
              <Text style={styles.net}>{formatMoney(item.netPay)}</Text>
            </View>
            <Text style={styles.meta}>
              {item.period} · {item.employeeId?.position || ''} · bruto {formatMoney(item.grossPay)} −
              deducciones {formatMoney(item.deductions)}
            </Text>
          </Card>
        )}
        ListFooterComponent={
          Object.keys(totals).length > 0 ? (
            <View style={styles.totalsBox}>
              <Text style={styles.totalsTitle}>Totales por periodo</Text>
              {Object.entries(totals)
                .sort((a, b) => b[0].localeCompare(a[0]))
                .map(([p, t]) => (
                  <View key={p} style={styles.totalRow}>
                    <Text style={styles.period}>{p}</Text>
                    <Text style={styles.totalText}>
                      Σ Bruto {formatMoney(t.gross)} · Deduc {formatMoney(t.deductions)} · Neto{' '}
                      {formatMoney(t.net)}
                    </Text>
                  </View>
                ))}
            </View>
          ) : null
        }
      />

      <Modal visible={modalOpen} animationType="fade" transparent>
        <View style={styles.backdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Correr nómina del periodo</Text>
            <ErrorBanner message={error} />
            {result ? <Text style={styles.result}>{result}</Text> : null}
            <AppInput label="Periodo (YYYY-MM)" value={period} onChangeText={setPeriod} />
            <Text style={styles.hint}>
              Procesa a todos los empleados activos. Los que ya tienen nómina en el periodo se
              omiten (idempotente).
            </Text>
            <View style={styles.actions}>
              <AppButton title="Cancelar" variant="ghost" onPress={() => setModalOpen(false)} />
              <AppButton title="Procesar" onPress={run} loading={running} />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: '#0f172a', flex: 1 },
  net: { fontSize: 15, fontWeight: '800', color: '#16a34a' },
  meta: { fontSize: 12, color: '#64748b', marginTop: 4 },
  totalsBox: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    marginBottom: 16,
  },
  totalsTitle: { fontSize: 13, fontWeight: '800', color: '#334155', marginBottom: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  period: { fontSize: 13, fontWeight: '700', color: '#1d4ed8' },
  totalText: { fontSize: 12, color: '#334155' },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 10 },
  hint: { fontSize: 12, color: '#64748b', marginTop: 4, marginBottom: 8 },
  result: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
    backgroundColor: '#dcfce7',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  actions: { flexDirection: 'row', gap: 12, marginTop: 6 },
});
