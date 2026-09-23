import React, { useEffect } from 'react';
import { View, ActivityIndicator, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuthStore } from '../store/authStore';
import ModuleMenu from '../components/ModuleMenu';

// Core
import LoginScreen from '../screens/core/LoginScreen';
import UsersScreen from '../screens/core/UsersScreen';
import RolesScreen from '../screens/core/RolesScreen';
import CompaniesScreen from '../screens/core/CompaniesScreen';
import BranchesScreen from '../screens/core/BranchesScreen';
// Inventario
import ProductsScreen from '../screens/inventario/ProductsScreen';
import WarehousesScreen from '../screens/inventario/WarehousesScreen';
import StockMovementsScreen from '../screens/inventario/StockMovementsScreen';
// Compras
import SuppliersScreen from '../screens/compras/SuppliersScreen';
import PurchaseOrdersScreen from '../screens/compras/PurchaseOrdersScreen';
// Ventas
import CustomersScreen from '../screens/ventas/CustomersScreen';
import SalesOrdersScreen from '../screens/ventas/SalesOrdersScreen';
import InvoicesScreen from '../screens/ventas/InvoicesScreen';
// Finanzas
import AccountsScreen from '../screens/finanzas/AccountsScreen';
import JournalEntriesScreen from '../screens/finanzas/JournalEntriesScreen';
// RRHH
import EmployeesScreen from '../screens/rrhh/EmployeesScreen';
import PayrollScreen from '../screens/rrhh/PayrollScreen';
import AttendanceScreen from '../screens/rrhh/AttendanceScreen';
// Reportes y notificaciones (fase final)
import ReportsScreen from '../screens/reportes/ReportsScreen';
import NotificationsScreen from '../screens/notificaciones/NotificationsScreen';
import { Screen } from '../components/ui';
import { disconnectSocket } from '../services/sockets';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * Every module is a stack: menu (permission-filtered) → entity screens.
 * Screens render their own headers so the same tree works on web + native.
 */
function moduleStack(menuProps, screens) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={menuProps.name}>
        {(props) => (
          <ModuleMenu
            {...props}
            title={menuProps.title}
            subtitle={menuProps.subtitle}
            items={menuProps.items}
            onBack={props.navigation.canGoBack() ? () => props.navigation.goBack() : undefined}
          />
        )}
      </Stack.Screen>
      {screens.map(({ name, component, title }) => (
        <Stack.Screen key={name} name={name} component={component} options={{ title }} />
      ))}
    </Stack.Navigator>
  );
}

const CORE_ITEMS = [
  { key: 'users', title: 'Usuarios', subtitle: 'Alta, baja y rol de cada usuario', screen: 'Users', permission: 'users:read' },
  { key: 'roles', title: 'Roles y permisos', subtitle: 'RBAC: permisos por rol', screen: 'Roles', permission: 'roles:read' },
  { key: 'companies', title: 'Empresas', subtitle: 'Multi-tenant', screen: 'Companies', permission: 'companies:read' },
  { key: 'branches', title: 'Sucursales', subtitle: 'Ubicaciones de la empresa', screen: 'Branches', permission: 'branches:read' },
];

const INVENTARIO_ITEMS = [
  { key: 'products', title: 'Productos', subtitle: 'Catálogo, costo, precio y stock', screen: 'Products', permission: 'products:read' },
  { key: 'warehouses', title: 'Bodegas', subtitle: 'Almacenes por sucursal', screen: 'Warehouses', permission: 'stock:read' },
  { key: 'movements', title: 'Movimientos', subtitle: 'Entradas y salidas de stock', screen: 'StockMovements', permission: 'stock:read' },
];

const COMPRAS_ITEMS = [
  { key: 'suppliers', title: 'Proveedores', subtitle: 'Contacto y RFC', screen: 'Suppliers', permission: 'suppliers:read' },
  { key: 'purchaseOrders', title: 'Órdenes de compra', subtitle: 'Crear y recibir (entra stock)', screen: 'PurchaseOrders', permission: 'purchaseOrders:read' },
];

