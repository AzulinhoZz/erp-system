import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CrudScreen from '../../components/CrudScreen';
import { invoicesService, salesOrdersService } from '../../services/resources';
import { formatMoney, toDecimalString } from '../../utils/money';

const STATUS_LABEL = {
  pending: 'Pendiente',
  paid: 'Pagada',
  overdue: 'Vencida',
  cancelled: 'Cancelada',
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
  { name: 'dueDate', label: 'Fecha de vencimiento (ISO: 2026-10-01)', type: 'text', required: true },
  { name: 'amount', label: 'Importe (vacío = total de la orden)', type: 'text', placeholder: '0.00' },
];

export default function InvoicesScreen({ navigation }) {
  return (
    <CrudScreen
      title="Facturas"
      subtitle="Una factura por orden · transacción con cambio de estado"
      entityName="factura"
      service={invoicesService}
      fields={fields}
      onBack={() => navigation.goBack()}
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
      renderRow={(inv) => (
        <View>
          <View style={styles.row}>
            <Text style={styles.customer}>
              {inv.salesOrderId?.customerId?.name || 'Cliente'}
            </Text>
            <Text style={styles.amount}>{formatMoney(inv.amount)}</Text>
          </View>
          <Text style={styles.meta}>
            Vence {new Date(inv.dueDate).toLocaleDateString('es-MX')}
          </Text>
          <Text style={[styles.status, inv.status === 'paid' && styles.paid]}>
            {STATUS_LABEL[inv.status] || inv.status}
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  customer: { fontSize: 16, fontWeight: '700', color: '#0f172a', flex: 1 },
  amount: { fontSize: 15, fontWeight: '800', color: '#1d4ed8' },
  meta: { fontSize: 13, color: '#64748b', marginTop: 4 },
  status: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '700',
    color: '#92400e',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 8,
  },
  paid: { color: '#166534', backgroundColor: '#dcfce7' },
});
