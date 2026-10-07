import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Screen, Button, DataTable, Badge, Modal, Input, Select, ErrorBanner } from '../../components/ui';
import { journalEntriesService, accountsService } from '../../services/resources';
import { usePermission } from '../../hooks/usePermission';
import { apiErrorMessage } from '../../services/api';
import { formatMoney, toDecimalString } from '../../utils/money';
import { colors, typography, spacing, radius, shadows } from '../../theme';

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
      const data = await journalEntriesService.list({ limit: 100 });
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
    if (!accountId) return setError('Selecciona una cuenta contable');
    const d = debit ? toDecimalString(debit) : '0.00';
    const c = credit ? toDecimalString(credit) : '0.00';
    if (Number(d) === 0 && Number(c) === 0) return setError('La partida debe incluir un débito o un crédito');
    if (Number(d) > 0 && Number(c) > 0) return setError('Una partida no puede tener simultáneamente débito y crédito');

    const acc = accounts.find((a) => (a.id || a._id) === accountId);
    setLines((prev) => [
      ...prev,
      {
        accountId,
        debit: d,
        credit: c,
        label: `${acc?.code} · ${acc?.name}`,
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
    if (!balanced) return setError('La póliza debe cuadrar: Σ Débitos = Σ Créditos (mínimo 2 renglones)');
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

  const accountOptions = accounts.map((a) => ({
    label: `${a.code} — ${a.name} (${a.type})`,
    value: a.id || a._id,
  }));

  const columns = [
    {
      key: 'reference',
      title: 'Póliza / Referencia',
      sortable: true,
      render: (item) => (
        <View style={styles.refCol}>
          <Text style={styles.icon}>📔</Text>
          <Text style={styles.refText}>{item.reference || 'Póliza Manual'}</Text>
        </View>
      ),
    },
    {
      key: 'date',
      title: 'Fecha',
      sortable: true,
      render: (item) => (
        <Text style={styles.dateText}>
          {item.date ? new Date(item.date).toLocaleDateString('es-MX') : ''}
        </Text>
      ),
    },
    {
      key: 'lines',
      title: 'Cuentas Afectadas',
      render: (item) => (
        <View>
          {(item.lines || []).slice(0, 2).map((line, i) => (
            <Text key={i} style={styles.lineSubText}>
              {line.accountId?.code} {line.accountId?.name} ({Number(line.debit?.$numberDecimal ?? line.debit ?? 0) > 0 ? `D: ${formatMoney(line.debit)}` : `C: ${formatMoney(line.credit)}`})
            </Text>
          ))}
          {(item.lines || []).length > 2 ? (
            <Text style={styles.moreLinesText}>+{(item.lines || []).length - 2} cuentas más</Text>
          ) : null}
        </View>
      ),
    },
    {
      key: 'total',
      title: 'Total Asiento',
      align: 'right',
      render: (item) => {
        const total = (item.lines || []).reduce(
          (sum, l) => sum + Number(l.debit?.$numberDecimal ?? l.debit ?? 0),
          0
        );
        return <Text style={styles.totalText}>{formatMoney(total)}</Text>;
      },
    },
  ];

  return (
    <Screen
      title="Pólizas Contables"
      subtitle="Libro diario inmutable: verificación de partida doble (Σ Débitos = Σ Créditos)"
      onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      headerRight={
        canWrite ? (
          <Button title="+ Nueva Póliza" onPress={openCreate} size="md" />
        ) : null
      }
    >
      <ErrorBanner message={error} />

      <DataTable
        columns={columns}
        data={entries}
        loading={loading}
        searchable={true}
        searchPlaceholder="Buscar póliza por referencia..."
        emptyText="No hay pólizas contables registradas"
      />

      {/* New Journal Entry Modal */}
      <Modal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nueva Póliza Contable"
        subtitle="Agrega los asientos respetando el principio de partida doble"
        primaryActionLabel="Registrar Póliza"
        onPrimaryAction={save}
        primaryLoading={saving}
        secondaryActionLabel="Cancelar"
        onSecondaryAction={() => setModalOpen(false)}
        maxWidth={680}
      >
        <ErrorBanner message={error} />
        <ScrollView keyboardShouldPersistTaps="handled">
          <Input
            label="Referencia / Folio de Póliza"
            value={reference}
            onChangeText={setReference}
            placeholder="ej. POL-2026-001 / INV-1002"
          />

          <View style={styles.lineFormCard}>
            <Text style={styles.sectionTitle}>Agregar Asiento</Text>
            <Select
              label="Cuenta Contable"
              value={accountId}
              onSelect={(val) => setAccountId(val)}
              options={accountOptions}
              placeholder="Seleccionar cuenta..."
            />
            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Input label="Débito ($)" value={debit} onChangeText={setDebit} placeholder="0.00" />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Crédito ($)" value={credit} onChangeText={setCredit} placeholder="0.00" />
              </View>
              <View style={{ alignSelf: 'flex-end', marginBottom: spacing.md }}>
                <Button title="＋ Asiento" onPress={addLine} size="md" variant="secondary" />
              </View>
            </View>
          </View>

          {/* Captured Lines */}
          <Text style={styles.sectionTitle}>Partidas del Asiento ({lines.length})</Text>
          {lines.length === 0 ? (
            <Text style={styles.emptyLinesText}>Agrega al menos dos partidas que cuadren la póliza.</Text>
          ) : (
            lines.map((line, index) => (
              <View key={index} style={styles.lineRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lineAccLabel}>{line.label}</Text>
                  <Text style={styles.lineAccAmounts}>
                    {Number(line.debit) > 0 ? `DÉBITO: ${formatMoney(line.debit)}` : `CRÉDITO: ${formatMoney(line.credit)}`}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeLine(index)} style={styles.removeBtn}>
                  <Text style={styles.removeIcon}>✕</Text>
                </TouchableOpacity>
              </View>
            ))
          )}

          {/* Balance Indicator Banner */}
          <View style={[styles.balanceBanner, balanced ? styles.balanceOk : styles.balanceBad]}>
            <View>
              <Text style={styles.balanceSummary}>
                Σ Débitos: {formatMoney(totalDebit)} · Σ Créditos: {formatMoney(totalCredit)}
              </Text>
              <Text style={styles.balanceDiff}>
                Diferencia: {formatMoney(Math.abs(totalDebit - totalCredit))}
              </Text>
            </View>
            <Badge
              label={balanced ? '✓ Cuadra' : '✗ No cuadra'}
              variant={balanced ? 'success' : 'danger'}
              dot
            />
          </View>
        </ScrollView>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  refCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: typography.sizes.md,
    marginRight: spacing.xs,
  },
  refText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  dateText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  lineSubText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  moreLinesText: {
    fontSize: typography.sizes.xs - 1,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  totalText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.extrabold,
    color: colors.primary,
  },

  // Modal styles
  lineFormCard: {
    backgroundColor: colors.surfaceSelected,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  twoCol: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  emptyLinesText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginVertical: spacing.sm,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lineAccLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  lineAccAmounts: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
    marginTop: 2,
  },
  removeBtn: {
    padding: spacing.xs,
  },
  removeIcon: {
    fontSize: typography.sizes.md,
    color: colors.danger,
    fontWeight: typography.weights.bold,
  },
  balanceBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  balanceOk: {
    backgroundColor: colors.greenSubtle,
    borderColor: colors.greenLight,
  },
  balanceBad: {
    backgroundColor: colors.dangerSubtle,
    borderColor: colors.dangerBorder,
  },
  balanceSummary: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  balanceDiff: {
    fontSize: typography.sizes.xs - 1,
    color: colors.textSecondary,
  },
});
