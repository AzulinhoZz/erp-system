import React, { useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, Modal, TouchableOpacity, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../store/themeStore';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function MainLayout({
  children,
  currentRoute = 'Dashboard',
  breadcrumbs = ['SYS ERP', 'Dashboard'],
  onNavigate,
  unreadNotificationsCount = 0,
}) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isMobile = width < 768;
  const colors = useThemeStore((s) => s.colors);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const dynamicStyles = getStyles(colors, insets);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={dynamicStyles.safeContainer}>
      <View style={dynamicStyles.shellContainer}>
        {!isMobile ? (
          <Sidebar
            currentRoute={currentRoute}
            onNavigate={onNavigate}
            isCollapsed={isCollapsed}
            onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          />
        ) : null}

        {isMobile ? (
          <Modal visible={mobileDrawerOpen} transparent animationType="fade">
            <View style={dynamicStyles.drawerBackdrop}>
              {Platform.OS === 'ios' ? (
                <BlurView intensity={45} tint="dark" style={StyleSheet.absoluteFill} />
              ) : null}
              <TouchableOpacity
                style={StyleSheet.absoluteFill}
                activeOpacity={1}
                onPress={() => setMobileDrawerOpen(false)}
              />
              <View style={dynamicStyles.drawerContent}>
                <Sidebar
                  currentRoute={currentRoute}
                  onNavigate={onNavigate}
                  isCollapsed={false}
                  onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
                />
              </View>
            </View>
          </Modal>
        ) : null}

        <View style={dynamicStyles.mainColumn}>
          <Header
            title={currentRoute}
            breadcrumbs={breadcrumbs}
            unreadNotificationsCount={unreadNotificationsCount}
            onToggleMobileDrawer={() => setMobileDrawerOpen(true)}
            onNavigate={onNavigate}
            isMobile={isMobile}
          />
          <View style={dynamicStyles.contentArea}>{children}</View>

          {isMobile ? (
            <View style={dynamicStyles.bottomDock}>
              {Platform.OS === 'ios' ? (
                <BlurView intensity={70} tint="light" style={StyleSheet.absoluteFill} />
              ) : null}
              <TouchableOpacity style={dynamicStyles.dockItem} onPress={() => onNavigate?.('Dashboard')}>
                <Text style={[dynamicStyles.dockIcon, currentRoute === 'Dashboard' && dynamicStyles.dockIconActive]}>⌂</Text>
                <Text style={[dynamicStyles.dockLabel, currentRoute === 'Dashboard' && dynamicStyles.dockLabelActive]}>Inicio</Text>
              </TouchableOpacity>
              <TouchableOpacity style={dynamicStyles.dockItem} onPress={() => onNavigate?.('Products')}>
                <Text style={[dynamicStyles.dockIcon, currentRoute === 'Products' && dynamicStyles.dockIconActive]}>◫</Text>
                <Text style={[dynamicStyles.dockLabel, currentRoute === 'Products' && dynamicStyles.dockLabelActive]}>Productos</Text>
              </TouchableOpacity>
              <TouchableOpacity style={dynamicStyles.addButton} onPress={() => onNavigate?.('SalesOrders')}>
                <Text style={dynamicStyles.addButtonText}>＋</Text>
              </TouchableOpacity>
              <TouchableOpacity style={dynamicStyles.dockItem} onPress={() => onNavigate?.('Reports')}>
                <Text style={[dynamicStyles.dockIcon, currentRoute === 'Reports' && dynamicStyles.dockIconActive]}>⌁</Text>
                <Text style={[dynamicStyles.dockLabel, currentRoute === 'Reports' && dynamicStyles.dockLabelActive]}>Reportes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={dynamicStyles.dockItem} onPress={() => setMobileDrawerOpen(true)}>
                <Text style={dynamicStyles.dockIcon}>☰</Text>
                <Text style={dynamicStyles.dockLabel}>Más</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors, insets) =>
  StyleSheet.create({
    safeContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    shellContainer: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: colors.background,
    },
    mainColumn: {
      flex: 1,
      flexDirection: 'column',
    },
    contentArea: {
      flex: 1,
      backgroundColor: colors.background,
      paddingBottom: Math.max(insets.bottom, 8),
    },
    bottomDock: {
      position: 'absolute',
      left: 12,
      right: 12,
      bottom: Math.max(insets.bottom, 8),
      height: 66,
      borderRadius: 26,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingHorizontal: 8,
      backgroundColor: colors.glassStrong || 'rgba(255,255,255,0.82)',
      borderWidth: 1,
      borderColor: colors.glassStroke || 'rgba(255,255,255,0.72)',
      overflow: 'hidden',
      shadowColor: '#102A43',
      shadowOpacity: 0.18,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 12,
      zIndex: 200,
    },
    dockItem: {
      width: 58,
      height: 54,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dockIcon: { fontSize: 19, color: colors.textMuted, fontWeight: '700' },
    dockIconActive: { color: colors.primary },
    dockLabel: { fontSize: 9, marginTop: 2, color: colors.textMuted, fontWeight: '600' },
    dockLabelActive: { color: colors.primary, fontWeight: '800' },
    addButton: {
      width: 54,
      height: 54,
      borderRadius: 27,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderWidth: 3,
      borderColor: 'rgba(255,255,255,0.82)',
      shadowColor: colors.primary,
      shadowOpacity: 0.35,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 5 },
    },
    addButtonText: { color: '#FFF', fontSize: 30, lineHeight: 32, fontWeight: '400' },
    drawerBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(3, 12, 24, 0.32)',
      flexDirection: 'row',
    },
    drawerContent: {
      width: '84%',
      maxWidth: 336,
      height: '100%',
      overflow: 'hidden',
      borderTopRightRadius: 28,
      borderBottomRightRadius: 28,
      backgroundColor: 'rgba(5, 31, 52, 0.88)',
    },
  });

export default MainLayout;
