import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Screen,
  Card,
  Button,
  Field,
  EmptyState,
  ErrorBanner,
  DataTable,
  Modal,
  Badge,
} from './ui';
import { colors, typography, spacing, radius } from '../theme';
import { apiErrorMessage } from '../services/api';
import { usePermission } from '../hooks/usePermission';

/**
 * Reusable Enterprise CRUD screen using DataTable and Modal.
 */
export default function CrudScreen({
  title,
  subtitle,
  service,
  fields = [],
  columns,
  renderRow,
  listParams = {},
  entityName = 'registro',
  mapToForm,
  mapFromForm,
  readPermission,
  writePermission,
  onBack,
  rowActions,
  onCreate,
  createLabel,
}) {
  const isSuperAdmin = usePermission('*');
  const hasRead = usePermission(readPermission || readPermFor(title));
  const hasWrite = usePermission(writePermission || writePermFor(title));
  const canRead = isSuperAdmin || hasRead;
  const canWrite = isSuperAdmin || hasWrite;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [fieldOptions, setFieldOptions] = useState({});
  const [actionBusy, setActionBusy] = useState(null);
  const listParamsKey = JSON.stringify(listParams || {});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await service.list(listParams);
      // Keep the previous rows visible until a successful response replaces them.
      setItems(Array.isArray(data) ? data : data?.items || []);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [service, listParamsKey]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await service.list(listParams);
        if (!cancelled) setItems(Array.isArray(data) ? data : data?.items || []);
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  // Depend on the serialized value, not the object identity. Many screens pass
  // an inline/default object, which otherwise causes an endless fetch/render loop.
  }, [service, listParamsKey]);

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

  // Build default columns if none provided
  const tableColumns = useMemo(() => {
    if (columns && columns.length > 0) return columns;

    if (renderRow) {
      return [
        {
          key: 'content',
          title: entityName.toUpperCase(),
          render: (item) => renderRow(item),
        },
      ];
    }

    return fields
      .filter((f) => f.type !== 'password')
      .map((f) => ({
        key: f.name,
        title: f.label,
        sortable: true,
        render: (item) => {
          const val = item[f.name];
          if (f.type === 'switch') {
            return (
              <Badge
                label={val ? 'Activo' : 'Inactivo'}
                variant={val ? 'success' : 'danger'}
                dot
              />
            );
          }
          if (val && typeof val === 'object') {
            return <Text style={styles.cellText}>{val.name || val.title || JSON.stringify(val)}</Text>;
          }
          return <Text style={styles.cellText}>{val != null ? String(val) : '—'}</Text>;
        },
      }));
  }, [columns, renderRow, fields, entityName]);

  return (
    <Screen
      title={title}
      subtitle={subtitle}
      onBack={onBack}
      headerRight={
        canWrite ? (
          <Button
            title={createLabel || '+ Nuevo'}
            onPress={onCreate || openCreate}
            size="md"
          />
        ) : null
      }
    >
      <ErrorBanner message={error} />

      {canRead ? (
        <DataTable
          columns={tableColumns}
          data={items}
          loading={loading}
          searchable={true}
          searchPlaceholder={`Buscar ${entityName}...`}
          emptyText={`No hay ${entityName}s registrados`}
          onRowPress={(item) => canWrite && openEdit(item)}
          renderActions={(item) => {
            const actions = (rowActions ? rowActions(item) : []).filter(
              (a) => a.visible === undefined || a.visible
            );
            return (
              <View style={styles.actionRow}>
                {canWrite ? (
                  <Button
                    title="Editar"
                    variant="ghost"
                    size="sm"
                    onPress={() => openEdit(item)}
                  />
                ) : null}
                {actions.map((action) => (
                  <Button
                    key={action.label}
                    title={
                      actionBusy === `${action.label}:${item.id || item._id}`
                        ? '…'
                        : action.label
                    }
                    variant={action.variant || 'ghost'}
                    size="sm"
                    disabled={actionBusy !== null}
                    onPress={() => runRowAction(action, item)}
                  />
                ))}
              </View>
            );
          }}
        />
      ) : (
        <EmptyState text="No tienes permisos para consultar este módulo" />
      )}

      {/* Form Modal */}
      <Modal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Editar ${entityName}` : `Nuevo ${entityName}`}
        subtitle="Ingresa la información requerida"
        primaryActionLabel="Guardar"
        onPrimaryAction={save}
        primaryLoading={saving}
        secondaryActionLabel="Cancelar"
        onSecondaryAction={() => setModalOpen(false)}
      >
        <ErrorBanner message={error} />
        <ScrollView style={{ maxHeight: 420 }}>
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
          {fields
            .filter((f) => f.type === 'select')
            .map((f) => (
              <View key={f.name} style={{ marginBottom: spacing.md }}>
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
      </Modal>
    </Screen>
  );
}

function defaultForm(item, fields) {
  const form = {};
  fields.forEach((f) => {
    const raw = item[f.name];
    if (f.type === 'switch') form[f.name] = Boolean(raw);
    else if (f.type === 'select')
      form[f.name] = raw && typeof raw === 'object' ? raw.id || raw._id : raw || '';
    else form[f.name] = raw == null ? '' : String(raw);
  });
  return form;
}

function readPermFor(title) {
  const map = {
    Usuarios: 'users:read',
    Roles: 'roles:read',
    Empresas: 'companies:read',
    Sucursales: 'branches:read',
  };
  return map[title] || '*';
}

const styles = StyleSheet.create({
  cellText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  },
  chipLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
  },
  chipOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.text,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  chipTextOn: {
    color: colors.surface,
    fontWeight: typography.weights.bold,
  },
});