const VENTAS_ITEMS = [
  { key: 'customers', title: 'Clientes', subtitle: 'Contacto, RFC y línea de crédito', screen: 'Customers', permission: 'customers:read' },
  { key: 'salesOrders', title: 'Órdenes de venta', subtitle: 'Confirmar (sale stock)', screen: 'SalesOrders', permission: 'salesOrders:read' },
  { key: 'invoices', title: 'Facturas', subtitle: 'Timbrar y control de cobro', screen: 'Invoices', permission: 'invoices:read' },
];

const FINANZAS_ITEMS = [
  { key: 'accounts', title: 'Catálogo de cuentas', subtitle: 'Partida doble por empresa', screen: 'Accounts', permission: 'accounts:read' },
  { key: 'journalEntries', title: 'Pólizas contables', subtitle: 'Asientos manuales (debe = haber)', screen: 'JournalEntries', permission: 'journalEntries:read' },
];

const RRHH_ITEMS = [
  { key: 'employees', title: 'Empleados', subtitle: 'Altas, puestos y salarios', screen: 'Employees', permission: 'employees:read' },
  { key: 'payroll', title: 'Nómina', subtitle: 'Correr periodo: bruto − deducciones', screen: 'Payroll', permission: 'payroll:read' },
  { key: 'attendance', title: 'Asistencia', subtitle: 'Entradas y salidas por día', screen: 'Attendance', permission: 'attendance:read' },
];

function CoreStack() {
  return moduleStack(
    { name: 'CoreMenu', title: 'Configuración', subtitle: 'Empresa, usuarios y accesos', items: CORE_ITEMS },
    [
      { name: 'Users', component: UsersScreen, title: 'Usuarios' },
      { name: 'Roles', component: RolesScreen, title: 'Roles' },
      { name: 'Companies', component: CompaniesScreen, title: 'Empresas' },
      { name: 'Branches', component: BranchesScreen, title: 'Sucursales' },
    ]
  );
}

function InventarioStack() {
  return moduleStack(
    { name: 'InvMenu', title: 'Inventario', subtitle: 'Productos, bodegas y movimientos', items: INVENTARIO_ITEMS },
    [
      { name: 'Products', component: ProductsScreen, title: 'Productos' },
      { name: 'Warehouses', component: WarehousesScreen, title: 'Bodegas' },
      { name: 'StockMovements', component: StockMovementsScreen, title: 'Movimientos' },
    ]
  );
}

function ComprasStack() {
  return moduleStack(
    { name: 'ComprasMenu', title: 'Compras', subtitle: 'Proveedores y órdenes de compra', items: COMPRAS_ITEMS },
    [
      { name: 'Suppliers', component: SuppliersScreen, title: 'Proveedores' },
      { name: 'PurchaseOrders', component: PurchaseOrdersScreen, title: 'Órdenes de compra' },
    ]
  );
}

function VentasStack() {
  return moduleStack(
    { name: 'VentasMenu', title: 'Ventas', subtitle: 'Clientes, órdenes y facturas', items: VENTAS_ITEMS },
    [
      { name: 'Customers', component: CustomersScreen, title: 'Clientes' },
      { name: 'SalesOrders', component: SalesOrdersScreen, title: 'Órdenes de venta' },
      { name: 'Invoices', component: InvoicesScreen, title: 'Facturas' },
    ]
  );
}

function FinanzasStack() {
  return moduleStack(
    { name: 'FinanzasMenu', title: 'Finanzas', subtitle: 'Cuentas y pólizas contables', items: FINANZAS_ITEMS },
    [
      { name: 'Accounts', component: AccountsScreen, title: 'Catálogo de cuentas' },
      { name: 'JournalEntries', component: JournalEntriesScreen, title: 'Pólizas' },
    ]
  );
}

