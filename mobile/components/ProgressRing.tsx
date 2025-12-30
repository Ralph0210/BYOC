/**
 * ProgressRing Component
 *
 * Circular progress indicator following iOS design patterns.
 * Uses SVG for smooth rendering and proper anti-aliasing.
 */

import React from "react"
import { View, Text, StyleSheet } from "react-native"
import Svg, { Circle } from "react-native-svg"
import { useTheme } from "../contexts/ThemeContext"
import { typography } from "../lib/theme"

interface ProgressRingProps {
  /** Progress value 0-100 */
  progress: number
  /** Size of the ring in pixels */
  size?: number
  /** Stroke width */
  strokeWidth?: number
  /** Show percentage text in center */
  showPercent?: boolean
  /** Custom color for progress arc */
  color?: string
}

export function ProgressRing({
  progress,
  size = 48,
  strokeWidth = 4,
  showPercent = false,
  color,
}: ProgressRingProps) {
  const { colors } = useTheme()

  // Clamp progress between 0-100
  const clampedProgress = Math.min(100, Math.max(0, progress))

  // Calculate SVG circle dimensions
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset =
    circumference - (clampedProgress / 100) * circumference

  // Determine color based on progress
  const progressColor =
    color || (clampedProgress === 100 ? colors.success : colors.accent)

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      {showPercent && (
        <View style={styles.textContainer}>
          <Text
            style={[
              typography.caption1,
              styles.percentText,
              { color: colors.textPrimary },
            ]}
          >
            {Math.round(clampedProgress)}%
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  svg: {
    transform: [{ rotateZ: "0deg" }],
  },
  textContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  percentText: {
    fontWeight: "600",
  },
})
