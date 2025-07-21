import React, { useState, useEffect } from 'react';
import { Button, Platform } from 'react-native';
import { authenticateBiometric, isBiometricEnabled } from '../../utils/biometrics';

const BiometricLoginButton = ({ onLoginSuccess }) => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const flag = await isBiometricEnabled();
        setEnabled(flag);
      }
    })();
  }, []);

  const handleBiometricLogin = async () => {
    const result = await authenticateBiometric();
    if (result.success) {
      onLoginSuccess();
    } else {
      alert('생체인증 실패 또는 취소');
    }
  };

  if (!enabled) return null;
  return (
    <Button title="생체인증으로 로그인" onPress={handleBiometricLogin} />
  );
};

export default BiometricLoginButton; 