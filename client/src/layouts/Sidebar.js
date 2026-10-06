import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { typography, spacing, radius } from '../theme';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { Avatar } from '../components/ui/Avatar';

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
  const colors = useThemeStore((s) => s.colors);
  const canAccess = (perm) => !perm || can('*') || can(perm);

  const navGroups = [
    { title: 'GENERAL', items: [{ key: 'Dashboard', label: 'Dashboard', icon: '⌂', screen: 'Dashboard' }] },
    { title: 'OPERACIONES', items: [
      { key: 'Products', label: 'Productos', icon: '◫', screen: 'Products', perm: 'products:read' },
      { key: 'Warehouses', label: 'Bodegas', icon: '▤', screen: 'Warehouses', perm: 'stock:read' },
      { key: 'StockMovements', label: 'Movimientos Stock', icon: '↻', screen: 'StockMovements', perm: 'stock:read' },
      { key: 'Suppliers', label: 'Proveedores', icon: '▰', screen: 'Suppliers', perm: 'suppliers:read' },
      { key: 'PurchaseOrders', label: 'Órdenes de Compra', icon: '⌑', screen: 'PurchaseOrders', perm: 'purchaseOrders:read' },
      { key: 'Customers', label: 'Clientes', icon: '◉', screen: 'Customers', perm: 'customers:read' },
      { key: 'SalesOrders', label: 'Órdenes de Venta', icon: '▧', screen: 'SalesOrders', perm: 'salesOrders:read' },
      { key: 'Invoices', label: 'Facturas', icon: '▥', screen: 'Invoices', perm: 'invoices:read' },
    ]},
    { title: 'FINANZAS', items: [
      { key: 'Accounts', label: 'Catálogo Cuentas', icon: '⌂', screen: 'Accounts', perm: 'accounts:read' },
      { key: 'JournalEntries', label: 'Pólizas Contables', icon: '▣', screen: 'JournalEntries', perm: 'journalEntries:read' },
    ]},
    { title: 'ADMINISTRACIÓN', items: [
      { key: 'Companies', label: 'Empresas', icon: '▦', screen: 'Companies', perm: 'companies:read' },
      { key: 'Branches', label: 'Sucursales', icon: '⌖', screen: 'Branches', perm: 'branches:read' },
      { key: 'Users', label: 'Usuarios', icon: '●', screen: 'Users', perm: 'users:read' },
      { key: 'Roles', label: 'Roles y Permisos', icon: '◇', screen: 'Roles', perm: 'roles:read' },
    ]},
    { title: 'RECURSOS HUMANOS', items: [
      { key: 'Employees', label: 'Empleados', icon: '▱', screen: 'Employees', perm: 'employees:read' },
      { key: 'Payroll', label: 'Nómina', icon: '$', screen: 'Payroll', perm: 'payroll:read' },
      { key: 'Attendance', label: 'Asistencia', icon: '◷', screen: 'Attendance', perm: 'attendance:read' },
    ]},
    { title: 'ANÁLISIS Y ALERTAS', items: [
      { key: 'Reports', label: 'Reportes y BI', icon: '⌁', screen: 'Reports', perm: 'reports:read' },
      { key: 'Notifications', label: 'Notificaciones', icon: '◌', screen: 'Notifications' },
    ]},
  ];

  const handleSelect = (screen) => {
    onNavigate?.(screen);
    onCloseMobileDrawer?.();
  };

  const glass = Platform.OS === 'ios';

  return (
    <View style={[styles.container, isCollapsed && styles.collapsedContainer]}>
      {glass ? <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} /> : null}
      <View style={styles.brandHeader}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoBadgeText}>S</Text>
        </View>
        {!isCollapsed ? (
          <View style={styles.brandTextContainer}>
            <Text style={styles.brandName}>SYS ERP</Text>
            <Text style={styles.brandSubtitle}>{company?.name || 'Integrated Business Solutions'}</Text>
          </View>
        ) : null}
        {onToggleCollapse ? (
          <TouchableOpacity style={styles.collapseToggle} onPress={onToggleCollapse}>
            <Text style={styles.collapseToggleText}>{isCollapsed ? '›' : '‹'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.searchShell}>
        <Text style={styles.searchIcon}>⌕</Text>
        {!isCollapsed ? <Text style={styles.searchPlaceholder}>Buscar módulo...</Text> : null}
      </View>

      <ScrollView style={styles.menuScroll} contentContainerStyle={styles.menuContent} showsVerticalScrollIndicator={false}>
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => canAccess(item.perm));
          if (!visibleItems.length) return null;
          return (
            <View key={group.title} style={styles.groupContainer}>
              {!isCollapsed ? <Text style={styles.groupTitle}>{group.title}</Text> : <View style={styles.groupDivider} />}
              {visibleItems.map((item) => {
                const isActive = currentRoute === item.screen;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.menuItem, isActive && styles.menuItemActive, isCollapsed && styles.menuItemCollapsed]}
                    onPress={() => handleSelect(item.screen)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.itemIconShell, isActive && styles.itemIconShellActive]}>
                      <Text style={[styles.itemIcon, isActive && styles.itemIconActive]}>{item.icon}</Text>
                    </View>
                    {!isCollapsed ? (
                      <Text style={[styles.itemLabel, isActive && styles.itemLabelActive]} numberOfLines={1}>{item.label}</Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.userFooter}>
        {glass ? <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} /> : null}
        <Avatar name={user?.name || 'Usuario'} size={38} />
        {!isCollapsed ? (
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>{user?.name || 'Usuario'}</Text>
            <Text style={styles.userRole} numberOfLines={1}>{company?.name || user?.role?.name || 'Empresa'}</Text>
          </View>
        ) : null}
        {!isCollapsed ? (
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutIcon}>↗</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 280,
    height: '100%',
    flexDirection: 'column',
    backgroundColor: 'rgba(7, 31, 52, 0.92)',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  collapsedContainer: { width: 76 },
  brandHeader: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  logoBadge: {
    width: 42, height: 42, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(27,132,255,0.95)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.38)',
    shadowColor: '#2F8CFF', shadowOpacity: 0.45, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
  },
  logoBadgeText: { color: '#FFF', fontSize: 24, fontWeight: '800' },
  brandTextContainer: { flex: 1, marginLeft: spacing.sm },
  brandName: { color: '#FFF', fontSize: typography.sizes.lg, fontWeight: '800', letterSpacing: 0.2 },
  brandSubtitle: { color: 'rgba(255,255,255,0.66)', fontSize: 11, marginTop: 1 },
  collapseToggle: { padding: spacing.xs },
  collapseToggleText: { color: 'rgba(255,255,255,0.7)', fontSize: 24 },
  searchShell: {
    height: 44,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  searchIcon: { color: '#D7E6F4', fontSize: 18, marginRight: spacing.sm },
  searchPlaceholder: { color: 'rgba(255,255,255,0.62)', fontSize: 13 },
  menuScroll: { flex: 1 },
  menuContent: { paddingBottom: spacing.lg },
  groupContainer: { marginBottom: spacing.sm },
  groupTitle: {
    color: 'rgba(181,205,224,0.62)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  groupDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: spacing.xs },
  menuItem: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.sm,
    marginVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: 15,
  },
  menuItemCollapsed: { justifyContent: 'center', paddingHorizontal: 0 },
  menuItemActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  itemIconShell: {
    width: 30, height: 30, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  itemIconShellActive: { backgroundColor: 'rgba(255,255,255,0.18)' },
  itemIcon: { color: '#AFC8DB', fontSize: 16, fontWeight: '700' },
  itemIconActive: { color: '#FFF' },
  itemLabel: { flex: 1, marginLeft: spacing.sm, color: '#B7C9D8', fontSize: 13, fontWeight: '500' },
  itemLabelActive: { color: '#FFF', fontWeight: '700' },
  userFooter: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
  },
  userInfo: { flex: 1, marginLeft: spacing.sm },
  userName: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  userRole: { color: 'rgba(255,255,255,0.60)', fontSize: 11, marginTop: 1 },
  logoutBtn: {
    width: 34, height: 34, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  logoutIcon: { color: '#FF6B6B', fontSize: 16, fontWeight: '700' },
});

export default Sidebar;
