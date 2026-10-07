import React, { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, ScrollView } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuthStore } from '../store/authStore';
import { MainLayout } from '../layouts/MainLayout';
import { colors, typography, spacing, radius } from '../theme';
import { Card, KPICard } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

// Auth
import LoginScreen from '../screens/core/LoginScreen';

// Dashboard Screen
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import UsersScreen from '../screens/core/UsersScreen';
import RolesScreen from '../screens/core/RolesScreen';
import CompaniesScreen from '../screens/core/CompaniesScreen';
import BranchesScreen from '../screens/core/BranchesScreen';

// Inventario Screens
import ProductsScreen from '../screens/inventario/ProductsScreen';
import WarehousesScreen from '../screens/inventario/WarehousesScreen';
import StockMovementsScreen from '../screens/inventario/StockMovementsScreen';

// Compras Screens
import SuppliersScreen from '../screens/compras/SuppliersScreen';
import PurchaseOrdersScreen from '../screens/compras/PurchaseOrdersScreen';

// Ventas Screens
import CustomersScreen from '../screens/ventas/CustomersScreen';
import SalesOrdersScreen from '../screens/ventas/SalesOrdersScreen';
import InvoicesScreen from '../screens/ventas/InvoicesScreen';

// Finanzas Screens
import AccountsScreen from '../screens/finanzas/AccountsScreen';
import JournalEntriesScreen from '../screens/finanzas/JournalEntriesScreen';

// RRHH Screens
import EmployeesScreen from '../screens/rrhh/EmployeesScreen';
import PayrollScreen from '../screens/rrhh/PayrollScreen';
import AttendanceScreen from '../screens/rrhh/AttendanceScreen';

// Reportes & Notificaciones
import ReportsScreen from '../screens/reportes/ReportsScreen';
import NotificationsScreen from '../screens/notificaciones/NotificationsScreen';

// Sockets
import { disconnectSocket } from '../services/sockets';

const Stack = createNativeStackNavigator();

// PlaceholderDashboard removed in favor of real DashboardScreen in screens/dashboard/DashboardScreen.js

function ProfileView({ onBack }) {
  const user = useAuthStore((s) => s.user);
  const company = useAuthStore((s) => s.company);
  const logout = useAuthStore((s) => s.logout);

  return (
    <ScrollView style={styles.dashboardContainer} contentContainerStyle={styles.dashboardContent}>
      <Card style={{ alignItems: 'center', padding: spacing.xl }}>
        <Text style={{ fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.text }}>
          {user?.name}
        </Text>
        <Text style={{ fontSize: typography.sizes.sm, color: colors.textSecondary, marginTop: 4 }}>
          {user?.email}
        </Text>
        <View style={{ backgroundColor: colors.primarySubtle, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, marginTop: 12 }}>
          <Text style={{ color: colors.primary, fontWeight: typography.weights.bold, fontSize: typography.sizes.xs }}>
            Rol: {user?.role?.name || 'Administrador'}
          </Text>
        </View>
        <Text style={{ fontSize: typography.sizes.sm, color: colors.textSecondary, marginTop: 8 }}>
          Empresa: {company?.name || 'Empresa Demo'}
        </Text>
        <View style={{ marginTop: 24, width: '100%', maxWidth: 240 }}>
          <Button title="Cerrar Sesión" variant="danger" onPress={logout} />
        </View>
      </Card>
    </ScrollView>
  );
}

