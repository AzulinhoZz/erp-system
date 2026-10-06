import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  useWindowDimensions,
  Modal,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

/**
 * Main Enterprise Shell Layout for SYS ERP.
 *
 * Combines Sidebar + Header + Main Content Area.
 */
export function MainLayout({
  children,
  currentRoute = 'Dashboard',
  breadcrumbs = ['SYS ERP', 'Dashboard'],
  onNavigate,
  unreadNotificationsCount = 0,
}) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const colors = useThemeStore((s) => s.colors);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const dynamicStyles = getStyles(colors);

  return (
    <SafeAreaView style={dynamicStyles.safeContainer}>
      <View style={dynamicStyles.shellContainer}>
        {/* Desktop / Tablet Sidebar */}
        {!isMobile ? (
          <Sidebar
            currentRoute={currentRoute}
            onNavigate={onNavigate}
            isCollapsed={isCollapsed}
            onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          />
        ) : null}

        {/* Mobile Sidebar Drawer Overlay */}
        {isMobile ? (
          <Modal visible={mobileDrawerOpen} transparent animationType="fade">
            <TouchableOpacity
              style={dynamicStyles.drawerBackdrop}
              activeOpacity={1}
              onPress={() => setMobileDrawerOpen(false)}
            >
              <View style={dynamicStyles.drawerContent}>
                <Sidebar
                  currentRoute={currentRoute}
                  onNavigate={onNavigate}
                  isCollapsed={false}
                  onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
                />
              </View>
            </TouchableOpacity>
          </Modal>
        ) : null}

        {/* Main Content Column (Header + Screen Area) */}
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
        </View>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    safeContainer: {
      flex: 1,
      backgroundColor: colors.primaryDark,
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
    },
    drawerBackdrop: {
      flex: 1,
      backgroundColor: colors.overlay,
      flexDirection: 'row',
    },
    drawerContent: {
      height: '100%',
      backgroundColor: colors.primaryDark,
    },
  });

export default MainLayout;
