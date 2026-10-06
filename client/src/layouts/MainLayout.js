import React, { useState } from 'react';
import { View, StyleSheet, useWindowDimensions, Modal, TouchableOpacity, Platform } from 'react-native';
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
