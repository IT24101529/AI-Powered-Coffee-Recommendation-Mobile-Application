import React from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import colors from '../theme/colors';
import { fonts, fontSizes } from '../theme/typography';
import { borderRadius } from '../theme/spacing';

const { height } = Dimensions.get('window');

const LOGO_URI = 'https://res.cloudinary.com/dqjzgnghk/image/upload/v1775206009/white_logo_d3ma34.png';
const COFFEE_BG = {
  uri: 'https://res.cloudinary.com/dqjzgnghk/image/upload/v1775205865/Artisanal_Coffee_Pouring_oduqi8.png',
};

export default function SplashScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <ImageBackground source={COFFEE_BG} style={styles.bg} resizeMode="cover">
        {/* Dark gradient overlay — top (20% opacity) fading to bottom (85% opacity) */}
        <View style={styles.gradientTop} />
        <View style={styles.gradientBottom} />

        <View style={styles.content}>
          {/* Logo area */}
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: LOGO_URI }}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* "Since 2024" peach pill badge */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>SINCE 2024</Text>
          </View>

          {/* Tagline */}
          <Text style={styles.tagline}>
            Crafted with passion, served with warmth.{'\n'}Every cup tells a story.
          </Text>

          {/* Buttons */}
          <View style={styles.buttons}>
            {/* "Get Started" primary brown pill button */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Get Started →</Text>
            </TouchableOpacity>

            {/* "Our Story" ghost glass button */}
            <TouchableOpacity
              style={styles.ghostButton}
              onPress={() => {}}
              activeOpacity={0.7}
            >
              <Text style={styles.ghostButtonText}>Our Story</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bg: {
    flex: 1,
  },
  // Top gradient layer — dark at 20% opacity
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.63,
    backgroundColor: 'rgba(0,0,0,0.40)',
  },
  // Bottom gradient layer — dark at 85% opacity
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.37,
    backgroundColor: 'rgba(0,0,0,0.70)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 56,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
    position: 'absolute',
    top: 270,
  },
  logoImage: {
    width: 250,
    height: 130,
  },
  badge: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.pill,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 20,
  },
  badgeText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.xs,
    color: colors.dark,
    letterSpacing: 2,
  },
  tagline: {
    fontFamily: fonts.light,
    fontSize: fontSizes.lg,
    color: 'rgba(255,255,255,0.90)',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 40,
  },
  buttons: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.base,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  ghostButton: {
    height: 52,
    backgroundColor: colors.glass,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: '#ffffff37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.base,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
