import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';

// 생체인증 상태 관리
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const BIOMETRIC_USER_KEY = 'biometric_user';
const BIOMETRIC_AUTO_ENABLED_KEY = 'biometric_auto_enabled';

export class BiometricAuth {
  // 생체인증 사용 가능 여부 확인
  static async isBiometricAvailable() {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      console.log('생체인증 하드웨어 확인:', { hasHardware, isEnrolled });
      
      if (!hasHardware) {
        console.log('생체인증 하드웨어가 없습니다.');
        return false;
      }
      
      if (!isEnrolled) {
        console.log('생체인증이 등록되지 않았습니다.');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('생체인증 하드웨어 확인 실패:', error);
      return false;
    }
  }

  // 지원되는 생체인증 유형 확인
  static async getSupportedTypes() {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const typeNames = {
        [LocalAuthentication.AuthenticationType.FINGERPRINT]: '지문',
        [LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION]: '얼굴인식',
        [LocalAuthentication.AuthenticationType.IRIS]: '홍채인식',
      };
      return types.map(type => typeNames[type] || '알 수 없음');
    } catch (error) {
      console.error('지원되는 생체인증 유형 확인 실패:', error);
      return [];
    }
  }

  // iOS에서 생체인증 옵션 설정
  static getBiometricOptions(promptMessage) {
    const baseOptions = {
      promptMessage,
      fallbackLabel: '비밀번호 사용',
      cancelLabel: '취소',
      requireAuthentication: true,
    };

    if (Platform.OS === 'ios') {
      return {
        ...baseOptions,
        disableDeviceFallback: true, // iOS에서 생체인증만 사용
      };
    } else {
      return {
        ...baseOptions,
        disableDeviceFallback: false, // Android에서는 디바이스 폴백 허용
      };
    }
  }

  // 자동 생체인증 활성화
  static async enableAutoBiometric(userId) {
    try {
      const isAvailable = await this.isBiometricAvailable();
      if (!isAvailable) {
        throw new Error('생체인증을 사용할 수 없습니다.');
      }

      if (!userId) {
        throw new Error('사용자 ID가 필요합니다.');
      }

      // 생체인증 테스트 - Platform별 옵션 적용
      const options = this.getBiometricOptions('자동 로그인을 위해 생체인증을 설정해주세요');
      const result = await LocalAuthentication.authenticateAsync(options);

      if (result.success) {
        // 사용자 정보 저장 (자동 로그인 포함)
        await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
        await AsyncStorage.setItem(BIOMETRIC_USER_KEY, userId);
        await AsyncStorage.setItem(BIOMETRIC_AUTO_ENABLED_KEY, 'true');
        console.log('자동 생체인증 활성화 완료:', userId);
        return { success: true, message: '자동 생체인증이 활성화되었습니다.' };
      } else {
        return { success: false, message: '자동 생체인증 설정이 취소되었습니다.' };
      }
    } catch (error) {
      console.error('자동 생체인증 활성화 실패:', error);
      return { success: false, message: '자동 생체인증 설정에 실패했습니다: ' + error.message };
    }
  }

  // 생체인증 활성화
  static async enableBiometric(userId) {
    try {
      const isAvailable = await this.isBiometricAvailable();
      if (!isAvailable) {
        throw new Error('생체인증을 사용할 수 없습니다.');
      }

      if (!userId) {
        throw new Error('사용자 ID가 필요합니다.');
      }

      // 생체인증 테스트 - Platform별 옵션 적용
      const options = this.getBiometricOptions('생체인증을 설정하기 위해 인증해주세요');
      const result = await LocalAuthentication.authenticateAsync(options);

      if (result.success) {
        // 사용자 정보 저장
        await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
        await AsyncStorage.setItem(BIOMETRIC_USER_KEY, userId);
        console.log('생체인증 활성화 완료:', userId);
        return { success: true, message: '생체인증이 활성화되었습니다.' };
      } else {
        return { success: false, message: '생체인증 설정이 취소되었습니다.' };
      }
    } catch (error) {
      console.error('생체인증 활성화 실패:', error);
      return { success: false, message: '생체인증 설정에 실패했습니다: ' + error.message };
    }
  }

  // 생체인증 비활성화
  static async disableBiometric() {
    try {
      await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
      await AsyncStorage.removeItem(BIOMETRIC_USER_KEY);
      await AsyncStorage.removeItem(BIOMETRIC_AUTO_ENABLED_KEY);
      return { success: true, message: '생체인증이 비활성화되었습니다.' };
    } catch (error) {
      console.error('생체인증 비활성화 실패:', error);
      return { success: false, message: '생체인증 비활성화에 실패했습니다.' };
    }
  }

  // 자동 생체인증 상태 확인
  static async isAutoBiometricEnabled() {
    try {
      const autoEnabled = await AsyncStorage.getItem(BIOMETRIC_AUTO_ENABLED_KEY);
      return autoEnabled === 'true';
    } catch (error) {
      console.error('자동 생체인증 상태 확인 실패:', error);
      return false;
    }
  }

  // 생체인증 상태 확인
  static async isBiometricEnabled() {
    try {
      const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('생체인증 상태 확인 실패:', error);
      return false;
    }
  }

  // 저장된 사용자 ID 가져오기
  static async getBiometricUser() {
    try {
      return await AsyncStorage.getItem(BIOMETRIC_USER_KEY);
    } catch (error) {
      console.error('생체인증 사용자 정보 가져오기 실패:', error);
      return null;
    }
  }

  // 생체인증으로 로그인
  static async authenticateWithBiometric() {
    try {
      const isEnabled = await this.isBiometricEnabled();
      if (!isEnabled) {
        throw new Error('생체인증이 활성화되지 않았습니다.');
      }

      const userId = await this.getBiometricUser();
      if (!userId) {
        throw new Error('저장된 사용자 정보를 찾을 수 없습니다.');
      }

      // Platform별 옵션 적용
      const options = this.getBiometricOptions('생체인증으로 로그인해주세요');
      const result = await LocalAuthentication.authenticateAsync(options);

      if (result.success) {
        console.log('생체인증 로그인 성공:', userId);
        return { 
          success: true, 
          userId: userId,
          message: '생체인증이 완료되었습니다.' 
        };
      } else {
        return { 
          success: false, 
          message: '생체인증이 취소되었습니다.' 
        };
      }
    } catch (error) {
      console.error('생체인증 로그인 실패:', error);
      return { 
        success: false, 
        message: '생체인증에 실패했습니다: ' + error.message 
      };
    }
  }

  // 생체인증 설정 확인 및 안내
  static async checkBiometricSetup() {
    try {
      const isAvailable = await this.isBiometricAvailable();
      const isEnabled = await this.isBiometricEnabled();
      const isAutoEnabled = await this.isAutoBiometricEnabled();
      const supportedTypes = await this.getSupportedTypes();
      
      console.log('생체인증 설정 확인:', {
        isAvailable,
        isEnabled,
        isAutoEnabled,
        supportedTypes
      });
      
      return {
        isAvailable,
        isEnabled,
        isAutoEnabled,
        supportedTypes,
      };
    } catch (error) {
      console.error('생체인증 설정 확인 실패:', error);
      return {
        isAvailable: false,
        isEnabled: false,
        isAutoEnabled: false,
        supportedTypes: [],
      };
    }
  }

  // 생체인증 권한 요청 및 테스트
  static async requestBiometricPermission() {
    try {
      console.log('생체인증 권한 요청 시작...');
      
      // 먼저 하드웨어 지원 여부 확인
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      console.log('하드웨어 지원:', hasHardware);
      
      if (!hasHardware) {
        Alert.alert('오류', '이 기기는 생체인증을 지원하지 않습니다.');
        return { success: false, message: '이 기기는 생체인증을 지원하지 않습니다.' };
      }
      
      // 생체정보 등록 여부 확인
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      console.log('생체정보 등록:', isEnrolled);
      
      if (!isEnrolled) {
        Alert.alert(
          '생체인증설정 필요',
          `기기 설정에서 Face ID 또는 Touch ID를 등록해주세요.\n\n설정 > Face ID 및 암호 > Face ID 설정`
        );
        return { success: false, message: '생체인증이 등록되지 않았습니다.' };
      }
      
      // 지원되는 인증 타입 확인
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      console.log('지원되는 인증 타입:', supportedTypes);
      
      // 권한 요청을 위한 간단한 인증 시도 (더 강력한 옵션)
      const options = {
        promptMessage: '앱에서 생체인증을 사용하기 위해 인증해주세요',
        fallbackLabel: '비밀번호 사용',
        cancelLabel: '취소',
        disableDeviceFallback: true, // iOS에서 생체인증만 사용
        requireAuthentication: true,
      };
      
      console.log('인증 옵션:', options);
      const result = await LocalAuthentication.authenticateAsync(options);
      
      console.log('권한 요청 결과:', result);
      
      if (result.success) {
        Alert.alert('성공', '생체인증 권한이 허용되었습니다!');
        return { success: true, message: '생체인증 권한이 허용되었습니다.' };
      } else {
        console.log('인증 실패 이유:', result.error);
        if (result.error === 'user_cancel') {
          Alert.alert('취소됨', '사용자가 생체인증 권한 요청을 취소했습니다.');
          return { success: false, message: '사용자가 권한 요청을 취소했습니다.' };
        } else if (result.error === 'not_enrolled') {
          Alert.alert('설정 필요', '기기에서 생체인증이 등록되어 있지 않습니다.');
          return { success: false, message: '생체인증이 등록되지 않았습니다.' };
        } else {
          Alert.alert('실패', `생체인증 권한이 거부되었습니다. (${result.error})`);
          return { success: false, message: `생체인증 권한이 거부되었습니다. (${result.error})` };
        }
      }
      
    } catch (error) {
      console.error('권한 요청 실패:', error);
      Alert.alert('오류', '생체인증 권한 요청에 실패했습니다: ' + error.message);
      return { success: false, message: '권한 요청에 실패했습니다: ' + error.message };
    }
  }

  // 생체인증 권한 상태 확인
  static async checkBiometricPermission() {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware) {
        return { hasPermission: false, reason: 'hardware_not_supported' };
      }
      
      if (!isEnrolled) {
        return { hasPermission: false, reason: 'not_enrolled' };
      }
      
      // 실제 권한 테스트를 위해 간단한 인증 시도
      const options = this.getBiometricOptions('권한 확인 중...');
      const result = await LocalAuthentication.authenticateAsync(options);
      
      return { 
        hasPermission: result.success, 
        reason: result.success ? 'granted' : result.error || 'unknown' 
      };
      
    } catch (error) {
      console.error('권한 상태 확인 실패:', error);
      return { hasPermission: false, reason: 'check_failed' };
    }
  }
}

export default BiometricAuth; 