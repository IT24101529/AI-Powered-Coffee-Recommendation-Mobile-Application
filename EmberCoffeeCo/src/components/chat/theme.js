import globalColors from '../../theme/colors';
import globalSpacing, { borderRadius as globalBorderRadius } from '../../theme/spacing';
import { fonts as globalFonts } from '../../theme/typography';

export const COLORS = {
  primary:     globalColors.primary,
  primaryLight:globalColors.accent,
  background:  globalColors.cream,
  surface:     '#FFFFFF',
  text:        globalColors.dark,
  textLight:   '#888888',
  border:      'rgba(98, 55, 30, 0.1)',
  success:     '#27AE60',
  error:       '#E74C3C',
  warning:     '#F39C12',
  cream:       globalColors.cream,
  dark:        globalColors.dark,
};

export const FONTS = {
  regular:    globalFonts.regular,
  semiBold:   globalFonts.semiBold,
  bold:       globalFonts.bold,
  fonts:      globalFonts,
};

export const SPACING = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  xxl: 32,
};

export const RADIUS = {
  sm:  globalBorderRadius.sm,
  md:  globalBorderRadius.md,
  lg:  globalBorderRadius.lg,
  full: 999,
};