function RRHHStack() {
  return moduleStack(
    { name: 'RRHHMenu', title: 'RRHH', subtitle: 'Empleados, nómina y asistencia', items: RRHH_ITEMS },
    [
      { name: 'Employees', component: EmployeesScreen, title: 'Empleados' },
      { name: 'Payroll', component: PayrollScreen, title: 'Nómina' },
      { name: 'Attendance', component: AttendanceScreen, title: 'Asistencia' },
    ]
  );
}

function ProfileScreen({ navigation }) {
  const user = useAuthStore((s) => s.user);
  const company = useAuthStore((s) => s.company);
  const logout = useAuthStore((s) => s.logout);

  return (
    <Screen
      title="Mi perfil"
      subtitle={user?.role?.name}
      onBack={() => navigation.goBack()}
    >
      <View style={styles.profile}>
        <Text style={styles.profileName}>{user?.name}</Text>
        <Text style={styles.profileEmail}>{user?.email}</Text>
        <Text style={styles.profileRole}>{user?.role?.name}</Text>
        {company?.name ? <Text style={styles.profileCompany}>{company.name}</Text> : null}
        <TouchableOpacity onPress={logout} style={styles.logout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const SESSION_ITEMS = [
  { key: 'profile', title: 'Mi perfil', subtitle: 'Datos de la sesión y cierre', screen: 'Profile' },
  { key: 'notifications', title: 'Notificaciones', subtitle: 'Alertas de negocio en vivo', screen: 'Notifications' },
];

function SessionStack() {
  return moduleStack(
    { name: 'SessionMenu', title: 'Sesión', subtitle: 'Perfil y notificaciones', items: SESSION_ITEMS },
    [
      { name: 'Profile', component: ProfileScreen, title: 'Mi perfil' },
      { name: 'Notifications', component: NotificationsScreen, title: 'Notificaciones' },
    ]
  );
}

function tabVisible(permission) {
  const can = useAuthStore((s) => s.can);
  return can('*') || can(permission);
}

export default function RootNavigator() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const user = useAuthStore((s) => s.user);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // No session → close the real-time channel
  useEffect(() => {
    if (!user) disconnectSocket();
  }, [user]);

  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Main">
          {() => (
            <Tab.Navigator
              screenOptions={{
                headerStyle: { backgroundColor: '#1d4ed8' },
                headerTintColor: '#fff',
                tabBarActiveTintColor: '#1d4ed8',
              }}
            >
              <Tab.Screen name="Core" component={CoreStack} options={{ title: 'Config', headerShown: false }} />
              <Tab.Screen name="Inventario" component={InventarioStack} options={{ headerShown: false }} />
              {tabVisible('suppliers:read') && (
                <Tab.Screen name="Compras" component={ComprasStack} options={{ headerShown: false }} />
              )}
              {tabVisible('customers:read') && (
                <Tab.Screen name="Ventas" component={VentasStack} options={{ headerShown: false }} />
              )}
              {tabVisible('accounts:read') && (
                <Tab.Screen name="Finanzas" component={FinanzasStack} options={{ headerShown: false }} />
              )}
              {tabVisible('employees:read') && (
                <Tab.Screen name="RRHH" component={RRHHStack} options={{ headerShown: false }} />
              )}
              {tabVisible('reports:read') && (
                <Tab.Screen name="Reportes" component={ReportsScreen} options={{ headerShown: false }} />
              )}
              <Tab.Screen name="Sesión" component={SessionStack} options={{ headerShown: false }} />
            </Tab.Navigator>
          )}
        </Stack.Screen>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logout: {
    marginTop: 16,
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: { color: '#fff', fontWeight: '600' },
  profile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 24,
    marginVertical: 8,
  },
  profileName: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  profileEmail: { fontSize: 14, color: '#64748b', marginTop: 4 },
  profileRole: {
    fontSize: 13,
    color: '#1d4ed8',
    fontWeight: '600',
    marginTop: 8,
    backgroundColor: '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  profileCompany: { fontSize: 13, color: '#475569', marginTop: 6 },
});
