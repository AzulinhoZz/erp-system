import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors, typography, radius } from '../../theme';

/**
 * Enterprise User / Company Avatar.
 */
export function Avatar({
  name = 'User',
  src,
  size = 40,
  backgroundColor = colors.primary,
  textColor = colors.surface,
  status, // 'online' | 'offline' | 'busy'
  style,
}) {
  const getInitials = (str) => {
    if (!str) return 'U';
    const parts = str.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  const fontSize = size * 0.4;

  return (
    <View style={[{ width: size, height: size }, styles.container, style]}>
      {src ? (
        <Image
          source={{ uri: src }}
          style={[{ width: size, height: size, borderRadius: size / 2 }]}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor,
            },
          ]}
        >
          <Text style={[styles.initials, { fontSize, color: textColor }]}>
            {getInitials(name)}
          </Text>
        </View>
      )}

      {status ? (
        <View
          style={[
            styles.statusDot,
            {
              width: size * 0.28,
              height: size * 0.28,
              borderRadius: (size * 0.28) / 2,
              backgroundColor:
                status === 'online'
                  ? colors.green
                  : status === 'busy'
                  ? colors.danger
                  : colors.textMuted,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontWeight: typography.weights.bold,
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: colors.surface,
  },
});

export default Avatar;
