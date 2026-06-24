import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  noPad?: boolean;
}

export function GlassCard({ children, style, noPad }: Props) {
  return (
    <View style={[styles.card, noPad && styles.noPad, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(37, 34, 53, 0.92)",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(184, 169, 232, 0.14)",
  },
  noPad: {
    padding: 0,
    overflow: "hidden",
  },
});
