import { useState } from "react";
import { View, Text, Pressable, TextInput, StyleSheet, ScrollView, Alert } from "react-native";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { signIn, resetPassword, validateEmail } from "../../lib/auth";

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onBack: () => void;
  onGoToSignUp: () => void;
}

export function LoginScreen({ onLoginSuccess, onBack, onGoToSignUp }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = "이메일을 입력해주세요.";
    } else if (!validateEmail(email)) {
      newErrors.email = "유효한 이메일 형식이 아닙니다.";
    }

    if (!password) {
      newErrors.password = "비밀번호를 입력해주세요.";
    } else if (password.length < 6) {
      newErrors.password = "비밀번호는 6자 이상이어야 합니다.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await signIn(email.trim(), password);
      onLoginSuccess();
    } catch (error: any) {
      Alert.alert("로그인 실패", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert("알림", "이메일을 먼저 입력해주세요.");
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert("알림", "유효한 이메일 형식이 아닙니다.");
      return;
    }

    try {
      await resetPassword(email.trim());
      Alert.alert(
        "비밀번호 재설정", 
        "비밀번호 재설정 이메일을 발송했습니다. 이메일을 확인해주세요."
      );
    } catch (error: any) {
      Alert.alert("오류", error.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#8a8a8a" />
        </Pressable>
        <Text style={styles.headerTitle}>로그인</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Welcome Text */}
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>오더랜드에 오신 것을 환영합니다!</Text>
            <Text style={styles.welcomeSubtitle}>
              사장님 계정으로 로그인하여 스마트한 매장 관리를 시작하세요.
            </Text>
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>이메일</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="example@email.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>비밀번호</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.passwordInput, errors.password && styles.inputError]}
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#8a8a8a" />
                ) : (
                  <Eye size={20} color="#8a8a8a" />
                )}
              </Pressable>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          {/* Forgot Password */}
          <Pressable onPress={handleResetPassword} style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>비밀번호를 잊으셨나요?</Text>
          </Pressable>

          {/* Login Button */}
          <Pressable
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? "로그인 중..." : "로그인"}
            </Text>
          </Pressable>

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>계정이 없으신가요? </Text>
            <Pressable onPress={onGoToSignUp}>
              <Text style={styles.signUpLink}>회원가입</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // 원본: hsl(0 0% 100%)
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e6e6e6', // 원본: hsl(25 20% 90%)
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#404040', // 원본: hsl(25 25% 15%)
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  formContainer: {
    padding: 24,
    gap: 24,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#404040', // 원본: hsl(25 25% 15%)
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#8a8a8a', // 원본: hsl(25 15% 55%)
    textAlign: 'center',
    lineHeight: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#404040', // 원본: hsl(25 25% 15%)
  },
  input: {
    borderWidth: 1,
    borderColor: '#e6e6e6', // 원본: hsl(25 20% 90%)
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff', // 원본: hsl(0 0% 100%)
  },
  inputError: {
    borderColor: '#ef4444', // 원본: hsl(0 72% 50%) - 위험 색상
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#e6e6e6', // 원본: hsl(25 20% 90%)
    borderRadius: 8,
    padding: 12,
    paddingRight: 48,
    fontSize: 16,
    backgroundColor: '#ffffff', // 원본: hsl(0 0% 100%)
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  errorText: {
    color: '#ef4444', // 원본: hsl(0 72% 50%) - 위험 색상
    fontSize: 14,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    color: '#e67e22', // 원본: hsl(15 85% 58%) - 새로운 따뜻한 오렌지
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#e67e22', // 원본: hsl(15 85% 58%) - 새로운 따뜻한 오렌지
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#8a8a8a', // 원본: hsl(15 5% 55%)
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  signUpText: {
    color: '#8a8a8a', // 원본: hsl(15 5% 55%)
    fontSize: 16,
  },
  signUpLink: {
    color: '#e67e22', // 원본: hsl(15 85% 58%) - 새로운 따뜻한 오렌지
    fontSize: 16,
    fontWeight: '600',
  },
}); 