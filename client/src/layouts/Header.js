import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { typography, spacing, radius, shadows } from '../theme';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { companiesService } from '../services/resources';
import { apiErrorMessage } from '../services/api';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';

/**
 * Enterprise Header component with Dark Mode Toggle & Company Context Selector.
 */
export function Header({
  title = 'Dashboard',
  breadcrumbs = ['SYS ERP', 'Dashboard'],
  unreadNotificationsCount = 0,
  onOpenNotifications,
  onToggleMobileDrawer,
  onNavigate,
  isMobile = false,
}) {
  const user = useAuthStore((s) => s.user);
  const company = useAuthStore((s) => s.company);
  const switchCompany = useAuthStore((s) => s.switchCompany);
  const logout = useAuthStore((s) => s.logout);
  const can = useAuthStore((s) => s.can);

  const colors = useThemeStore((s) => s.colors);
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const toggleDarkMode = useThemeStore((s) => s.toggleDarkMode);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [companyMenuOpen, setCompanyMenuOpen] = useState(false);

  const [companiesList, setCompaniesList] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [switchingCompany, setSwitchingCompany] = useState(false);
  const [companyError, setCompanyError] = useState('');

  const canSwitchCompany = can('*') || can('companies:read');

  const fetchCompanies = async () => {
    if (!canSwitchCompany) return;
    setLoadingCompanies(true);
    setCompanyError('');
    try {
      const res = await companiesService.list();
      const items = Array.isArray(res) ? res : res.items || [];
      setCompaniesList(items);
    } catch (err) {
      setCompanyError(apiErrorMessage(err));
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleOpenCompanyModal = () => {
    setCompanyMenuOpen(true);
    fetchCompanies();
  };

  const handleSelectCompany = async (selectedComp) => {
    if ((selectedComp._id || selectedComp.id) === (company?._id || company?.id)) {
      setCompanyMenuOpen(false);
      return;
    }
    setSwitchingCompany(true);
    try {
      switchCompany(selectedComp);
      setCompanyMenuOpen(false);
    } catch (err) {
      setCompanyError(apiErrorMessage(err));
    } finally {
      setSwitchingCompany(false);
    }
  };

  const dynamicStyles = getStyles(colors);

  return (
    <View style={dynamicStyles.headerContainer}>
      {/* Left Area: Mobile Drawer Toggle & Title/Breadcrumbs */}
      <View style={dynamicStyles.leftSection}>
        {isMobile && onToggleMobileDrawer ? (
          <TouchableOpacity
            style={dynamicStyles.mobileMenuBtn}
            onPress={onToggleMobileDrawer}
          >
            <Text style={dynamicStyles.hamburgerIcon}>☰</Text>
          </TouchableOpacity>
        ) : null}

        <View style={dynamicStyles.titleContainer}>
          <View style={dynamicStyles.breadcrumbsRow}>
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                <Text style={dynamicStyles.crumbText}>{crumb}</Text>
                {i < breadcrumbs.length - 1 ? (
                  <Text style={dynamicStyles.crumbSeparator}> / </Text>
                ) : null}
              </React.Fragment>
            ))}
          </View>
          <Text style={dynamicStyles.currentTitle}>{title}</Text>
        </View>
      </View>

      {/* Right Area: Company Selector, Theme Toggle, Notifications, User Profile */}
      <View style={dynamicStyles.rightSection}>
        {/* Company Context Badge Trigger */}
        <TouchableOpacity
          style={dynamicStyles.companyBadge}
          onPress={handleOpenCompanyModal}
          activeOpacity={0.7}
        >
          <Text style={dynamicStyles.companyIcon}>🏢</Text>
          <Text style={dynamicStyles.companyName} numberOfLines={1}>
            {company?.name || 'Empresa Activa'}
          </Text>
          <Text style={dynamicStyles.dropdownArrow}>▼</Text>
        </TouchableOpacity>

        {/* Dark Mode Toggle Button */}
        <TouchableOpacity
          style={dynamicStyles.iconBtn}
          onPress={toggleDarkMode}
          activeOpacity={0.7}
        >
          <Text style={dynamicStyles.themeIcon}>{isDarkMode ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>

        {/* Notifications Icon with Badge */}
        <TouchableOpacity
          style={dynamicStyles.iconBtn}
          onPress={onOpenNotifications || (() => onNavigate && onNavigate('Notifications'))}
          activeOpacity={0.7}
        >
          <Text style={dynamicStyles.bellIcon}>🔔</Text>
          {unreadNotificationsCount > 0 ? (
            <View style={dynamicStyles.unreadBadge}>
              <Text style={dynamicStyles.unreadCount}>
                {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>

        {/* User Profile Trigger */}
        <TouchableOpacity
          style={dynamicStyles.userTrigger}
          onPress={() => setUserMenuOpen(true)}
          activeOpacity={0.7}
        >
          <Avatar name={user?.name || 'User'} size={34} />
          {!isMobile ? (
            <View style={dynamicStyles.userTextContainer}>
              <Text style={dynamicStyles.userName} numberOfLines={1}>
                {user?.name || 'Alexis'}
              </Text>
              <Text style={dynamicStyles.userRole} numberOfLines={1}>
                {user?.role?.name || 'Administrador'}
              </Text>
            </View>
          ) : null}
          <Text style={dynamicStyles.dropdownArrow}>▼</Text>
        </TouchableOpacity>
      </View>

      {/* Company Context Switcher Modal */}
      <Modal visible={companyMenuOpen} transparent animationType="fade">
        <TouchableOpacity
          style={dynamicStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCompanyMenuOpen(false)}
        >
          <View style={[dynamicStyles.companyModalCard, shadows.lg]}>
            <View style={dynamicStyles.companyModalHeader}>
              <Text style={dynamicStyles.companyModalTitle}>Contexto de Empresa (Multi-Tenant)</Text>
              <TouchableOpacity onPress={() => setCompanyMenuOpen(false)}>
                <Text style={dynamicStyles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={dynamicStyles.activeCompanyBanner}>
              <Text style={dynamicStyles.companyIconLarge}>🏢</Text>
              <View style={{ flex: 1 }}>
                <Text style={dynamicStyles.activeCompanyLabel}>EMPRESA ACTIVA ACTUAL</Text>
                <Text style={dynamicStyles.activeCompanyName}>{company?.name || 'Empresa Demo'}</Text>
                <Text style={dynamicStyles.activeCompanyTaxId}>RFC: {company?.taxId || 'DEMO010101XXX'}</Text>
              </View>
              <Badge label="En uso" variant="success" dot />
            </View>

            {canSwitchCompany ? (
              <View style={dynamicStyles.switchSection}>
                <Text style={dynamicStyles.switchTitle}>Cambiar Contexto de Empresa</Text>
                {loadingCompanies ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.md }} />
                ) : companyError ? (
                  <Text style={dynamicStyles.errorText}>{companyError}</Text>
                ) : (
                  <FlatList
                    data={companiesList}
                    keyExtractor={(item) => item._id || item.id}
                    style={dynamicStyles.companiesList}
                    renderItem={({ item }) => {
                      const isSelected = (item._id || item.id) === (company?._id || company?.id);
                      return (
                        <TouchableOpacity
                          style={[dynamicStyles.companyOptionRow, isSelected && dynamicStyles.companyOptionSelected]}
                          onPress={() => handleSelectCompany(item)}
                          disabled={switchingCompany}
                          activeOpacity={0.7}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={[dynamicStyles.companyOptionName, isSelected && dynamicStyles.companyOptionNameSelected]}>
                              {item.name}
                            </Text>
                            <Text style={dynamicStyles.companyOptionTaxId}>RFC: {item.taxId}</Text>
                          </View>
                          {isSelected ? (
                            <Badge label="Activa ✓" variant="success" />
                          ) : (
                            <Text style={dynamicStyles.selectText}>Seleccionar ›</Text>
                          )}
                        </TouchableOpacity>
                      );
                    }}
                  />
                )}
              </View>
            ) : (
              <Text style={dynamicStyles.noPermText}>
                🔒 Tu rol está asignado exclusivamente a {company?.name}. Para gestionar múltiples empresas se requiere permiso empresas.
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* User Profile Dropdown Menu */}
      <Modal visible={userMenuOpen} transparent animationType="fade">
        <TouchableOpacity
          style={dynamicStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setUserMenuOpen(false)}
        >
          <View style={[dynamicStyles.menuDropdown, shadows.md, { top: 60, right: 16 }]}>
            <View style={dynamicStyles.userMenuHeader}>
              <Text style={dynamicStyles.userMenuName}>{user?.name}</Text>
              <Text style={dynamicStyles.userMenuEmail}>{user?.email}</Text>
              <Badge label={user?.role?.name || 'Rol'} variant="info" style={{ marginTop: 4 }} />
            </View>
            <View style={dynamicStyles.dropdownDivider} />
            <TouchableOpacity
              style={dynamicStyles.dropdownItem}
              onPress={toggleDarkMode}
            >
              <Text style={dynamicStyles.dropdownItemIcon}>{isDarkMode ? '☀️' : '🌙'}</Text>
              <Text style={dynamicStyles.dropdownItemText}>
                {isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={dynamicStyles.dropdownItem}
              onPress={() => {
                setUserMenuOpen(false);
                if (onNavigate) onNavigate('Profile');
              }}
            >
              <Text style={dynamicStyles.dropdownItemIcon}>👤</Text>
              <Text style={dynamicStyles.dropdownItemText}>Mi Perfil</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={dynamicStyles.dropdownItem}
              onPress={() => {
                setUserMenuOpen(false);
                if (onNavigate) onNavigate('Notifications');
              }}
            >
              <Text style={dynamicStyles.dropdownItemIcon}>🔔</Text>
              <Text style={dynamicStyles.dropdownItemText}>Notificaciones</Text>
            </TouchableOpacity>
            <View style={dynamicStyles.dropdownDivider} />
            <TouchableOpacity
              style={[dynamicStyles.dropdownItem, dynamicStyles.dropdownItemDanger]}
              onPress={() => {
                setUserMenuOpen(false);
                logout();
              }}
            >
              <Text style={dynamicStyles.dropdownItemIcon}>🚪</Text>
              <Text style={dynamicStyles.dropdownItemDangerText}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    headerContainer: {
      height: 64,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      zIndex: 100,
      ...shadows.sm,
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    mobileMenuBtn: {
      padding: spacing.xs,
      marginRight: spacing.sm,
    },
    hamburgerIcon: {
      fontSize: typography.sizes.xl,
      color: colors.primary,
    },
    titleContainer: {
      justifyContent: 'center',
    },
    breadcrumbsRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    crumbText: {
      fontSize: typography.sizes.xs - 1,
      color: colors.textSecondary,
      fontWeight: typography.weights.medium,
    },
    crumbSeparator: {
      fontSize: typography.sizes.xs - 1,
      color: colors.textMuted,
    },
    currentTitle: {
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
      color: colors.text,
      marginTop: -2,
    },
    rightSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    companyBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceSelected,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.full,
    },
    companyIcon: {
      fontSize: typography.sizes.sm,
      marginRight: spacing.xs,
    },
    companyName: {
      fontSize: typography.sizes.xs,
      fontWeight: typography.weights.semibold,
      color: colors.text,
      maxWidth: 140,
    },
    dropdownArrow: {
      fontSize: 9,
      color: colors.textSecondary,
      marginLeft: spacing.xs,
    },
    iconBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.surfaceSelected,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      borderWidth: 1,
      borderColor: colors.border,
    },
    bellIcon: {
      fontSize: typography.sizes.md,
    },
    themeIcon: {
      fontSize: typography.sizes.md,
    },
    unreadBadge: {
      position: 'absolute',
      top: 2,
      right: 2,
      backgroundColor: colors.danger,
      borderRadius: 8,
      paddingHorizontal: 4,
      paddingVertical: 1,
      minWidth: 16,
      alignItems: 'center',
    },
    unreadCount: {
      color: colors.textInverse,
      fontSize: 9,
      fontWeight: typography.weights.bold,
    },
    userTrigger: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: spacing.xs,
    },
    userTextContainer: {
      marginLeft: spacing.xs + 2,
    },
    userName: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.bold,
      color: colors.text,
    },
    userRole: {
      fontSize: typography.sizes.xs - 1,
      color: colors.textSecondary,
    },

    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.md,
    },
    companyModalCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      width: '100%',
      maxWidth: 520,
      maxHeight: '80%',
      borderWidth: 1,
      borderColor: colors.border,
    },
    companyModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    companyModalTitle: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.bold,
      color: colors.text,
    },
    closeIcon: {
      fontSize: typography.sizes.md,
      color: colors.textMuted,
      fontWeight: typography.weights.bold,
    },
    activeCompanyBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primarySubtle,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.primary,
      marginBottom: spacing.lg,
    },
    companyIconLarge: {
      fontSize: 32,
      marginRight: spacing.md,
    },
    activeCompanyLabel: {
      fontSize: typography.sizes.xs - 2,
      fontWeight: typography.weights.bold,
      color: colors.primary,
      letterSpacing: 0.5,
    },
    activeCompanyName: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.extrabold,
      color: colors.text,
    },
    activeCompanyTaxId: {
      fontSize: typography.sizes.xs,
      color: colors.textSecondary,
    },
    switchSection: {
      marginTop: spacing.xs,
    },
    switchTitle: {
      fontSize: typography.sizes.xs,
      fontWeight: typography.weights.bold,
      color: colors.textMuted,
      textTransform: 'uppercase',
      marginBottom: spacing.xs,
    },
    companiesList: {
      maxHeight: 240,
    },
    companyOptionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.xs,
      backgroundColor: colors.surface,
    },
    companyOptionSelected: {
      backgroundColor: colors.surfaceSelected,
      borderColor: colors.primary,
    },
    companyOptionName: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.bold,
      color: colors.text,
    },
    companyOptionNameSelected: {
      color: colors.primary,
    },
    companyOptionTaxId: {
      fontSize: typography.sizes.xs,
      color: colors.textSecondary,
    },
    selectText: {
      fontSize: typography.sizes.xs,
      color: colors.primary,
      fontWeight: typography.weights.bold,
    },
    noPermText: {
      fontSize: typography.sizes.xs,
      color: colors.textSecondary,
      textAlign: 'center',
      padding: spacing.md,
    },
    errorText: {
      fontSize: typography.sizes.xs,
      color: colors.danger,
      marginVertical: spacing.sm,
    },

    menuDropdown: {
      position: 'absolute',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      minWidth: 220,
    },
    userMenuHeader: {
      marginBottom: spacing.xs,
    },
    userMenuName: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.bold,
      color: colors.text,
    },
    userMenuEmail: {
      fontSize: typography.sizes.xs,
      color: colors.textSecondary,
    },
    dropdownDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: spacing.xs + 2,
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderRadius: radius.sm,
    },
    dropdownItemIcon: {
      fontSize: typography.sizes.md,
      marginRight: spacing.sm,
    },
    dropdownItemText: {
      fontSize: typography.sizes.sm,
      color: colors.text,
      fontWeight: typography.weights.medium,
    },
    dropdownItemDanger: {
      marginTop: spacing.xs,
    },
    dropdownItemDangerText: {
      fontSize: typography.sizes.sm,
      color: colors.danger,
      fontWeight: typography.weights.semibold,
    },
  });

export default Header;
