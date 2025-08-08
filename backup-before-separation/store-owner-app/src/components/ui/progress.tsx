import * as React from "react"
import { View, ViewStyle } from "react-native"

interface ProgressProps {
  value?: number
  style?: ViewStyle
}

const Progress = React.forwardRef<View, ProgressProps>(
  ({ style, value, ...props }, ref) => (
    <View
    ref={ref}
      style={[
        {
          height: 16,
          width: '100%',
          overflow: 'hidden',
          borderRadius: 8,
          backgroundColor: '#f5f5f5', // 원본: hsl(25 20% 96%) - 새로운 muted 색상
        },
        style
      ]}
    {...props}
  >
      <View
        style={{
          height: '100%',
          backgroundColor: '#e67e22', // 원본: hsl(15 85% 58%) - 새로운 따뜻한 오렌지
          width: `${value || 0}%`,
        }}
    />
    </View>
  )
)
Progress.displayName = "Progress"

export { Progress }
