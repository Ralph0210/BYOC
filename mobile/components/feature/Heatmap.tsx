import { View, Text, Dimensions } from "react-native"
import { useMemo } from "react"

const SCREEN_WIDTH = Dimensions.get("window").width
const PADDING = 24 // p-6 = 24px
const GAP = 4
const CELLS_PER_ROW = 7 // 7 days per week
const CELL_SIZE =
  (SCREEN_WIDTH - PADDING * 2 - GAP * (CELLS_PER_ROW - 1)) / CELLS_PER_ROW

interface HeatmapProps {
  data: number[] // Array of completion percentages (0-1)
  color?: string
  showLabels?: boolean
}

export function Heatmap({
  data,
  color = "#5856D6",
  showLabels = false,
}: HeatmapProps) {
  const cells = useMemo(() => {
    // Pad data to fill complete weeks
    const paddedData = [...data]
    while (paddedData.length % CELLS_PER_ROW !== 0) {
      paddedData.push(0)
    }
    return paddedData
  }, [data])

  const getOpacity = (value: number) => {
    if (value === 0) return 0.1
    if (value <= 0.25) return 0.25
    if (value <= 0.5) return 0.5
    if (value <= 0.75) return 0.75
    return 1
  }

  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"]

  return (
    <View>
      {/* Day Labels */}
      {showLabels && (
        <View className="flex-row mb-2">
          {dayLabels.map((label, index) => (
            <View
              key={index}
              style={{ width: CELL_SIZE, marginRight: index < 6 ? GAP : 0 }}
              className="items-center"
            >
              <Text className="text-xs text-gray-400 dark:text-gray-500">
                {label}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Heatmap Grid */}
      <View className="flex-row flex-wrap">
        {cells.map((value, index) => (
          <View
            key={index}
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              marginRight: (index + 1) % CELLS_PER_ROW === 0 ? 0 : GAP,
              marginBottom: GAP,
              backgroundColor: color,
              opacity: getOpacity(value),
              borderRadius: 4,
            }}
          />
        ))}
      </View>

      {/* Legend */}
      <View className="flex-row items-center justify-end mt-2">
        <Text className="text-xs text-gray-400 dark:text-gray-500 mr-2">
          Less
        </Text>
        {[0.1, 0.25, 0.5, 0.75, 1].map((opacity, index) => (
          <View
            key={index}
            style={{
              width: 12,
              height: 12,
              backgroundColor: color,
              opacity,
              borderRadius: 2,
              marginRight: 2,
            }}
          />
        ))}
        <Text className="text-xs text-gray-400 dark:text-gray-500 ml-1">
          More
        </Text>
      </View>
    </View>
  )
}
