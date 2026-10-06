import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { colors, typography, spacing, radius, shadows } from '../../theme';
import { Input } from './Input';
import { Button } from './Button';
import { EmptyState, LoadingState } from './States';

/**
 * Enterprise DataTable component for SYS ERP.
 *
 * columns: [{ key, title, render?: (item) => JSX, width?: number|string, align?: 'left'|'center'|'right', sortable?: boolean }]
 * data: Array of items
 * keyExtractor: (item) => string|number
 */
export function DataTable({
  columns = [],
  data = [],
  keyExtractor = (item) => item.id || item._id,
  loading = false,
  searchable = true,
  searchPlaceholder = 'Buscar en la tabla...',
  pageSize = 10,
  onRowPress,
  emptyText = 'No se encontraron registros',
  actionHeader = 'Acciones',
  renderActions,
  style,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [page, setPage] = useState(1);

  // Search filtering
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    return data.filter((item) =>
      Object.values(item).some((val) => {
        if (val == null) return false;
        if (typeof val === 'object') {
          return JSON.stringify(val).toLowerCase().includes(q);
        }
        return String(val).toLowerCase().includes(q);
      })
    );
  }, [data, searchQuery]);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      let valA = a[sortKey] ?? '';
      let valB = b[sortKey] ?? '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortKey, sortOrder]);

  // Pagination
  const totalItems = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      if (sortOrder === 'asc') setSortOrder('desc');
      else setSortKey(null); // Clear sort
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Search Header */}
      {searchable ? (
        <View style={styles.toolbar}>
          <Input
            value={searchQuery}
            onChangeText={(v) => {
              setSearchQuery(v);
              setPage(1);
            }}
            placeholder={searchPlaceholder}
            style={styles.searchInput}
            leftIcon={<Text style={styles.searchIcon}>🔍</Text>}
          />
          <Text style={styles.recordCount}>
            {totalItems} {totalItems === 1 ? 'registro' : 'registros'}
          </Text>
        </View>
      ) : null}

      {/* Table Content */}
      <View style={styles.tableCard}>
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View>
            {/* Header Row */}
            <View style={styles.headerRow}>
              {columns.map((col) => (
                <TouchableOpacity
                  key={col.key}
                  disabled={!col.sortable}
                  onPress={() => toggleSort(col.key)}
                  style={[
                    styles.headerCell,
                    col.width ? { width: col.width } : { flex: 1, minWidth: 120 },
                    col.align === 'right' && { alignItems: 'flex-end' },
                    col.align === 'center' && { alignItems: 'center' },
                  ]}
                >
                  <Text style={styles.headerText}>
                    {col.title}{' '}
                    {col.sortable && sortKey === col.key
                      ? sortOrder === 'asc'
                        ? '▲'
                        : '▼'
                      : ''}
                  </Text>
                </TouchableOpacity>
              ))}
              {renderActions ? (
                <View style={[styles.headerCell, { width: 120, alignItems: 'center' }]}>
                  <Text style={styles.headerText}>{actionHeader}</Text>
                </View>
              ) : null}
            </View>

            {/* Loading / Rows / Empty */}
            {loading ? (
              <LoadingState message="Cargando información..." />
            ) : paginatedData.length === 0 ? (
              <EmptyState text={emptyText} />
            ) : (
              paginatedData.map((item, index) => {
                const key = keyExtractor(item);
                const isEven = index % 2 === 0;
                return (
                  <TouchableOpacity
                    key={key}
                    activeOpacity={onRowPress ? 0.7 : 1}
                    onPress={() => onRowPress && onRowPress(item)}
                    style={[styles.bodyRow, isEven ? styles.rowEven : styles.rowOdd]}
                  >
                    {columns.map((col) => (
                      <View
                        key={col.key}
                        style={[
                          styles.bodyCell,
                          col.width ? { width: col.width } : { flex: 1, minWidth: 120 },
                          col.align === 'right' && { alignItems: 'flex-end' },
                          col.align === 'center' && { alignItems: 'center' },
                        ]}
                      >
                        {col.render ? (
                          col.render(item)
                        ) : (
                          <Text style={styles.cellText} numberOfLines={2}>
                            {item[col.key] != null ? String(item[col.key]) : '—'}
                          </Text>
                        )}
                      </View>
                    ))}
                    {renderActions ? (
                      <View
                        style={[
                          styles.bodyCell,
                          { width: 120, alignItems: 'center', justifyContent: 'center' },
                        ]}
                      >
                        {renderActions(item)}
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* Footer Pagination */}
        {!loading && totalItems > 0 ? (
          <View style={styles.pagination}>
            <Text style={styles.paginationInfo}>
              Página {currentPage} de {totalPages}
            </Text>
            <View style={styles.paginationBtns}>
              <Button
                title="‹ Anterior"
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
              />
              <Button
                title="Siguiente ›"
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
              />
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  searchInput: {
    flex: 1,
    marginBottom: 0,
    maxWidth: 360,
  },
  searchIcon: {
    fontSize: typography.sizes.sm,
  },
  recordCount: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  refreshIndicator: {\n    flexDirection: 'row',\n    alignItems: 'center',\n    justifyContent: 'flex-end',\n    gap: spacing.xs,\n    paddingHorizontal: spacing.sm,\n    paddingVertical: 4,\n  },\n  refreshText: {\n    fontSize: typography.sizes.xs,\n    color: colors.textSecondary,\n  },\n  tableCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: colors.primaryDark,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
  },
  headerCell: {
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
  },
  headerText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.surface,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bodyRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  rowEven: {
    backgroundColor: colors.surface,
  },
  rowOdd: {
    backgroundColor: colors.surfaceHover,
  },
  bodyCell: {
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
  },
  cellText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surfaceHover,
  },
  paginationInfo: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  paginationBtns: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
});

export default DataTable;
