import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { colors, typography, spacing, radius, shadows } from '../theme';
import { useAuthStore } from '../store/authStore';
import { Avatar } from '../components/ui/Avatar';

/**
 * Enterprise SYS ERP Navigation Sidebar.
 */
export function Sidebar({
  currentRoute = 'Dashboard',
  onNavigate,
  isCollapsed = false,
  onToggleCollapse,
  onCloseMobileDrawer,
}) {
  const user = useAuthStore((s) => s.user);
  const company = useAuthStore((s) => s.company);
  const logout = useAuthStore((s) => s.logout);
  const can = useAuthStore((s) => s.can);

  const canAccess = (perm) => !perm || can('*') || can(perm);

  const navGroups = [
    {
      title: 'GENERAL',
      items: [
        { key: 'Dashboard', label: 'Dashboard', icon: '📊', screen: 'Dashboard' },
      ],
    },
    {
      title: 'OPERACIONES',
      items: [
        { key: 'Products', label: 'Productos', icon: '📦', screen: 'Products', perm: 'products:read' },
        { key: 'Warehouses', label: 'Bodegas', icon: '🏭', screen: 'Warehouses', perm: 'stock:read' },
        { key: 'StockMovements', label: 'Movimientos Stock', icon: '🔄', screen: 'StockMovements', perm: 'stock:read' },
        { key: 'Suppliers', label: 'Proveedores', icon: '🚚', screen: 'Suppliers', perm: 'suppliers:read' },
        { key: 'PurchaseOrders', label: 'Órdenes de Compra', icon: '🛒', screen: 'PurchaseOrders', perm: 'purchaseOrders:read' },
        { key: 'Customers', label: 'Clientes', icon: '👥', screen: 'Customers', perm: 'customers:read' },
        { key: 'SalesOrders', label: 'Órdenes de Venta', icon: '📑', screen: 'SalesOrders', perm: 'salesOrders:read' },
        { key: 'Invoices', label: 'Facturas', icon: '🧾', screen: 'Invoices', perm: 'invoices:read' },
      ],
    },
    {
      title: 'FINANZAS',
      items: [
        { key: 'Accounts', label: 'Catálogo Cuentas', icon: '🏛️', screen: 'Accounts', perm: 'accounts:read' },
        { key: 'JournalEntries', label: 'Pólizas Contables', icon: '📔', screen: 'JournalEntries', perm: 'journalEntries:read' },
      ],
    },
    {
      title: 'ADMINISTRACIÓN',
      items: [
        { key: 'Companies', label: 'Empresas', icon: '🏢', screen: 'Companies', perm: 'companies:read' },
        { key: 'Branches', label: 'Sucursales', icon: '📍', screen: 'Branches', perm: 'branches:read' },
        { key: 'Users', label: 'Usuarios', icon: '👤', screen: 'Users', perm: 'users:read' },
        { key: 'Roles', label: 'Roles y Permisos', icon: '🛡️', screen: 'Roles', perm: 'roles:read' },
      ],
    },
    {
      title: 'RECURSOS HUMANOS',
      items: [
        { key: 'Employees', label: 'Empleados', icon: '💼', screen: 'Employees', perm: 'employees:read' },
        { key: 'Payroll', label: 'Nómina', icon: '💵', screen: 'Payroll', perm: 'payroll:read' },
        { key: 'Attendance', label: 'Asistencia', icon: '⏰', screen: 'Attendance', perm: 'attendance:read' },
      ],
    },
    {
      title: 'ANÁLISIS Y ALERTAS',
      items: [
        { key: 'Reports', label: 'Reportes y BI', icon: '📈', screen: 'Reports', perm: 'reports:read' },
        { key: 'Notifications', label: 'Notificaciones', icon: '🔔', screen: 'Notifications' },
      ],
    },
  ];

  const handleSelect = (screen) => {
    if (onNavigate) onNavigate(screen);
    if (onCloseMobileDrawer) onCloseMobileDrawer();
  };

  return (
    <View style={[styles.container, isCollapsed && styles.collapsedContainer]}>
      {/* Brand Header */}
      <View style={styles.brandHeader}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoBadgeText}>SYS</Text>
        </View>
        {!isCollapsed ? (
          <View style={styles.brandTextContainer}>
            <Text style={styles.brandName}>SYS ERP</Text>
            <Text style={styles.brandSubtitle}>Integrated Business Solutions</Text>
          </View>
        ) : null}
        {onToggleCollapse ? (
          <TouchableOpacity
            style={styles.collapseToggle}
            onPress={onToggleCollapse}
          >
            <Text style={styles.collapseToggleText}>
              {isCollapsed ? '›' : '‹'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Navigation Links */}
      <ScrollView
        style={styles.menuScroll}
        showsVerticalScrollIndicator={false}
      >
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => canAccess(item.perm));
          if (visibleItems.length === 0) return null;

          return (
            <View key={group.title} style={styles.groupContainer}>
              {!isCollapsed ? (
                <Text style={styles.groupTitle}>{group.title}</Text>
              ) : (
                <View style={styles.groupDivider} />
              )}
              {visibleItems.map((item) => {
                const isActive = currentRoute === item.screen;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.menuItem,
                      isActive && styles.menuItemActive,
                      isCollapsed && styles.menuItemCollapsed,
                    ]}
                    onPress={() => handleSelect(item.screen)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.itemIcon}>{item.icon}</Text>
                    {!isCollapsed ? (
                      <Text
                        style={[
                          styles.itemLabel,
                          isActive && styles.itemLabelActive,
                        ]}
                        numberOfLines={1}
                      >
                        {item.label}
                      </Text>
                    ) : null}
                    {isActive && !isCollapsed ? (
                      <View style={styles.activeDot} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
      </ScrollView>

      {/* User Footer */}
      <View style={styles.userFooter}>
        <Avatar name={user?.name || 'Usuario'} size={isCollapsed ? 32 : 36} />
        {!isCollapsed ? (
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.name || 'Usuario'}
            </Text>
            <Text style={styles.userRole} numberOfLines={1}>
              {company?.name || user?.role?.name || 'Empresa'}
            </Text>
          </View>
        ) : null}
        {!isCollapsed ? (
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutIcon}>🚪</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 250,
    backgroundColor: colors.primaryDark,
    height: '100%',
    flexDirection: 'column',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
  },
  collapsedContainer: {
    width: 68,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  logoBadge: {
    backgroundColor: colors.green,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBadgeText: {
    color: colors.surface,
    fontWeight: typography.weights.extrabold,
    fontSize: typography.sizes.sm,
    letterSpacing: 0.5,
  },
  brandTextContainer: {
    flex: 1,
    marginLeft: spacing.xs + 2,
  },
  brandName: {
    color: colors.surface,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.extrabold,
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    color: colors.greenLight,
    fontSize: typography.sizes.xs - 2,
    fontWeight: typography.weights.medium,
  },
  collapseToggle: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  collapseToggleText: {
    color: colors.textMuted,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  menuScroll: {
    flex: 1,
    paddingVertical: spacing.sm,
  },
  groupContainer: {
    marginBottom: spacing.md,
  },
  groupTitle: {
    fontSize: typography.sizes.xs - 2,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
    letterSpacing: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    textTransform: 'uppercase',
  },
  groupDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginHorizontal: spacing.xs,
    borderRadius: radius.md,
  },
  menuItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  menuItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderLeftWidth: 3,
    borderLeftColor: colors.green,
  },
  itemIcon: {
    fontSize: typography.sizes.md,
    width: 24,
    textAlign: 'center',
  },
  itemLabel: {
    fontSize: typography.sizes.sm,
    color: '#94A3B8',
    fontWeight: typography.weights.medium,
    flex: 1,
    marginLeft: spacing.sm,
  },
  itemLabelActive: {
    color: colors.surface,
    fontWeight: typography.weights.bold,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green,
  },
  userFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  userName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.surface,
  },
  userRole: {
    fontSize: typography.sizes.xs - 1,
    color: colors.textMuted,
  },
  logoutBtn: {
    padding: spacing.xs,
  },
  logoutIcon: {
    fontSize: typography.sizes.md,
  },
});

export default Sidebar;
