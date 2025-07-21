import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, SafeAreaView, TouchableOpacity } from 'react-native';
import { auth, googleProvider, appleProvider } from '../firebase';
import { signInWithEmailAndPassword, onAuthStateChanged, signInWithCredential } from 'firebase/auth';
import { router } from 'expo-router';
import BiometricAuth from './utils/biometrics';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, OAuthProvider } from 'firebase/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [autoBiometricEnabled, setAutoBiometricEnabled] = useState(false);

  // Google 로그인
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: 'YOUR_EXPO_CLIENT_ID', // Google Cloud Console에서 설정 필요
    iosClientId: 'YOUR_IOS_CLIENT_ID', // iOS용 클라이언트 ID
    androidClientId: 'YOUR_ANDROID_CLIENT_ID', // Android용 클라이언트 ID
  });

  useEffect(() => {
    // 생체인증 설정 확인
    checkBiometricSetup();
    
    // 이미 로그인된 사용자 확인
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace('/OwnerDashboard');
      }
    });

    return unsubscribe;
  }, []);

  // Google 로그인 응답 처리
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then((result) => {
          console.log('Google 로그인 성공:', result.user);
          router.replace('/OwnerDashboard');
        })
        .catch((error) => {
          console.error('Google 로그인 실패:', error);
          Alert.alert('오류', 'Google 로그인에 실패했습니다: ' + error.message);
        });
    }
  }, [response]);

  const handleGoogleLogin = async () => {
    try {
      await promptAsync();
    } catch (error) {
      console.error('Google 로그인 시작 실패:', error);
      Alert.alert('오류', 'Google 로그인을 시작할 수 없습니다.');
    }
  };

  const handleAppleLogin = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      
      // Apple 인증 정보를 Firebase로 변환
      const { identityToken } = credential;
      if (identityToken) {
        const provider = new OAuthProvider('apple.com');
        const firebaseCredential = provider.credential({
          idToken: identityToken,
        });
        
        const result = await signInWithCredential(auth, firebaseCredential);
        console.log('Apple 로그인 성공:', result.user);
        router.replace('/OwnerDashboard');
      }
    } catch (error) {
      if (error.code === 'ERR_CANCELED') {
        console.log('Apple 로그인 취소됨');
      } else {
        console.error('Apple 로그인 실패:', error);
        Alert.alert('오류', 'Apple 로그인에 실패했습니다: ' + error.message);
      }
    }
  };

  const checkBiometricSetup = async () => {
    try {
      const setup = await BiometricAuth.checkBiometricSetup();
      setBiometricAvailable(setup.isAvailable);
      setBiometricEnabled(setup.isEnabled);
      setAutoBiometricEnabled(setup.isAutoEnabled);
      
      if (setup.isAvailable && !setup.isEnabled) {
        console.log('지원되는 생체인증:', setup.supportedTypes.join(', '));
      }
    } catch (error) {
      console.error('생체인증 설정 확인 실패:', error);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace('/OwnerDashboard');
    } catch (error) {
      console.error('로그인 실패:', error);
      Alert.alert('로그인 실패', '이메일 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const result = await BiometricAuth.authenticateWithBiometric();
      
      if (result.success) {
        // 생체인증 성공 시 저장된 사용자 정보로 자동 로그인
        const savedUserId = await BiometricAuth.getBiometricUser();
        if (savedUserId) {
          // 실제 구현에서는 서버에 생체인증 토큰을 보내 검증해야 함
          // 여기서는 간단히 성공 메시지만 표시
          Alert.alert('성공', '생체인증이 완료되었습니다.');
          router.replace('/OwnerDashboard');
        } else {
          Alert.alert('오류', '저장된 사용자 정보를 찾을 수 없습니다.');
        }
      } else {
        Alert.alert('생체인증 실패', result.message);
      }
    } catch (error) {
      console.error('생체인증 로그인 실패:', error);
      Alert.alert('오류', '생체인증에 실패했습니다: ' + error.message);
    }
  };

  const handleBiometricSetup = async () => {
    if (!email || !password) {
      Alert.alert('오류', '먼저 이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      // 먼저 로그인하여 사용자 ID 확인
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;
      
      // 인증 상태가 안정화될 때까지 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 생체인증 활성화
      const result = await BiometricAuth.enableBiometric(userId);
      
      if (result.success) {
        Alert.alert('성공', result.message);
        setBiometricEnabled(true);
        // 로그인 상태를 유지하면서 대시보드로 이동
        router.replace('/OwnerDashboard');
      } else {
        Alert.alert('실패', result.message);
      }
    } catch (error) {
      console.error('생체인증 설정 실패:', error);
      if (error.code === 'auth/invalid-credential') {
        Alert.alert('오류', '로그인 정보가 올바르지 않습니다. 다시 시도해주세요.');
      } else {
        Alert.alert('오류', '생체인증 설정에 실패했습니다: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAutoBiometricSetup = async () => {
    if (!email || !password) {
      Alert.alert('오류', '먼저 이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      // 먼저 로그인하여 사용자 ID 확인
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;
      
      // 인증 상태가 안정화될 때까지 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 생체인증 활성화 (자동 로그인 포함)
      const result = await BiometricAuth.enableAutoBiometric(userId);
      
      if (result.success) {
        Alert.alert('성공', '다음부터 생체인증으로 자동 로그인됩니다.');
        setBiometricEnabled(true);
        setAutoBiometricEnabled(true);
        // 로그인 상태를 유지하면서 대시보드로 이동
        router.replace('/OwnerDashboard');
      } else {
        Alert.alert('실패', result.message);
      }
    } catch (error) {
      console.error('자동 생체인증 설정 실패:', error);
      if (error.code === 'auth/invalid-credential') {
        Alert.alert('오류', '로그인 정보가 올바르지 않습니다. 다시 시도해주세요.');
      } else {
        Alert.alert('오류', '자동 생체인증 설정에 실패했습니다: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // 생체인증 권한 요청
  const handleRequestPermission = async () => {
    try {
      console.log('권한 요청 시작...');
      const result = await BiometricAuth.requestBiometricPermission();
      console.log('권한 요청 결과:', result);
      
      if (result.success) {
        // 권한이 허용되면 생체인증 설정 상태 다시 확인
        await checkBiometricSetup();
      }
    } catch (error) {
      console.error('권한 요청 실패:', error);
      Alert.alert('오류', '권한 요청에 실패했습니다: ' + error.message);
    }
  };

  // 자동 생체인증 체크
  useEffect(() => {
    const checkAutoBiometric = async () => {
      if (autoBiometricEnabled && biometricAvailable) {
        try {
          const result = await BiometricAuth.authenticateWithBiometric();
          if (result.success) {
            const savedUserId = await BiometricAuth.getBiometricUser();
            if (savedUserId) {
              console.log('자동 생체인증 성공');
              router.replace('/OwnerDashboard');
            }
          }
        } catch (error) {
          console.log('자동 생체인증 실패:', error);
        }
      }
    };

    // 앱 시작 시 자동 생체인증 체크
    if (autoBiometricEnabled) {
      setTimeout(checkAutoBiometric, 1000);
    }
  }, [autoBiometricEnabled, biometricAvailable]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>오더랜드</Text>
        <Text style={styles.subtitle}>로그인</Text>

        {/* 소셜 로그인 버튼들 */}
        <View style={styles.socialSection}>
          <TouchableOpacity
            style={[styles.button, styles.googleButton]}
            onPress={handleGoogleLogin}
          >
            <Text style={styles.googleButtonText}>Google로 로그인</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.appleButton]}
            onPress={handleAppleLogin}
          >
            <Text style={styles.appleButtonText}>Apple로 로그인</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider}>
          <Text style={styles.dividerText}>또는</Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="이메일"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="비밀번호"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Button
          title={loading ? "로그인 중..." : "로그인"}
          onPress={handleLogin}
          disabled={loading}
        />

        {/* 생체인증 관련 버튼들 */}
        {biometricAvailable && (
          <View style={styles.biometricSection}>
            {biometricEnabled ? (
              <TouchableOpacity
                style={[styles.button, styles.biometricButton]}
                onPress={handleBiometricLogin}
              >
                <Text style={styles.biometricButtonText}>생체인증으로 로그인</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.setupButton]}
                  onPress={handleBiometricSetup}
                >
                  <Text style={styles.setupButtonText}>생체인증 설정</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.autoSetupButton]}
                  onPress={handleAutoBiometricSetup}
                >
                  <Text style={styles.autoSetupButtonText}>다음부터 생체인식 사용하기</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.requestPermissionButton]}
                  onPress={handleRequestPermission}
                >
                  <Text style={styles.requestPermissionButtonText}>Face ID 권한 요청</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => router.push('/register')}
        >
          <Text style={styles.registerButtonText}>회원가입</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  biometricButton: {
    backgroundColor: '#007AFF',
  },
  biometricButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  setupButton: {
    backgroundColor: '#4CAF50',
  },
  setupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  autoSetupButton: {
    backgroundColor: '#FF9800',
    marginTop: 10,
  },
  autoSetupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  requestPermissionButton: {
    backgroundColor: '#FF4444',
    marginTop: 10,
  },
  requestPermissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerButton: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6C757D',
    marginTop: 15,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  biometricSection: {
    width: '100%',
    marginTop: 20,
  },
  socialSection: {
    width: '100%',
    marginBottom: 20,
  },
  googleButton: {
    backgroundColor: '#DB4437',
    marginBottom: 10,
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  appleButton: {
    backgroundColor: '#000',
  },
  appleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerText: {
    fontSize: 16,
    color: '#666',
  },
}); 