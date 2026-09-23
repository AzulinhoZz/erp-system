import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Screen, Card, AppButton, Field, EmptyState, ErrorBanner } from './ui';
import { apiErrorMessage } from '../services/api';
import { usePermission } from '../hooks/usePermission';

/**
 * Reusable CRUD screen.
 *
 * Config-driven so every module reuses it:
 *   - list via service.list(params)
 *   - create/update via a modal form built from `fields`
 *   - RBAC via readPermission/writePermission (hides UI, API still enforces)
 *
 * fields: [{ name, label, type: 'text'|'email'|'password'|'switch', required,
 *            options?: async () => [{label, value}] }]
 * renderRow: (item, onEdit) => JSX
 */
export default function CrudScreen({
  title,
  subtitle,
  service,
  fields = [],
  renderRow,
  listParams = {},
  entityName = 'registro',
  mapToForm,
  mapFromForm,
  readPermission,
  writePermission,
  onBack,
  /** rowActions: (item) => [{ label, variant, visible?, run: async (item) }] */
  rowActions,
  /** Replace the default "+ Nuevo" behavior (e.g. line-item editor). */
  onCreate,
  createLabel,
}) {
  // Hooks always run in the same order (no short-circuit before hooks!)
  const isSuperAdmin = usePermission('*');
  const hasRead = usePermission(readPermission || readPermFor(title));
  const hasWrite = usePermission(writePermission || writePermFor(title));
  const canRead = isSuperAdmin || hasRead;
  const canWrite = isSuperAdmin || hasWrite;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = create, id = update
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [fieldOptions, setFieldOptions] = useState({});
  const [actionBusy, setActionBusy] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await service.list(listParams);
      setItems(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [service, listParams]);

  useEffect(() => {
    load();
  }, [load]);

  // Resolve async select options (e.g. roles list for the user form)
  useEffect(() => {
    let alive = true;
    fields
      .filter((f) => typeof f.options === 'function')
      .forEach(async (f) => {
        try {
          const opts = await f.options();
          if (alive) setFieldOptions((prev) => ({ ...prev, [f.name]: opts }));
        } catch {
          /* options are auxiliary — ignore failures */
        }
      });
    return () => {
      alive = false;
    };
  }, [fields]);

  const openCreate = () => {
    setEditing(null);
    const initial = {};
    fields.forEach((f) => {
      initial[f.name] = f.type === 'switch' ? false : '';
    });
    setForm(initial);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item.id || item._id);
    setForm(mapToForm ? mapToForm(item) : defaultForm(item, fields));
    setError('');
    setModalOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = mapFromForm ? mapFromForm({ ...form }) : { ...form };
      if (editing) await service.update(editing, payload);
      else await service.create(payload);
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const setField = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const runRowAction = async (action, item) => {
    const key = `${action.label}:${item.id || item._id}`;
    setActionBusy(key);
    setError('');
    try {
      await action.run(item);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setActionBusy(null);
    }
  };

  return (
    <Screen
      title={title}
      subtitle={subtitle}
      onBack={onBack}
      headerRight={
        canWrite ? (
          <AppButton
            title={createLabel || '+ Nuevo'}
            onPress={
              onCreate ||
              (() => {
                openCreate();
              })
            }
          />
        ) : null
      }
    >
      <ErrorBanner message={error} />

      {canRead ? (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id || item._id}
          refreshing={loading}
          onRefresh={load}
          ListEmptyComponent={!loading ? <EmptyState text={`No hay ${entityName}s todavía`} /> : null}
          renderItem={({ item }) => {
            const actions = (rowActions ? rowActions(item) : []).filter(
              (a) => a.visible === undefined || a.visible
            );
            return (
              <TouchableOpacity activeOpacity={0.7} onPress={() => canWrite && openEdit(item)}>
                <Card>
                  {renderRow(item)}
                  {actions.length > 0 && (
                    <View style={styles.rowActions}>
                      {actions.map((action) => (
                        <AppButton
                          key={action.label}
                          title={
                            actionBusy === `${action.label}:${item.id || item._id}`
                              ? '…'
                              : action.label
                          }
                          variant={action.variant || 'ghost'}
                          disabled={actionBusy !== null}
                          onPress={() => runRowAction(action, item)}
                        />
                      ))}
                    </View>
                  )}
                </Card>
              </TouchableOpacity>
            );
          }}
        />
      ) : (
        <EmptyState text="No tienes permisos para consultar este módulo" />
      )}

      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editing ? `Editar ${entityName}` : `Nuevo ${entityName}`}
            </Text>
            <ErrorBanner message={error} />
            <ScrollView>
              {fields
                .filter((f) => f.type !== 'select')
                .map((field) => (
                  <Field
                    key={field.name}
                    field={{
                      ...field,
                      options: undefined,
                    }}
                    value={
                      field.type === 'switch'
                        ? Boolean(form[field.name])
                        : String(form[field.name] ?? '')
                    }
                    onChangeText={(v) => setField(field.name, v)}
                    onToggle={() => setField(field.name, !form[field.name])}
                  />
                ))}
              {/* select-type fields rendered as simple option chips */}
              {fields
                .filter((f) => f.type === 'select')
                .map((f) => (
                  <View key={f.name}>
                    <Text style={styles.chipLabel}>{f.label}</Text>
                    <View style={styles.chips}>
                      {(fieldOptions[f.name] || []).map((opt) => {
                        const selected = form[f.name] === opt.value;
                        return (
                          <TouchableOpacity
                            key={opt.value}
                            style={[styles.chip, selected && styles.chipOn]}
                            onPress={() => setField(f.name, opt.value)}
                          >
                            <Text style={[styles.chipText, selected && styles.chipTextOn]}>
                              {opt.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <AppButton title="Cancelar" variant="ghost" onPress={() => setModalOpen(false)} />
              <AppButton title="Guardar" onPress={save} loading={saving} />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function defaultForm(item, fields) {
  const form = {};
  fields.forEach((f) => {
    const raw = item[f.name];
    if (f.type === 'switch') form[f.name] = Boolean(raw);
    else if (f.type === 'select') form[f.name] = raw && typeof raw === 'object' ? raw.id || raw._id : raw || '';
    else form[f.name] = raw == null ? '' : String(raw);
  });
  return form;
}

/** Fallback RBAC mapping when no explicit permission is given. */
function readPermFor(title) {
  const map = {
    Usuarios: 'users:read',
    Roles: 'roles:read',
    Empresas: 'companies:read',
    Sucursales: 'branches:read',
  };
  return map[title] || '*';
}

function writePermFor(title) {
  const map = {
    Usuarios: 'users:write',
    Roles: 'roles:write',
    Empresas: 'companies:write',
    Sucursales: 'branches:write',
  };
  return map[title] || '*';
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  rowActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  chipLabel: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipOn: { backgroundColor: '#1d4ed8', borderColor: '#1d4ed8' },
  chipText: { color: '#334155', fontSize: 13 },
  chipTextOn: { color: '#fff', fontWeight: '600' },
});
