// (이 파일은 app/utils/biometrics.js에서 store-owner-app/utils/biometrics.js로 이동됨)
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function isBiometricSupported() {
  return await LocalAuthentication.hasHardwareAsync();
}

export async function enrollBiometrics() {
  // 실제로는 OS 설정에서 등록해야 하므로 안내만 제공
  return await LocalAuthentication.isEnrolledAsync();
}

export async function authenticateBiometric(prompt = '지문 또는 Face ID로 인증하세요') {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: prompt,
    fallbackLabel: '비밀번호로 로그인',
    cancelLabel: '취소'
  });
  return result;
}

export async function setBiometricEnabled(enabled) {
  await AsyncStorage.setItem('useBiometrics', enabled ? 'true' : 'false');
}

export async function isBiometricEnabled() {
  const value = await AsyncStorage.getItem('useBiometrics');
  return value === 'true';
} 