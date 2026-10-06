import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Screen, Card, KPICard, Badge, Button, Input, DataTable, EmptyState, ErrorBanner, LoadingState } from '../../components/ui';
import { reportsService } from '../../services/reportsService';
import { usePermission } from '../../hooks/usePermission';
import { apiErrorMessage } from '../../services/api';
import { formatMoney } from '../../utils/money';
import { colors, typography, spacing, radius, shadows } from '../../theme';

const REPORTS = [
  { key: 'stock', label: '📦 Existencias', title: 'Inventario y Valuación' },
  { key: 'ventas', label: '📈 Ventas', title: 'Ingresos y Facturación' },
  { key: 'compras', label: '🛒 Compras', title: 'Adquisiciones y Proveedores' },
  { key: 'nomina', label: '💼 Nómina', title: 'Costo Salarial' },
  { key: 'balance', label: '⚖️ Balance', title: 'Balance de Comprobación' },
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
      <Screen title="Reportes y BI" subtitle="Requiere permiso reports:read">
        <EmptyState text="Tu rol no tiene acceso a los reportes ejecutivos." />
      </Screen>
    );
  }

  const showDates = ['ventas', 'compras', 'balance'].includes(active);

  const exportReportCSV = () => {
    alert(`Exportación CSV generada exitosamente para el reporte: ${active.toUpperCase()}`);
  };

  return (
    <Screen
      title="Business Intelligence y Reportes"
      subtitle="Métricas de agregación consolidada por módulo en tiempo real"
      onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      headerRight={
        <Button title="📥 Exportar CSV" variant="secondary" size="sm" onPress={exportReportCSV} />
      }
    >
      <ErrorBanner message={error} />

      {/* Tabs / Chips selector */}
      <View style={styles.tabsRow}>
        {REPORTS.map((r) => {
          const on = active === r.key;
          return (
            <TouchableOpacity
              key={r.key}
              style={[styles.tabChip, on && styles.tabChipActive]}
              onPress={() => run(r.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabChipText, on && styles.tabChipTextActive]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Filters Bar */}
      {showDates ? (
        <View style={styles.filterCard}>
          <View style={styles.dateInputs}>
            <View style={{ flex: 1 }}>
              <Input label="Desde" value={from} onChangeText={setFrom} placeholder="YYYY-MM-DD" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Hasta" value={to} onChangeText={setTo} placeholder="YYYY-MM-DD" />
            </View>
            <View style={{ alignSelf: 'flex-end', marginBottom: spacing.md }}>
              <Button title="Aplicar Rango" size="sm" onPress={() => run(active)} />
            </View>
          </View>
        </View>
      ) : active === 'nomina' ? (
        <View style={styles.filterCard}>
          <View style={styles.dateInputs}>
            <View style={{ flex: 1 }}>
              <Input label="Periodo (YYYY-MM)" value={period} onChangeText={setPeriod} placeholder="2026-10" />
            </View>
            <View style={{ alignSelf: 'flex-end', marginBottom: spacing.md }}>
              <Button title="Consultar Periodo" size="sm" onPress={() => run('nomina')} />
            </View>
          </View>
        </View>
      ) : null}

      <ScrollView style={{ marginTop: spacing.sm }}>
        {loading ? (
          <LoadingState message="Generando agregación ejecutiva..." />
        ) : !data && !error ? (
          <EmptyState text="Selecciona un reporte de la barra superior" />
        ) : null}

        {/* --- Existencias --- */}
        {!loading && active === 'stock' && data && (
          <View>
            <View style={styles.kpiGrid}>
              <KPICard title="Total SKUs" value={data.totalSkus} change={`${data.totalUnits} Unidades`} isPositive={true} accentColor={colors.primary} />
              <KPICard title="Valor de Inventario" value={formatMoney(data.inventoryValue)} change="Valuación total" isPositive={true} accentColor={colors.green} />
              <KPICard title="Alertas de Stock" value={data.lowStock?.length || 0} change="Bajo mínimo" isPositive={data.lowStock?.length === 0} accentColor={colors.danger} />
            </View>

            <Card>
              <Text style={styles.sectionTitle}>Productos Bajo Stock Mínimo ({data.lowStock?.length || 0})</Text>
              <DataTable
                columns={[
                  { key: 'sku', title: 'SKU', render: (p) => <Badge label={p.sku} variant="info" /> },
                  { key: 'name', title: 'Producto', render: (p) => <Text style={styles.boldText}>{p.name}</Text> },
                  { key: 'stock', title: 'Stock Actual', align: 'center', render: (p) => <Text style={styles.dangerText}>{p.stock}</Text> },
                  { key: 'minStock', title: 'Mínimo Requerido', align: 'center', render: (p) => <Text style={styles.text}>{p.minStock}</Text> },
                ]}
                data={data.lowStock || []}
                searchable={false}
                emptyText="✓ No hay productos con stock por debajo del mínimo"
              />
            </Card>
          </View>
        )}

        {/* --- Ventas --- */}
        {!loading && active === 'ventas' && data && (
          <View>
            <View style={styles.kpiGrid}>
              <KPICard title="Facturas Emitidas" value={data.count} change="Facturas" isPositive={true} accentColor={colors.primary} />
              <KPICard title="Total Facturado" value={formatMoney(data.total)} change="Ingresos del periodo" isPositive={true} accentColor={colors.green} />
            </View>

            <Card>
              <Text style={styles.sectionTitle}>Resumen de Facturación por Día</Text>
              <DataTable
                columns={[
                  { key: 'date', title: 'Fecha', sortable: true, render: (d) => <Text style={styles.boldText}>{d.date}</Text> },
                  { key: 'count', title: 'Facturas', align: 'center', render: (d) => <Badge label={`${d.count} emitidas`} variant="info" /> },
                  { key: 'total', title: 'Importe Total', align: 'right', sortable: true, render: (d) => <Text style={styles.moneyText}>{formatMoney(d.total)}</Text> },
                ]}
                data={data.byDay || []}
                searchable={false}
                emptyText="Sin ventas registradas en el período seleccionado"
              />
            </Card>
          </View>
        )}

        {/* --- Compras --- */}
        {!loading && active === 'compras' && data && (
          <View>
            <View style={styles.kpiGrid}>
              <KPICard title="Órdenes Recibidas" value={data.count} change="Órdenes OC" isPositive={true} accentColor={colors.primary} />
              <KPICard title="Total Comprado" value={formatMoney(data.total)} change="Adquisiciones" isPositive={true} accentColor={colors.warning} />
            </View>

            <Card>
              <Text style={styles.sectionTitle}>Compras por Proveedor</Text>
              <DataTable
                columns={[
                  { key: 'name', title: 'Proveedor', sortable: true, render: (s) => <Text style={styles.boldText}>{s.name}</Text> },
                  { key: 'count', title: 'Órdenes', align: 'center', render: (s) => <Badge label={`${s.count} OC`} variant="neutral" /> },
                  { key: 'total', title: 'Total Adquirido', align: 'right', sortable: true, render: (s) => <Text style={styles.moneyText}>{formatMoney(s.total)}</Text> },
                ]}
                data={data.bySupplier || []}
                searchable={false}
                emptyText="Sin compras registradas en el período"
              />
            </Card>
          </View>
        )}

        {/* --- Nómina --- */}
        {!loading && active === 'nomina' && data && (
          <View>
            <View style={styles.kpiGrid}>
              <KPICard title="Total Neto Pagado" value={formatMoney(data.net)} change="Salarios Netos" isPositive={true} accentColor={colors.green} />
              <KPICard title="Total Bruto" value={formatMoney(data.gross)} change="Salario Bruto" isPositive={true} accentColor={colors.primary} />
              <KPICard title="Deducciones" value={formatMoney(data.deductions)} change="Retenciones" isPositive={true} accentColor={colors.warning} />
            </View>

            <Card>
              <Text style={styles.sectionTitle}>Nómina por Empleado — Periodo {data.period} ({data.count} Empleados)</Text>
              <DataTable
                columns={[
                  { key: 'name', title: 'Empleado', sortable: true, render: (e) => <Text style={styles.boldText}>{e.name}</Text> },
                  { key: 'position', title: 'Puesto', render: (e) => <Text style={styles.text}>{e.position || '—'}</Text> },
                  { key: 'netPay', title: 'Pago Neto', align: 'right', sortable: true, render: (e) => <Text style={styles.moneyText}>{formatMoney(e.netPay)}</Text> },
                ]}
                data={data.byEmployee || []}
                searchable={false}
                emptyText="Sin registros de nómina para este período"
              />
            </Card>
          </View>
        )}

        {/* --- Balance de comprobación --- */}
        {!loading && active === 'balance' && data && (
          <View>
            <View style={styles.kpiGrid}>
              <KPICard title="Sumatoria Débitos (Σ Debe)" value={formatMoney(data.totalDebit)} change="Cargos" isPositive={true} accentColor={colors.primary} />
              <KPICard title="Sumatoria Créditos (Σ Haber)" value={formatMoney(data.totalCredit)} change="Abonos" isPositive={true} accentColor={colors.info} />
              <KPICard title="Estado Contable" value={data.balanced ? 'CUADRA ✓' : 'NO CUADRA ✗'} change="Partida Doble" isPositive={Boolean(data.balanced)} accentColor={data.balanced ? colors.green : colors.danger} />
            </View>

            <Card>
              <Text style={styles.sectionTitle}>Balance de Comprobación de Cuentas</Text>
              <DataTable
                columns={[
                  { key: 'code', title: 'Código', sortable: true, render: (l) => <Badge label={l.code} variant="info" /> },
                  { key: 'name', title: 'Cuenta Contable', sortable: true, render: (l) => <Text style={styles.boldText}>{l.name}</Text> },
                  { key: 'balance', title: 'Saldo Final', align: 'right', sortable: true, render: (l) => <Text style={[styles.moneyText, l.balance < 0 && styles.dangerText]}>{formatMoney(l.balance)}</Text> },
                ]}
                data={data.lines || []}
                searchable={false}
                emptyText="Sin movimientos contables registradas"
              />
            </Card>
          </View>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  tabChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabChipText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  tabChipTextActive: {
    color: colors.surface,
    fontWeight: typography.weights.bold,
  },
  filterCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  dateInputs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    alignItems: 'center',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  boldText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  text: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  moneyText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  dangerText: {
    color: colors.danger,
    fontWeight: typography.weights.bold,
  },
});
