import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { colors, typography, spacing, radius, shadows } from '../../theme';
import { Screen, Card, KPICard, Badge, Button, AppInput, LoadingState, EmptyState, ErrorBanner } from '../../components/ui';
import { reportsService } from '../../services/reportsService';
import { notificationsService } from '../../services/resources';
import { formatMoney } from '../../utils/money';
import { apiErrorMessage } from '../../services/api';

const PERIOD_PRESETS = [
  { key: '7d', label: 'Últimos 7 días', days: 7 },
  { key: '30d', label: 'Últimos 30 días', days: 30 },
  { key: '90d', label: 'Último trimestre', days: 90 },
  { key: 'year', label: 'Este año', days: 365 },
];

function getDateRange(days) {
  const to = new Date().toISOString().slice(0, 10);
  const fromDate = new Date(Date.now() - days * 86400000);
  const from = fromDate.toISOString().slice(0, 10);
  return { from, to };
}

export default function DashboardScreen({ onNavigate }) {
  const { width } = useWindowDimensions();
  const isCompact = width < 900;

  const [preset, setPreset] = useState('30d');
  const [dateRange, setDateRange] = useState(getDateRange(30));

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Dashboard Aggregations State
  const [salesData, setSalesData] = useState(null);
  const [purchasesData, setPurchasesData] = useState(null);
  const [stockData, setStockData] = useState(null);
  const [financeData, setFinanceData] = useState(null);
  const [recentNotifications, setRecentNotifications] = useState([]);

  const loadDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const [salesRes, purchasesRes, stockRes, financeRes, notifRes] =
        await Promise.allSettled([
          reportsService.salesSummary(dateRange),
          reportsService.purchasesSummary(dateRange),
          reportsService.inventoryStock(),
          reportsService.trialBalance(dateRange),
          notificationsService.list({ limit: 5 }),
        ]);

      if (salesRes.status === 'fulfilled') setSalesData(salesRes.value);
      if (purchasesRes.status === 'fulfilled') setPurchasesData(purchasesRes.value);
      if (stockRes.status === 'fulfilled') setStockData(stockRes.value);
      if (financeRes.status === 'fulfilled') setFinanceData(financeRes.value);
      if (notifRes.status === 'fulfilled') {
        const items = Array.isArray(notifRes.value)
          ? notifRes.value
          : notifRes.value?.items || [];
        setRecentNotifications(items.slice(0, 5));
      }
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleSelectPreset = (p) => {
    setPreset(p.key);
    setDateRange(getDateRange(p.days));
  };

  // Calculating Bar Heights for Sales Trend Chart
  const salesByDay = salesData?.byDay || [];
  const maxDaySales = Math.max(1, ...salesByDay.map((d) => Number(d.total || 0)));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => loadDashboardData(true)} colors={[colors.primary]} />
      }
    >
      {/* Period Filter Bar */}
      <View style={styles.filterBar}>
        <View style={styles.presetsRow}>
          {PERIOD_PRESETS.map((p) => {
            const isActive = preset === p.key;
            return (
              <TouchableOpacity
                key={p.key}
                style={[styles.presetChip, isActive && styles.presetChipActive]}
                onPress={() => handleSelectPreset(p)}
                activeOpacity={0.7}
              >
                <Text style={[styles.presetChipText, isActive && styles.presetChipTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.dateInputsRow}>
          <View style={{ flex: 1, minWidth: 120 }}>
            <AppInput
              label="Desde"
              value={dateRange.from}
              onChangeText={(v) => {
                setPreset('custom');
                setDateRange((prev) => ({ ...prev, from: v }));
              }}
              placeholder="YYYY-MM-DD"
              style={{ marginBottom: 0 }}
            />
          </View>
          <View style={{ flex: 1, minWidth: 120 }}>
            <AppInput
              label="Hasta"
              value={dateRange.to}
              onChangeText={(v) => {
                setPreset('custom');
                setDateRange((prev) => ({ ...prev, to: v }));
              }}
              placeholder="YYYY-MM-DD"
              style={{ marginBottom: 0 }}
            />
          </View>
          <View style={{ alignSelf: 'flex-end' }}>
            <Button title="Filtrar" size="sm" onPress={() => loadDashboardData()} />
          </View>
        </View>
      </View>

      <ErrorBanner message={error} onRetry={() => loadDashboardData()} />

      {loading && !refreshing ? (
        <LoadingState message="Cargando resumen consolidado..." />
      ) : (
        <>
          {/* Executive KPI Cards Grid */}
          <View style={styles.kpiGrid}>
            <KPICard
              title="Ventas Totales"
              value={formatMoney(salesData?.total || 0)}
              change={`${salesData?.count || 0} facturas`}
              isPositive={true}
              period={`en periodo`}
              accentColor={colors.green}
              icon={<Text style={styles.kpiIcon}>📈</Text>}
            />
            <KPICard
              title="Compras Realizadas"
              value={formatMoney(purchasesData?.total || 0)}
              change={`${purchasesData?.count || 0} órdenes`}
              isPositive={true}
              period={`recibidas`}
              accentColor={colors.primary}
              icon={<Text style={styles.kpiIcon}>🛒</Text>}
            />
            <KPICard
              title="Valor Inventario"
              value={formatMoney(stockData?.inventoryValue || 0)}
              change={`${stockData?.totalUnits || 0} unid.`}
              isPositive={true}
              period={`${stockData?.totalSkus || 0} SKUs`}
              accentColor={colors.warning}
              icon={<Text style={styles.kpiIcon}>📦</Text>}
            />
            <KPICard
              title="Balance Contable"
              value={formatMoney(financeData?.totalDebit || 0)}
              change={financeData?.balanced ? 'Cuadra ✓' : 'No cuadra ✗'}
              isPositive={Boolean(financeData?.balanced)}
              period="partida doble"
              accentColor={colors.info}
              icon={<Text style={styles.kpiIcon}>⚖️</Text>}
            />
          </View>

          {/* Main Visual Trend & Sales Breakdown */}
          <View style={[styles.twoColumnGrid, isCompact && styles.singleColumn]}>
            {/* Sales Trend Chart */}
            <Card style={[styles.flexCard, { minHeight: 320 }]}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>Ventas por Periodo</Text>
                  <Text style={styles.cardSubtitle}>Comportamiento de ingresos diarios</Text>
                </View>
                <Badge label="En vivo" variant="success" dot />
              </View>

              {salesByDay.length === 0 ? (
                <EmptyState title="Sin ventas registradas" text="No hay ventas emitidas en este rango de fechas." />
              ) : (
                <View style={styles.chartContainer}>
                  <View style={styles.barsArea}>
                    {salesByDay.map((item, index) => {
                      const amount = Number(item.total || 0);
                      const heightPercent = Math.max(12, Math.round((amount / maxDaySales) * 100));
                      return (
                        <View key={item.date || index} style={styles.barColumn}>
                          <Text style={styles.barValueText}>{formatMoney(amount)}</Text>
                          <View style={styles.barTrack}>
                            <View style={[styles.barFill, { height: `${heightPercent}%` }]} />
                          </View>
                          <Text style={styles.barLabel}>{item.date ? item.date.slice(5) : `D${index + 1}`}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </Card>

            {/* Invoices Status & Sales Breakdown */}
            <Card style={styles.flexCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>Distribución de Facturas</Text>
                  <Text style={styles.cardSubtitle}>Desglose por estado de cobro</Text>
                </View>
                <Button title="Ver Facturas" variant="ghost" size="sm" onPress={() => onNavigate && onNavigate('Invoices')} />
              </View>

              {(!salesData?.byStatus || salesData.byStatus.length === 0) ? (
                <EmptyState text="Sin facturas emitidas" />
              ) : (
                <View style={styles.statusList}>
                  {salesData.byStatus.map((st) => {
                    const totalAll = Number(salesData.total || 1);
                    const statusTotal = Number(st.total || 0);
                    const percent = Math.round((statusTotal / (totalAll || 1)) * 100);

                    return (
                      <View key={st.status} style={styles.statusItem}>
                        <View style={styles.statusRow}>
                          <Text style={styles.statusName}>{st.status.toUpperCase()}</Text>
                          <Text style={styles.statusAmount}>{formatMoney(statusTotal)} ({st.count})</Text>
                        </View>
                        <View style={styles.progressTrack}>
                          <View
                            style={[
                              styles.progressFill,
                              { width: `${percent}%` },
                              st.status === 'paid' ? { backgroundColor: colors.green } : { backgroundColor: colors.warning },
                            ]}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </Card>
          </View>

          {/* Secondary Panels: Low Stock Alerts & Recent System Activity */}
          <View style={[styles.twoColumnGrid, isCompact && styles.singleColumn, { marginTop: spacing.md }]}>
            {/* Low Stock Inventory Panel */}
            <Card style={styles.flexCard}>
              <View style={styles.cardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.cardTitle}>Alertas de Inventario</Text>
                  {stockData?.lowStock?.length > 0 ? (
                    <Badge label={`${stockData.lowStock.length} bajo stock`} variant="danger" style={{ marginLeft: spacing.xs }} />
                  ) : null}
                </View>
                <Button title="Ir a Stock" variant="ghost" size="sm" onPress={() => onNavigate && onNavigate('Products')} />
              </View>

              {(!stockData?.lowStock || stockData.lowStock.length === 0) ? (
                <View style={styles.okBanner}>
                  <Text style={styles.okIcon}>✓</Text>
                  <Text style={styles.okText}>Todos los productos cuentan con stock óptimo.</Text>
                </View>
              ) : (
                stockData.lowStock.map((prod) => (
                  <View key={prod.id || prod._id} style={styles.alertRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.alertSku}>{prod.sku} — {prod.name}</Text>
                      <Text style={styles.alertSub}>Stock actual: {prod.stock} / Mínimo requerido: {prod.minStock}</Text>
                    </View>
                    <Button
                      title="Reabastecer"
                      variant="outline"
                      size="sm"
                      onPress={() => onNavigate && onNavigate('PurchaseOrders')}
                    />
                  </View>
                ))
              )}
            </Card>

            {/* System Notifications Feed */}
            <Card style={styles.flexCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>Actividad y Alertas</Text>
                  <Text style={styles.cardSubtitle}>Eventos recientes del ERP</Text>
                </View>
                <Button title="Ver Todo" variant="ghost" size="sm" onPress={() => onNavigate && onNavigate('Notifications')} />
              </View>

              {recentNotifications.length === 0 ? (
                <EmptyState title="Sin actividad reciente" text="No hay notificaciones ni alertas registradas." />
              ) : (
                recentNotifications.map((notif) => (
                  <View key={notif.id || notif._id} style={styles.notifRow}>
                    <Text style={styles.notifIcon}>
                      {notif.type === 'alert' ? '⚠️' : 'ℹ️'}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.notifTitle}>{notif.title}</Text>
                      <Text style={styles.notifMessage}>{notif.message}</Text>
                      <Text style={styles.notifDate}>{notif.date ? new Date(notif.date).toLocaleString('es-MX') : ''}</Text>
                    </View>
                  </View>
                ))
              )}
            </Card>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  filterBar: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  presetChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  presetChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetChipText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  presetChipTextActive: {
    color: colors.surface,
  },
  dateInputsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'center',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  kpiIcon: {
    fontSize: typography.sizes.md,
  },
  twoColumnGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  singleColumn: {
    flexDirection: 'column',
  },
  flexCard: {
    flex: 1,
    marginBottom: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  cardSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  chartContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    marginTop: spacing.md,
  },
  barsArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 180,
    paddingTop: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    marginHorizontal: 2,
  },
  barValueText: {
    fontSize: typography.sizes.xs - 2,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  barTrack: {
    width: 22,
    height: 120,
    backgroundColor: colors.surfaceSelected,
    borderRadius: radius.xs,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: colors.primary,
    borderTopLeftRadius: radius.xs,
    borderTopRightRadius: radius.xs,
  },
  barLabel: {
    fontSize: typography.sizes.xs - 1,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  statusList: {
    gap: spacing.md,
  },
  statusItem: {
    marginVertical: spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statusName: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  statusAmount: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.semibold,
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.surfaceSelected,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  okBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.greenSubtle,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.greenLight,
  },
  okIcon: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.greenDark,
    marginRight: spacing.xs,
  },
  okText: {
    fontSize: typography.sizes.sm,
    color: colors.greenDark,
    fontWeight: typography.weights.semibold,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  alertSku: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.dangerDark,
  },
  alertSub: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  notifRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  notifIcon: {
    fontSize: typography.sizes.md,
    marginRight: spacing.sm,
  },
  notifTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  notifMessage: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  notifDate: {
    fontSize: typography.sizes.xs - 2,
    color: colors.textMuted,
    marginTop: 2,
  },
});
