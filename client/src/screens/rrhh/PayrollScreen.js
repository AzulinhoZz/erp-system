import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Screen, Card, Button, DataTable, Badge, Modal, Input, ErrorBanner } from '../../components/ui';
import { payrollService } from '../../services/resources';
import { usePermission } from '../../hooks/usePermission';
import { apiErrorMessage } from '../../services/api';
import { formatMoney, decimalToNumber } from '../../utils/money';
import { colors, typography, spacing, radius } from '../../theme';

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
        `Periodo ${res.period}: ${res.created} nómina(s) procesada(s), ${res.skipped} ya existente(s).`
      );
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setRunning(false);
    }
  };

  const columns = [
    {
      key: 'period',
      title: 'Periodo',
      sortable: true,
      render: (e) => <Badge label={e.period} variant="info" />,
    },
    {
      key: 'employeeId',
      title: 'Empleado',
      sortable: true,
      render: (e) => (
        <View>
          <Text style={styles.nameText}>{e.employeeId?.name || 'Empleado'}</Text>
          <Text style={styles.posText}>{e.employeeId?.position || ''}</Text>
        </View>
      ),
    },
    {
      key: 'grossPay',
      title: 'Salario Bruto',
      align: 'right',
      render: (e) => <Text style={styles.amountText}>{formatMoney(e.grossPay)}</Text>,
    },
    {
      key: 'deductions',
      title: 'Deducciones',
      align: 'right',
      render: (e) => <Text style={styles.deductText}>-{formatMoney(e.deductions)}</Text>,
    },
    {
      key: 'netPay',
      title: 'Pago Neto',
      align: 'right',
      sortable: true,
      render: (e) => <Text style={styles.netText}>{formatMoney(e.netPay)}</Text>,
    },
  ];

  return (
    <Screen
      title="Nómina"
      subtitle="Procesamiento de nómina periódico idempotente (Bruto − Deducciones = Neto)"
      onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      headerRight={
        canWrite ? (
          <Button title="Correr Nómina" onPress={() => setModalOpen(true)} size="md" />
        ) : null
      }
    >
      <ErrorBanner message={error} />

      <DataTable
        columns={columns}
        data={entries}
        loading={loading}
        searchable={true}
        searchPlaceholder="Buscar registro de nómina..."
        emptyText="No hay registros de nómina procesados"
      />

      {/* Run Payroll Modal */}
      <Modal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Procesar Nómina de Periodo"
        subtitle="Generación automática e idempotente de salarios netos por empleado"
        primaryActionLabel="Procesar Periodo"
        onPrimaryAction={run}
        primaryLoading={running}
        secondaryActionLabel="Cerrar"
        onSecondaryAction={() => setModalOpen(false)}
      >
        <ErrorBanner message={error} />
        {result ? (
          <View style={styles.resultBox}>
            <Text style={styles.resultText}>✓ {result}</Text>
          </View>
        ) : null}

        <Input
          label="Periodo AAAA-MM"
          value={period}
          onChangeText={setPeriod}
          placeholder="2026-10"
        />

        <Text style={styles.hintText}>
          ℹ️ Procesa a todos los empleados activos de la empresa. Las nóminas ya procesadas en el periodo se omiten automáticamente para evitar duplicidad.
        </Text>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  nameText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  posText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  amountText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  deductText: {
    fontSize: typography.sizes.sm,
    color: colors.danger,
  },
  netText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.extrabold,
    color: colors.greenDark,
  },
  resultBox: {
    backgroundColor: colors.greenSubtle,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.greenLight,
  },
  resultText: {
    fontSize: typography.sizes.sm,
    color: colors.greenDark,
    fontWeight: typography.weights.bold,
  },
  hintText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
