import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { colors } from '../theme/tokens';
import { ShadowBox } from './ShadowBox';

interface CardProps {
  offset?: number;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Card({ offset = 4, backgroundColor = colors.surface, style, containerStyle, children }: PropsWithChildren<CardProps>) {
  return (
    <ShadowBox
      offset={offset}
      backgroundColor={backgroundColor}
      style={[{ padding: 20 }, style]}
      containerStyle={containerStyle}
    >
      {children}
    </ShadowBox>
  );
}
