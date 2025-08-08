import React from "react"
import { View, Text, StyleSheet } from "react-native"

// 간단한 Sonner Toaster (실제로는 사용하지 않음)
export const Toaster: React.FC = () => {
  return <View style={styles.container} />
}

// 간단한 toast 함수
export const toast = {
  success: (message: string) => console.log('Toast success:', message),
  error: (message: string) => console.log('Toast error:', message),
  info: (message: string) => console.log('Toast info:', message),
  warning: (message: string) => console.log('Toast warning:', message),
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1000,
        },
})
