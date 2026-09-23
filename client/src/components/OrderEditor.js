import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { AppButton, AppInput, ErrorBanner } from './ui';
import { apiErrorMessage } from '../services/api';
import { productsService, warehousesService } from '../services/resources';
import { formatMoney, toDecimalString, decimalToNumber } from '../utils/money';

/**
 * OrderEditor — line-item editor shared by purchase orders and sales orders.
 *
 * Partner (supplier/customer) and warehouse are picked with chips, items are
 * added one by one (product + qty + unit price) and the total is previewed
 * client-side; the server recomputes and stores the authoritative total.
 */
export default function OrderEditor({
  visible,
  onClose,
  onSaved,
  createOrder, // async (payload) => order
  partnerLabel,
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
        const p = await partnerService.list({ limit: 100 });
        if (!alive) return;
        setPartners(Array.isArray(p) ? p : p.items || []);
      } catch (err) {
        if (alive) setError(apiErrorMessage(err));
      }
    })();
    return () => {
      alive = false;
    };
  }, [visible, partnerService]);

  // products + warehouses for the line editor
  useEffect(() => {
    if (!visible) return;
    let alive = true;
    (async () => {
      try {
        const [prod, wh] = await Promise.all([
          productsService.list({ limit: 200 }),
          warehousesService.list(),
        ]);
        if (!alive) return;
        setProducts(prod.items || []);
        setWarehouses(Array.isArray(wh) ? wh : wh.items || []);
      } catch (err) {
        if (alive) setError(apiErrorMessage(err));
      }
    })();
    return () => {
      alive = false;
    };
  }, [visible]);

  const addLine = () => {
    const product = products.find((p) => (p.id || p._id) === productId);
    if (!product) return setError('Selecciona un producto');
    const quantity = Number(qty);
    if (!Number.isInteger(quantity) || quantity <= 0) return setError('Cantidad debe ser entero > 0');
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
    if (!partnerId) return setError(`Selecciona ${partnerLabel.toLowerCase()}`);
    if (!warehouseId) return setError('Selecciona la bodega');
    if (!lines.length) return setError('Agrega al menos un renglón');
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

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Nueva orden</Text>
          <ErrorBanner message={error} />
          <ScrollView>
            {/* partner */}
            <Text style={styles.label}>{partnerLabel}</Text>
            <View style={styles.chips}>
              {partners.map((p) => {
                const id = p.id || p._id;
                const on = partnerId === id;
                return (
                  <TouchableOpacity
                    key={id}
                    style={[styles.chip, on && styles.chipOn]}
                    onPress={() => setPartnerId(id)}
                  >
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{p.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* warehouse */}
            <Text style={styles.label}>Bodega</Text>
            <View style={styles.chips}>
              {warehouses.map((w) => {
                const id = w.id || w._id;
                const on = warehouseId === id;
                return (
                  <TouchableOpacity
                    key={id}
                    style={[styles.chip, on && styles.chipOn]}
                    onPress={() => setWarehouseId(id)}
                  >
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{w.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* line editor */}
            <Text style={styles.label}>Producto</Text>
            <View style={styles.chips}>
              {products.map((p) => {
                const id = p.id || p._id;
                const on = productId === id;
                return (
                  <TouchableOpacity
                    key={id}
                    style={[styles.chip, on && styles.chipOn]}
                    onPress={() => {
                      setProductId(id);
                      setPrice(decimalToNumber(p.price).toFixed(2));
                    }}
                  >
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{p.sku}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.lineRow}>
              <View style={{ flex: 1 }}>
                <AppInput label="Cantidad" value={qty} onChangeText={setQty} keyboardType="number-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <AppInput label="Precio unit." value={price} onChangeText={setPrice} placeholder="0.00" />
              </View>
              <AppButton title="＋" onPress={addLine} />
            </View>

            {/* lines */}
            {lines.map((line, index) => (
              <View key={`${line.productId}-${index}`} style={styles.line}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lineName}>
                    {line.sku} — {line.name}
                  </Text>
                  <Text style={styles.lineMeta}>
                    {line.quantity} × {formatMoney(line.unitPrice)} ={' '}
                    {formatMoney(line.quantity * Number(line.unitPrice))}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeLine(index)}>
                  <Text style={styles.remove}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            <Text style={styles.total}>Total: {formatMoney(total)}</Text>
          </ScrollView>

          <View style={styles.actions}>
            <AppButton title="Cancelar" variant="ghost" onPress={onClose} />
            <AppButton title="Guardar orden" onPress={save} loading={saving} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  card: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
  title: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 10 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6, marginTop: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  chipOn: { backgroundColor: '#1d4ed8', borderColor: '#1d4ed8' },
  chipText: { color: '#334155', fontSize: 13 },
  chipTextOn: { color: '#fff', fontWeight: '600' },
  lineRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  lineName: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  lineMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  remove: { fontSize: 16, color: '#dc2626', paddingHorizontal: 8 },
  total: { fontSize: 17, fontWeight: '800', color: '#0f172a', textAlign: 'right', marginVertical: 10 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 6 },
});
