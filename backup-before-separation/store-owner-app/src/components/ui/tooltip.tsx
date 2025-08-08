import * as React from "react"
import { View, Text, StyleSheet } from "react-native"

// 간단한 Tooltip Provider
export const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>
}

// 간단한 Tooltip Root
export const Tooltip: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>
}

// 간단한 Tooltip Trigger
export const TooltipTrigger: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>
}

// 간단한 Tooltip Content
interface TooltipContentProps {
  children: React.ReactNode
  sideOffset?: number
}

export const TooltipContent: React.FC<TooltipContentProps> = ({ children, sideOffset = 4 }) => {
  return (
    <View style={[styles.content, { marginTop: sideOffset }]}>
      <Text style={styles.text}>{children}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  content: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#555',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  text: {
    color: '#fff',
    fontSize: 14,
  },
})
