export const colors = {
  ink: '#1f130b',
  paper: '#e7d0a4',
  paperDark: '#d4b988',
  surface: '#fffbf2',
  brown: '#543c2d',
  orange: '#ef8d53',
  orangeHover: '#f7a671',
  yellow: '#f5c04a',
  yellowSoft: '#fbe3a0',
  green: '#79c493',
  red: '#e8503f',
  errorText: '#b3261e',
  muted: '#5c4636',
  placeholder: '#85836f',
  disabledBg: '#dcd7c3',
  disabledBorder: '#8a8878',
  disabledText: '#7a7968',
} as const;

export const stroke = 3;
export const strokeThin = 2;

export const shadow = { none: 0, sm: 4, md: 8, lg: 12 } as const;

export const fonts = {
  display: 'ArchivoBlack_400Regular',
  body: 'SpaceGrotesk_400Regular',
  bodyMedium: 'SpaceGrotesk_500Medium',
  bodyBold: 'SpaceGrotesk_700Bold',
} as const;

export const motion = { fast: 90, base: 180, slow: 420 } as const;

export const contentMaxWidth = 700;
