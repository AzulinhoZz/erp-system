import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Modal, Button, Input, Select, Badge, ErrorBanner } from './ui';
import { colors, typography, spacing, radius, shadows } from '../theme';
import { apiErrorMessage } from '../services/api';
import { productsService, warehousesService } from '../services/resources';
import { formatMoney, toDecimalString, decimalToNumber } from '../utils/money';

/**
 * Enterprise OrderEditor — line-item editor shared by Purchase and Sales orders.
 */
export default function OrderEditor({
  visible,
  onClose,
  onSaved,
  createOrder,
  partnerLabel, // 'Proveedor' | 'Cliente'
  partnerService,
}) {
  const [partners, setPartners] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  const [partnerId, setPartnerId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [lines, setLines] = useState([]);

  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState('1');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let alive = true;
    (async () => {
      setError('');
      setPartners([]);
      setProducts([]);
      setWarehouses([]);
      setPartnerId('');
      setWarehouseId('');
      setLines([]);
      setProductId('');
      setQty('1');
      setPrice('');
      try {
        const [p, prod, wh] = await Promise.all([
          partnerService.list({ limit: 100 }),
          productsService.list({ limit: 200 }),
          warehousesService.list(),
        ]);
        if (!alive) return;
        setPartners(Array.isArray(p) ? p : p.items || []);
        setProducts(prod.items || []);
        setWarehouses(Array.isArray(wh) ? wh : wh.items || []);
      } catch (err) {
        if (alive) setError(apiErrorMessage(err));
      }
    })();
    return () => {
      alive = false;
    };
  }, [visible, partnerService]);

  const addLine = () => {
    const product = products.find((p) => (p.id || p._id) === productId);
    if (!product) return setError('Selecciona un producto');
    const quantity = Number(qty);
    if (!Number.isInteger(quantity) || quantity <= 0) return setError('Cantidad debe ser un entero > 0');
    let unitPrice;
    try {
      unitPrice = price !== '' ? toDecimalString(price) : decimalToNumber(product.price).toFixed(2);
    } catch (e) {
      return setError(e.message);
    }
    setLines((prev) => [
      ...prev,
      { productId, quantity, unitPrice, sku: product.sku, name: product.name, unit: product.unit },
    ]);
    setProductId('');
    setQty('1');
    setPrice('');
    setError('');
    return undefined;
  };

  const removeLine = (index) => setLines((prev) => prev.filter((_, i) => i !== index));

  const total = lines.reduce(
    (sum, l) => sum + l.quantity * Number(l.unitPrice),
    0
  );

  const save = async () => {
    setError('');
    if (!partnerId) return setError(`Selecciona un ${partnerLabel.toLowerCase()}`);
    if (!warehouseId) return setError('Selecciona la bodega');
    if (!lines.length) return setError('Agrega al menos un renglón a la orden');
    setSaving(true);
    try {
      await createOrder({
        [partnerLabel === 'Proveedor' ? 'supplierId' : 'customerId']: partnerId,
        warehouseId,
        items: lines.map(({ productId: pid, quantity, unitPrice }) => ({
          productId: pid,
          quantity,
          unitPrice,
        })),
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
    return undefined;
  };

  const partnerOptions = partners.map((p) => ({
    label: `${p.name} (RFC: ${p.taxId})`,
    value: p.id || p._id,
  }));

  const warehouseOptions = warehouses.map((w) => ({
    label: `${w.name} (${w.branchId?.name || 'Sucursal'})`,
    value: w.id || w._id,
  }));

  const productOptions = products.map((p) => ({
    label: `${p.sku} — ${p.name} (${formatMoney(p.price)})`,
    value: p.id || p._id,
  }));

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={`Nueva Orden de ${partnerLabel === 'Proveedor' ? 'Compra' : 'Venta'}`}
      subtitle="Captura los renglones de la orden y calcula el total"
      primaryActionLabel="Guardar Orden"
      onPrimaryAction={save}
      primaryLoading={saving}
      secondaryActionLabel="Cancelar"
      onSecondaryAction={onClose}
      maxWidth={700}
    >
      <ErrorBanner message={error} />
      <ScrollView keyboardShouldPersistTaps="handled">
        {/* Partner & Warehouse Pickers */}
        <View style={styles.twoCol}>
          <View style={{ flex: 1 }}>
            <Select
              label={partnerLabel}
              value={partnerId}
              onSelect={(val) => setPartnerId(val)}
              options={partnerOptions}
              placeholder={`Seleccionar ${partnerLabel.toLowerCase()}...`}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Select
              label="Bodega Origen/Destino"
              value={warehouseId}
              onSelect={(val) => setWarehouseId(val)}
              options={warehouseOptions}
              placeholder="Seleccionar bodega..."
            />
          </View>
        </View>

        {/* Line Item Form */}
        <View style={styles.lineFormCard}>
          <Text style={styles.sectionTitle}>Agregar Renglón</Text>
          <Select
            label="Producto"
            value={productId}
            onSelect={(val) => {
              setProductId(val);
              const p = products.find((prod) => (prod.id || prod._id) === val);
              if (p) setPrice(decimalToNumber(p.price).toFixed(2));
            }}
            options={productOptions}
            placeholder="Seleccionar producto..."
          />
          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <Input
                label="Cantidad"
                value={qty}
                onChangeText={setQty}
                keyboardType="number-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Precio Unitario ($)"
                value={price}
                onChangeText={setPrice}
                placeholder="0.00"
              />
            </View>
            <View style={{ alignSelf: 'flex-end', marginBottom: spacing.md }}>
              <Button title="＋ Agregar" onPress={addLine} size="md" variant="secondary" />
            </View>
          </View>
        </View>

        {/* Captured Items List */}
        <Text style={styles.sectionTitle}>Partidas de la Orden ({lines.length})</Text>
        {lines.length === 0 ? (
          <Text style={styles.emptyLinesText}>No se han agregado partidas a esta orden.</Text>
        ) : (
          lines.map((line, index) => (
            <View key={`${line.productId}-${index}`} style={styles.lineRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.lineSkuName}>{line.sku} — {line.name}</Text>
                <Text style={styles.lineMeta}>
                  {line.quantity} {line.unit || 'pcs'} × {formatMoney(line.unitPrice)}
                </Text>
              </View>
              <Text style={styles.lineTotal}>{formatMoney(line.quantity * Number(line.unitPrice))}</Text>
              <TouchableOpacity onPress={() => removeLine(index)} style={styles.removeBtn}>
                <Text style={styles.removeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Order Grand Total Summary */}
        <View style={styles.totalBanner}>
          <Text style={styles.totalLabel}>TOTAL ESTIMADO:</Text>
          <Text style={styles.totalValue}>{formatMoney(total)}</Text>
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  twoCol: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  lineFormCard: {
    backgroundColor: colors.surfaceSelected,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
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
  lineSkuName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  lineMeta: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  lineTotal: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginRight: spacing.md,
  },
  removeBtn: {
    padding: spacing.xs,
  },
  removeIcon: {
    fontSize: typography.sizes.md,
    color: colors.danger,
    fontWeight: typography.weights.bold,
  },
  totalBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primarySubtle,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  totalLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  totalValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.extrabold,
    color: colors.primaryDark,
  },
});
