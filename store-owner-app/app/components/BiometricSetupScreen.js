import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert, Platform } from 'react-native';
import { isBiometricSupported, enrollBiometrics, setBiometricEnabled } from '../../utils/biometrics';

export default function BiometricSetupScreen({ navigation }) {
  const [supported, setSupported] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') {
        setSupported(false);
        setLoading(false);
        return;
      }
      const hw = await isBiometricSupported();
      setSupported(hw);
      if (hw) {
        const isEnrolled = await enrollBiometrics();
        setEnrolled(isEnrolled);
      }
      setLoading(false);
    })();
  }, []);

  const handleEnable = async () => {
    if (!supported) {
      Alert.alert('이 기기는 생체인증을 지원하지 않습니다.');
      return;
    }
    if (!enrolled) {
      Alert.alert('생체정보가 등록되어 있지 않습니다. 기기 설정에서 등록해주세요.');
      return;
    }
    await setBiometricEnabled(true);
    Alert.alert('생체인증이 활성화되었습니다!');
    navigation.goBack();
  };

  if (loading) return <View><Text>로딩 중...</Text></View>;
  if (!supported) return <View><Text>이 기기는 생체인증을 지원하지 않습니다.</Text></View>;

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>생체인증 등록</Text>
      <Text style={{ marginBottom: 24 }}>
        생체인증(지문, Face ID 등)을 등록하면 더 빠르고 안전하게 로그인할 수 있습니다.
      </Text>
      <Button title="생체인증 사용하기" onPress={handleEnable} disabled={!enrolled} />
      <Button title="나중에 설정" onPress={() => navigation.goBack()} color="#888" style={{ marginTop: 12 }} />
    </View>
  );
} 