export default function RootNavigator() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const user = useAuthStore((s) => s.user);
  const hydrate = useAuthStore((s) => s.hydrate);

  const [currentRoute, setCurrentRoute] = useState('Dashboard');

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!user) disconnectSocket();
  }, [user]);

  const handleNavigate = useCallback((screenName) => {
    setCurrentRoute(screenName);
  }, []);

  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    );
  }

  // Render current screen inside MainLayout ERP Shell
  const renderCurrentScreen = () => {
    const dummyNav = {
      canGoBack: () => currentRoute !== 'Dashboard',
      goBack: () => setCurrentRoute('Dashboard'),
    };

    switch (currentRoute) {
      case 'Dashboard':
        return <DashboardScreen onNavigate={handleNavigate} />;
      case 'Products':
        return <ProductsScreen navigation={dummyNav} />;
      case 'Warehouses':
        return <WarehousesScreen navigation={dummyNav} />;
      case 'StockMovements':
        return <StockMovementsScreen navigation={dummyNav} />;
      case 'Suppliers':
        return <SuppliersScreen navigation={dummyNav} />;
      case 'PurchaseOrders':
        return <PurchaseOrdersScreen navigation={dummyNav} />;
      case 'Customers':
        return <CustomersScreen navigation={dummyNav} />;
      case 'SalesOrders':
        return <SalesOrdersScreen navigation={dummyNav} />;
      case 'Invoices':
        return <InvoicesScreen navigation={dummyNav} />;
      case 'Accounts':
        return <AccountsScreen navigation={dummyNav} />;
      case 'JournalEntries':
        return <JournalEntriesScreen navigation={dummyNav} />;
      case 'Companies':
        return <CompaniesScreen navigation={dummyNav} />;
      case 'Branches':
        return <BranchesScreen navigation={dummyNav} />;
      case 'Users':
        return <UsersScreen navigation={dummyNav} />;
      case 'Roles':
        return <RolesScreen navigation={dummyNav} />;
      case 'Employees':
        return <EmployeesScreen navigation={dummyNav} />;
      case 'Payroll':
        return <PayrollScreen navigation={dummyNav} />;
      case 'Attendance':
        return <AttendanceScreen navigation={dummyNav} />;
      case 'Reports':
        return <ReportsScreen navigation={dummyNav} />;
      case 'Notifications':
        return <NotificationsScreen navigation={dummyNav} />;
      case 'Profile':
        return <ProfileView onBack={() => setCurrentRoute('Dashboard')} />;
      default:
        return <PlaceholderDashboard onNavigate={handleNavigate} />;
    }
  };

  const getBreadcrumbs = (route) => {
    const map = {
      Dashboard: ['SYS ERP', 'Dashboard'],
      Products: ['SYS ERP', 'Inventario', 'Productos'],
      Warehouses: ['SYS ERP', 'Inventario', 'Bodegas'],
      StockMovements: ['SYS ERP', 'Inventario', 'Movimientos Stock'],
      Suppliers: ['SYS ERP', 'Compras', 'Proveedores'],
      PurchaseOrders: ['SYS ERP', 'Compras', 'Órdenes de Compra'],
      Customers: ['SYS ERP', 'Ventas', 'Clientes'],
      SalesOrders: ['SYS ERP', 'Ventas', 'Órdenes de Venta'],
      Invoices: ['SYS ERP', 'Ventas', 'Facturas'],
      Accounts: ['SYS ERP', 'Finanzas', 'Catálogo de Cuentas'],
      JournalEntries: ['SYS ERP', 'Finanzas', 'Pólizas Contables'],
      Companies: ['SYS ERP', 'Administración', 'Empresas'],
      Branches: ['SYS ERP', 'Administración', 'Sucursales'],
      Users: ['SYS ERP', 'Administración', 'Usuarios'],
      Roles: ['SYS ERP', 'Administración', 'Roles'],
      Employees: ['SYS ERP', 'Recursos Humanos', 'Empleados'],
      Payroll: ['SYS ERP', 'Recursos Humanos', 'Nómina'],
      Attendance: ['SYS ERP', 'Recursos Humanos', 'Asistencia'],
      Reports: ['SYS ERP', 'Análisis', 'Reportes y BI'],
      Notifications: ['SYS ERP', 'Alertas', 'Notificaciones'],
      Profile: ['SYS ERP', 'Usuario', 'Mi Perfil'],
    };
    return map[route] || ['SYS ERP', route];
  };

  return (
    <MainLayout
      currentRoute={currentRoute}
      breadcrumbs={getBreadcrumbs(currentRoute)}
      onNavigate={handleNavigate}
    >
      {renderCurrentScreen()}
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  dashboardContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  dashboardContent: {
    padding: spacing.lg,
  },
  welcomeBanner: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  welcomeTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.extrabold,
    color: colors.surface,
  },
  welcomeSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.greenLight,
    marginTop: 4,
    fontWeight: typography.weights.medium,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  quickNavCard: {
    padding: spacing.lg,
  },
  quickNavTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  quickNavGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
