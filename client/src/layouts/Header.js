import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { typography, spacing, radius, shadows } from '../theme';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { companiesService } from '../services/resources';
import { apiErrorMessage } from '../services/api';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';

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
      setCompaniesList(Array.isArray(res) ? res : res.items || []);
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

  const s = getStyles(colors, isMobile);

  return (
    <View style={s.headerWrap}>
      {Platform.OS === 'ios' ? <BlurView intensity={55} tint={isDarkMode ? 'dark' : 'light'} style={StyleSheet.absoluteFill} /> : null}
      <View style={s.headerContainer}>
        <View style={s.leftSection}>
          {isMobile && onToggleMobileDrawer ? (
            <TouchableOpacity style={s.iconBtn} onPress={onToggleMobileDrawer}>
              <Text style={s.menuGlyph}>☰</Text>
            </TouchableOpacity>
          ) : null}
          <View style={s.titleContainer}>
            {!isMobile ? (
              <View style={s.breadcrumbsRow}>
                {breadcrumbs.map((crumb, i) => (
                  <React.Fragment key={crumb + i}>
                    <Text style={s.crumbText}>{crumb}</Text>
                    {i < breadcrumbs.length - 1 ? <Text style={s.crumbSeparator}> / </Text> : null}
                  </React.Fragment>
                ))}
              </View>
            ) : (
              <Text style={s.brandMini}>SYS ERP</Text>
            )}
            <Text style={s.currentTitle} numberOfLines={1}>{title}</Text>
          </View>
        </View>

        <View style={s.rightSection}>
          <TouchableOpacity style={s.companyBadge} onPress={handleOpenCompanyModal} activeOpacity={0.8}>
            <Text style={s.companyIcon}>▦</Text>
            <Text style={s.companyName} numberOfLines={1}>{company?.name || 'Empresa Activa'}</Text>
            <Text style={s.dropdownArrow}>⌄</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.iconBtn} onPress={toggleDarkMode}>
            <Text style={s.themeIcon}>{isDarkMode ? '☀' : '◐'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.iconBtn}
            onPress={onOpenNotifications || (() => onNavigate?.('Notifications'))}
          >
            <Text style={s.bellIcon}>◔</Text>
            {unreadNotificationsCount > 0 ? (
              <View style={s.unreadBadge}>
                <Text style={s.unreadCount}>{unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>

          <TouchableOpacity style={s.userTrigger} onPress={() => setUserMenuOpen(true)}>
            <Avatar name={user?.name || 'User'} size={34} />
            {!isMobile ? (
              <View style={s.userTextContainer}>
                <Text style={s.userName} numberOfLines={1}>{user?.name || 'Alexis'}</Text>
                <Text style={s.userRole} numberOfLines={1}>{user?.role?.name || 'Administrador'}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={companyMenuOpen} transparent animationType="fade">
        <View style={s.modalOverlay}>
          {Platform.OS === 'ios' ? <BlurView intensity={45} tint="dark" style={StyleSheet.absoluteFill} /> : null}
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setCompanyMenuOpen(false)} />
          <View style={[s.companyModalCard, shadows.lg]}>
            {Platform.OS === 'ios' ? <BlurView intensity={70} tint={isDarkMode ? 'dark' : 'light'} style={StyleSheet.absoluteFill} /> : null}
            <View style={s.companyModalHeader}>
              <Text style={s.companyModalTitle}>Contexto de empresa</Text>
              <TouchableOpacity onPress={() => setCompanyMenuOpen(false)}><Text style={s.closeIcon}>×</Text></TouchableOpacity>
            </View>
            <View style={s.activeCompanyBanner}>
              <Text style={s.companyIconLarge}>▦</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.activeCompanyLabel}>EMPRESA ACTIVA</Text>
                <Text style={s.activeCompanyName}>{company?.name || 'Empresa Demo'}</Text>
                <Text style={s.activeCompanyTaxId}>RFC: {company?.taxId || 'DEMO010101XXX'}</Text>
              </View>
              <Badge label="En uso" variant="success" dot />
            </View>

            {canSwitchCompany ? (
              <View style={s.switchSection}>
                <Text style={s.switchTitle}>Cambiar empresa</Text>
                {loadingCompanies ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.md }} />
                ) : companyError ? (
                  <Text style={s.errorText}>{companyError}</Text>
                ) : (
                  <FlatList
                    data={companiesList}
                    keyExtractor={(item) => item._id || item.id}
                    style={s.companiesList}
                    renderItem={({ item }) => {
                      const isSelected = (item._id || item.id) === (company?._id || company?.id);
                      return (
                        <TouchableOpacity
                          style={[s.companyOptionRow, isSelected && s.companyOptionSelected]}
                          onPress={() => handleSelectCompany(item)}
                          disabled={switchingCompany}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={[s.companyOptionName, isSelected && s.companyOptionNameSelected]}>{item.name}</Text>
                            <Text style={s.companyOptionTaxId}>RFC: {item.taxId}</Text>
                          </View>
                          {isSelected ? <Badge label="Activa" variant="success" /> : <Text style={s.selectText}>Elegir ›</Text>}
                        </TouchableOpacity>
                      );
                    }}
                  />
                )}
              </View>
            ) : (
              <Text style={s.noPermText}>Tu rol está asignado a {company?.name}. No tienes permiso para cambiar de empresa.</Text>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={userMenuOpen} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setUserMenuOpen(false)} />
          <View style={[s.menuDropdown, shadows.md]}>
            {Platform.OS === 'ios' ? <BlurView intensity={75} tint={isDarkMode ? 'dark' : 'light'} style={StyleSheet.absoluteFill} /> : null}
            <View style={s.userMenuHeader}>
              <Text style={s.userMenuName}>{user?.name}</Text>
              <Text style={s.userMenuEmail}>{user?.email}</Text>
              <Badge label={user?.role?.name || 'Rol'} variant="info" style={{ marginTop: 4 }} />
            </View>
            <View style={s.dropdownDivider} />
            <TouchableOpacity style={s.dropdownItem} onPress={toggleDarkMode}>
              <Text style={s.dropdownItemIcon}>{isDarkMode ? '☀' : '◐'}</Text>
              <Text style={s.dropdownItemText}>{isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.dropdownItem} onPress={() => { setUserMenuOpen(false); onNavigate?.('Profile'); }}>
              <Text style={s.dropdownItemIcon}>●</Text><Text style={s.dropdownItemText}>Mi Perfil</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.dropdownItem} onPress={() => { setUserMenuOpen(false); onNavigate?.('Notifications'); }}>
              <Text style={s.dropdownItemIcon}>◔</Text><Text style={s.dropdownItemText}>Notificaciones</Text>
            </TouchableOpacity>
            <View style={s.dropdownDivider} />
            <TouchableOpacity style={s.dropdownItem} onPress={() => { setUserMenuOpen(false); logout(); }}>
              <Text style={s.dropdownItemIcon}>↗</Text><Text style={s.dropdownItemDangerText}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors, isMobile) => StyleSheet.create({
  headerWrap: {
    backgroundColor: colors.glassStrong || colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.glassStroke || colors.border,
    overflow: 'visible',
    zIndex: 100,
  },
  headerContainer: {
    minHeight: isMobile ? 62 : 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: isMobile ? 10 : spacing.lg,
  },
  leftSection: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 },
  titleContainer: { flex: 1, justifyContent: 'center', minWidth: 0, marginLeft: isMobile ? 6 : 0 },
  brandMini: { fontSize: 9, color: colors.textSecondary, letterSpacing: 0.8, fontWeight: '700' },
  breadcrumbsRow: { flexDirection: 'row', alignItems: 'center' },
  crumbText: { fontSize: 10, color: colors.textSecondary, fontWeight: '600' },
  crumbSeparator: { fontSize: 10, color: colors.textMuted },
  currentTitle: { fontSize: isMobile ? 17 : 19, fontWeight: '800', color: colors.text, marginTop: isMobile ? 0 : -1 },
  rightSection: { flexDirection: 'row', alignItems: 'center', gap: isMobile ? 6 : spacing.sm, marginLeft: 6 },
  companyBadge: {
    maxWidth: isMobile ? 112 : 180, height: 38, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: isMobile ? 9 : spacing.md, borderRadius: 19,
    backgroundColor: colors.glassBackground || colors.surfaceSelected,
    borderWidth: 1, borderColor: colors.glassStroke || colors.border,
  },
  companyIcon: { color: colors.primary, marginRight: 5, fontWeight: '800' },
  companyName: { flexShrink: 1, fontSize: isMobile ? 11 : 12, fontWeight: '700', color: colors.text },
  dropdownArrow: { color: colors.textSecondary, marginLeft: 4, fontSize: 11 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.glassBackground || colors.surfaceSelected,
    borderWidth: 1, borderColor: colors.glassStroke || colors.border,
  },
  menuGlyph: { fontSize: 18, color: colors.text, fontWeight: '700' },
  bellIcon: { fontSize: 18, color: colors.text },
  themeIcon: { fontSize: 18, color: colors.text },
  unreadBadge: { position: 'absolute', top: 2, right: 2, minWidth: 15, height: 15, borderRadius: 8, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  unreadCount: { color: '#FFF', fontSize: 8, fontWeight: '800' },
  userTrigger: { width: 38, height: 38, borderRadius: 19, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  userTextContainer: { marginLeft: 7 },
  userName: { fontSize: 12, fontWeight: '700', color: colors.text },
  userRole: { fontSize: 10, color: colors.textSecondary },

  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center', padding: spacing.md },
  companyModalCard: {
    width: '100%', maxWidth: 520, maxHeight: '80%', overflow: 'hidden',
    backgroundColor: colors.glassStrong || colors.surface,
    borderRadius: 28, padding: spacing.lg, borderWidth: 1, borderColor: colors.glassStroke || colors.border,
  },
  companyModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  companyModalTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  closeIcon: { fontSize: 26, color: colors.textMuted },
  activeCompanyBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primarySubtle, borderRadius: 20, padding: spacing.md, borderWidth: 1, borderColor: colors.infoBorder, marginBottom: spacing.lg },
  companyIconLarge: { fontSize: 28, color: colors.primary, marginRight: spacing.md },
  activeCompanyLabel: { fontSize: 9, fontWeight: '800', color: colors.primary, letterSpacing: 0.9 },
  activeCompanyName: { fontSize: 16, fontWeight: '800', color: colors.text },
  activeCompanyTaxId: { fontSize: 11, color: colors.textSecondary },
  switchSection: { marginTop: spacing.xs },
  switchTitle: { fontSize: 10, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.8, marginBottom: spacing.xs },
  companiesList: { maxHeight: 240 },
  companyOptionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.md, borderRadius: 18, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.xs, backgroundColor: colors.glassBackground || colors.surface },
  companyOptionSelected: { backgroundColor: colors.primarySubtle, borderColor: colors.primary },
  companyOptionName: { fontSize: 13, fontWeight: '700', color: colors.text },
  companyOptionNameSelected: { color: colors.primary },
  companyOptionTaxId: { fontSize: 11, color: colors.textSecondary },
  selectText: { fontSize: 11, color: colors.primary, fontWeight: '700' },
  noPermText: { fontSize: 11, color: colors.textSecondary, textAlign: 'center', padding: spacing.md },
  errorText: { fontSize: 11, color: colors.danger, marginVertical: spacing.sm },

  menuDropdown: {
    position: 'absolute', top: isMobile ? 72 : 82, right: 12, width: 260,
    borderRadius: 24, overflow: 'hidden', padding: spacing.sm,
    backgroundColor: colors.glassStrong || colors.surface,
    borderWidth: 1, borderColor: colors.glassStroke || colors.border,
  },
  userMenuHeader: { padding: spacing.sm },
  userMenuName: { fontSize: 15, fontWeight: '800', color: colors.text },
  userMenuEmail: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  dropdownDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 4 },
  dropdownItem: { minHeight: 42, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, borderRadius: 14 },
  dropdownItemIcon: { width: 24, color: colors.text, fontWeight: '700' },
  dropdownItemText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  dropdownItemDangerText: { color: colors.danger, fontSize: 13, fontWeight: '700' },
});

export default Header;
