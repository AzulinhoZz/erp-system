import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CrudScreen from '../../components/CrudScreen';
import { invoicesService, salesOrdersService } from '../../services/resources';
import { formatMoney, toDecimalString } from '../../utils/money';
import { Badge } from '../../components/ui/Badge';
import { colors, typography, spacing } from '../../theme';

const STATUS_CONFIG = {
  pending: { label: 'Pendiente', variant: 'warning' },
  paid: { label: 'Pagada ✓', variant: 'success' },
  overdue: { label: 'Vencida', variant: 'danger' },
  cancelled: { label: 'Cancelada', variant: 'neutral' },
};

const fields = [
  {
    name: 'salesOrderId',
    label: 'Orden de venta confirmada',
    type: 'select',
    options: async () => {
      const data = await salesOrdersService.list({ status: 'confirmed', limit: 100 });
      return (data.items || []).map((so) => ({
        label: `${so.customerId?.name || 'Cliente'} · ${formatMoney(so.total)}`,
        value: so.id || so._id,
      }));
    },
  },
  { name: 'dueDate', label: 'Fecha de vencimiento (ISO: YYYY-MM-DD)', type: 'text', required: true },
  { name: 'amount', label: 'Importe ($) (vacío = total de la orden)', type: 'text', placeholder: '0.00' },
];

const columns = [
  {
    key: 'status',
    title: 'Estado',
    sortable: true,
    render: (inv) => {
      const conf = STATUS_CONFIG[inv.status] || { label: inv.status, variant: 'neutral' };
      return <Badge label={conf.label} variant={conf.variant} dot />;
    },
  },
  {
    key: 'salesOrderId',
    title: 'Cliente',
    render: (inv) => (
      <Text style={styles.customerText}>
        {inv.salesOrderId?.customerId?.name || 'Cliente'}
      </Text>
    ),
  },
  {
    key: 'dueDate',
    title: 'Vencimiento',
    sortable: true,
    render: (inv) => (
      <Text style={styles.dateText}>
        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('es-MX') : '—'}
      </Text>
    ),
  },
  {
    key: 'amount',
    title: 'Importe Total',
    sortable: true,
    align: 'right',
    render: (inv) => (
      <Text style={styles.amountText}>{formatMoney(inv.amount)}</Text>
    ),
  },
];

export default function InvoicesScreen({ navigation }) {
  return (
    <CrudScreen
      title="Facturas"
      subtitle="Facturación de órdenes confirmadas con póliza contable automática"
      entityName="factura"
      service={invoicesService}
      fields={fields}
      columns={columns}
      onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      readPermission="invoices:read"
      writePermission="invoices:write"
      createLabel="+ Facturar"
      mapFromForm={(form) => ({
        salesOrderId: form.salesOrderId,
        dueDate: form.dueDate,
        ...(form.amount ? { amount: toDecimalString(form.amount) } : {}),
      })}
      rowActions={(invoice) => [
        {
          label: 'Marcar pagada',
          variant: 'primary',
          visible: ['pending', 'overdue'].includes(invoice.status),
          run: (item) => invoicesService.updateStatus(item.id || item._id, 'paid'),
        },
        {
          label: 'Cancelar',
          variant: 'danger',
          visible: ['pending', 'overdue'].includes(invoice.status),
          run: (item) => invoicesService.updateStatus(item.id || item._id, 'cancelled'),
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  customerText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  dateText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  amountText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.extrabold,
    color: colors.primary,
  },
});
