import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Screen, Card, AppInput, EmptyState, ErrorBanner } from '../../components/ui';
import { reportsService } from '../../services/reportsService';
import { usePermission } from '../../hooks/usePermission';
import { apiErrorMessage } from '../../services/api';
import { formatMoney } from '../../utils/money';

const REPORTS = [
  { key: 'stock', label: 'Existencias' },
  { key: 'ventas', label: 'Ventas' },
  { key: 'compras', label: 'Compras' },
  { key: 'nomina', label: 'Nómina' },
  { key: 'balance', label: 'Balance' },
];

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
const currentPeriod = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export default function ReportsScreen({ navigation }) {
  const isSuperAdmin = usePermission('*');
  const hasRead = usePermission('reports:read');
  const canRead = isSuperAdmin || hasRead;

  const [active, setActive] = useState('stock');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(daysAgo(0));
  const [period, setPeriod] = useState(currentPeriod());

  const run = async (key) => {
    setActive(key);
    setLoading(true);
    setError('');
    setData(null);
    try {
      let result;
      switch (key) {
        case 'ventas':
          result = await reportsService.salesSummary({ from, to });
          break;
        case 'compras':
          result = await reportsService.purchasesSummary({ from, to });
          break;
        case 'nomina':
          result = await reportsService.payrollSummary(period);
          break;
        case 'balance':
          result = await reportsService.trialBalance({ from, to });
          break;
        default:
          result = await reportsService.inventoryStock();
      }
      setData(result);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canRead) run('stock');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRead]);

  if (!canRead) {
    return (
      <Screen title="Reportes" subtitle="Requiere permiso reports:read">
        <EmptyState text="Tu rol no tiene acceso a reportes" />
      </Screen>
    );
  }

  const showDates = ['ventas', 'compras', 'balance'].includes(active);

  return (
    <Screen
      title="Reportes"
      subtitle="Agregaciones de todos los módulos · solo lectura"
      onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
    >
      <ErrorBanner message={error} />

      <View style={styles.chips}>
        {REPORTS.map((r) => {
          const on = active === r.key;
          return (
            <TouchableOpacity
              key={r.key}
              style={[styles.chip, on && styles.chipOn]}
              onPress={() => run(r.key)}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{r.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {showDates && (
        <View style={styles.dates}>
          <View style={{ flex: 1 }}>
            <AppInput label="Desde" value={from} onChangeText={setFrom} placeholder="YYYY-MM-DD" />
          </View>
          <View style={{ flex: 1 }}>
            <AppInput label="Hasta" value={to} onChangeText={setTo} placeholder="YYYY-MM-DD" />
          </View>
        </View>
      )}
      {active === 'nomina' && (
        <AppInput label="Periodo (YYYY-MM)" value={period} onChangeText={setPeriod} />
      )}

      <ScrollView style={{ marginTop: 8 }}>
        {loading && <EmptyState text="Cargando reporte…" />}
        {!loading && !data && !error && <EmptyState text="Selecciona un reporte" />}

        {/* --- Existencias --- */}
        {!loading && active === 'stock' && data && (
          <Card>
            <Text style={styles.kpiRow}>
              <Text style={styles.kpi}>{data.totalSkus}</Text>
              <Text style={styles.kpiLabel}> SKUs · </Text>
              <Text style={styles.kpi}>{data.totalUnits}</Text>
              <Text style={styles.kpiLabel}> unidades · valor </Text>
              <Text style={styles.kpi}>{formatMoney(data.inventoryValue)}</Text>
            </Text>
            <Text style={styles.section}>Stock bajo ({data.lowStock.length})</Text>
            {data.lowStock.map((p) => (
              <View key={p.id} style={styles.line}>
                <Text style={styles.lineName}>
                  {p.sku} — {p.name}
                </Text>
                <Text style={styles.lineValueRed}>
                  {p.stock} / mín {p.minStock}
                </Text>
              </View>
            ))}
            {!data.lowStock.length && <Text style={styles.ok}>✓ Sin productos bajo el mínimo</Text>}
          </Card>
        )}

        {/* --- Ventas --- */}
        {!loading && active === 'ventas' && data && (
          <Card>
            <Text style={styles.kpiRow}>
              <Text style={styles.kpi}>{data.count}</Text>
              <Text style={styles.kpiLabel}> facturas · total </Text>
              <Text style={styles.kpi}>{formatMoney(data.total)}</Text>
            </Text>
            {data.byStatus.map((s) => (
              <View key={s.status} style={styles.line}>
                <Text style={styles.lineName}>{s.status}</Text>
                <Text style={styles.lineValue}>
                  {s.count} · {formatMoney(s.total)}
                </Text>
              </View>
            ))}
            <Text style={styles.section}>Por día</Text>
            {data.byDay.map((d) => (
              <View key={d.date} style={styles.line}>
                <Text style={styles.lineName}>{d.date}</Text>
                <Text style={styles.lineValue}>
                  {d.count} · {formatMoney(d.total)}
                </Text>
              </View>
            ))}
          </Card>
        )}

        {/* --- Compras --- */}
        {!loading && active === 'compras' && data && (
          <Card>
            <Text style={styles.kpiRow}>
              <Text style={styles.kpi}>{data.count}</Text>
              <Text style={styles.kpiLabel}> OC recibidas · total </Text>
              <Text style={styles.kpi}>{formatMoney(data.total)}</Text>
            </Text>
            {data.bySupplier.map((s) => (
              <View key={s.supplierId} style={styles.line}>
                <Text style={styles.lineName}>{s.name}</Text>
                <Text style={styles.lineValue}>
                  {s.count} · {formatMoney(s.total)}
                </Text>
              </View>
            ))}
          </Card>
        )}

        {/* --- Nómina --- */}
        {!loading && active === 'nomina' && data && (
          <Card>
            <Text style={styles.kpiRow}>
              <Text style={styles.kpi}>{formatMoney(data.net)}</Text>
              <Text style={styles.kpiLabel}> neto · bruto </Text>
              <Text style={styles.kpi}>{formatMoney(data.gross)}</Text>
              <Text style={styles.kpiLabel}> · deducciones </Text>
              <Text style={styles.kpi}>{formatMoney(data.deductions)}</Text>
            </Text>
            <Text style={styles.section}>{data.period} · {data.count} empleado(s)</Text>
            {data.byEmployee.map((e, i) => (
              <View key={i} style={styles.line}>
                <Text style={styles.lineName}>
                  {e.name} {e.position ? `· ${e.position}` : ''}
                </Text>
                <Text style={styles.lineValue}>{formatMoney(e.netPay)}</Text>
              </View>
            ))}
          </Card>
        )}

        {/* --- Balance de comprobación --- */}
        {!loading && active === 'balance' && data && (
          <Card>
            <Text style={styles.kpiRow}>
              <Text style={styles.kpiLabel}>Σ Debe </Text>
              <Text style={styles.kpi}>{formatMoney(data.totalDebit)}</Text>
              <Text style={styles.kpiLabel}> · Σ Haber </Text>
              <Text style={styles.kpi}>{formatMoney(data.totalCredit)}</Text>
            </Text>
            <Text style={[styles.ok, !data.balanced && styles.bad]}>
              {data.balanced ? '✓ La contabilidad cuadra' : '✗ No cuadra'}
            </Text>
            {data.lines.map((l) => (
              <View key={l.accountId} style={styles.line}>
                <Text style={styles.lineName}>
                  {l.code} · {l.name}
                </Text>
                <Text style={[styles.lineValue, l.balance < 0 && styles.lineValueRed]}>
                  {formatMoney(l.balance)}
                </Text>
              </View>
            ))}
          </Card>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipOn: { backgroundColor: '#1d4ed8', borderColor: '#1d4ed8' },
  chipText: { color: '#334155', fontSize: 13, fontWeight: '600' },
  chipTextOn: { color: '#fff' },
  dates: { flexDirection: 'row', gap: 10 },
  kpiRow: { marginBottom: 8 },
  kpi: { fontSize: 17, fontWeight: '800', color: '#1d4ed8' },
  kpiLabel: { fontSize: 13, color: '#64748b' },
  section: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 4,
  },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  lineName: { fontSize: 14, color: '#334155', flex: 1 },
  lineValue: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  lineValueRed: { fontSize: 14, fontWeight: '700', color: '#dc2626' },
  ok: { fontSize: 13, fontWeight: '700', color: '#16a34a' },
  bad: { color: '#dc2626' },
});
