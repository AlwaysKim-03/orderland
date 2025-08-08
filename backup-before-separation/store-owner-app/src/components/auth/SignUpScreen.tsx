import { useState } from "react";
import { View, Text, Pressable, TextInput, StyleSheet, ScrollView, Alert } from "react-native";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { signUp, validateEmail, validatePassword, validatePhoneNumber } from "../../lib/auth";

interface SignUpScreenProps {
  onSignUpSuccess: () => void;
  onBack: () => void;
  onGoToLogin: () => void;
}

export function SignUpScreen({ onSignUpSuccess, onBack, onGoToLogin }: SignUpScreenProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
    phoneNumber: "",
    businessName: "",
    businessNumber: "",
    businessType: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // 이메일 검증
    if (!formData.email.trim()) {
      newErrors.email = "이메일을 입력해주세요.";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "유효한 이메일 형식이 아닙니다.";
    }

    // 비밀번호 검증
    const passwordValidation = validatePassword(formData.password);
    if (!formData.password) {
      newErrors.password = "비밀번호를 입력해주세요.";
    } else if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.message;
    }

    // 비밀번호 확인 검증
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "비밀번호를 다시 입력해주세요.";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "비밀번호가 일치하지 않습니다.";
    }

    // 이름 검증
    if (!formData.displayName.trim()) {
      newErrors.displayName = "이름을 입력해주세요.";
    }

    // 전화번호 검증
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "전화번호를 입력해주세요.";
    } else if (!validatePhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = "유효한 전화번호 형식이 아닙니다.";
    }

    // 사업자 정보 검증
    if (!formData.businessName.trim()) {
      newErrors.businessName = "상호명을 입력해주세요.";
    }

    if (!formData.businessNumber.trim()) {
      newErrors.businessNumber = "사업자등록번호를 입력해주세요.";
    }

    if (!formData.businessType.trim()) {
      newErrors.businessType = "업종을 입력해주세요.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await signUp(
        formData.email.trim(),
        formData.password,
        formData.displayName.trim(),
        formData.phoneNumber.trim(),
        formData.businessName.trim(),
        formData.businessNumber.trim(),
        formData.businessType.trim()
      );
      
      Alert.alert(
        "회원가입 성공", 
        "오더랜드에 가입해주셔서 감사합니다! 로그인하여 서비스를 이용하세요.",
        [{ text: "확인", onPress: onSignUpSuccess }]
      );
    } catch (error: any) {
      Alert.alert("회원가입 실패", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#8a8a8a" />
        </Pressable>
        <Text style={styles.headerTitle}>회원가입</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Welcome Text */}
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>오더랜드 회원가입</Text>
            <Text style={styles.welcomeSubtitle}>
              사장님 정보를 입력하여 스마트한 매장 관리를 시작하세요.
            </Text>
          </View>

          {/* Account Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>계정 정보</Text>
            
            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>이메일 *</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="example@email.com"
                value={formData.email}
                onChangeText={(text) => updateFormData('email', text)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>비밀번호 *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.passwordInput, errors.password && styles.inputError]}
                  placeholder="6자 이상 입력하세요"
                  value={formData.password}
                  onChangeText={(text) => updateFormData('password', text)}
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

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>비밀번호 확인 *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.passwordInput, errors.confirmPassword && styles.inputError]}
                  placeholder="비밀번호를 다시 입력하세요"
                  value={formData.confirmPassword}
                  onChangeText={(text) => updateFormData('confirmPassword', text)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color="#8a8a8a" />
                  ) : (
                    <Eye size={20} color="#8a8a8a" />
                  )}
                </Pressable>
              </View>
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </View>
          </View>

          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>개인 정보</Text>
            
            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>이름 *</Text>
              <TextInput
                style={[styles.input, errors.displayName && styles.inputError]}
                placeholder="이름을 입력하세요"
                value={formData.displayName}
                onChangeText={(text) => updateFormData('displayName', text)}
              />
              {errors.displayName && <Text style={styles.errorText}>{errors.displayName}</Text>}
            </View>

            {/* Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>전화번호 *</Text>
              <TextInput
                style={[styles.input, errors.phoneNumber && styles.inputError]}
                placeholder="010-0000-0000"
                value={formData.phoneNumber}
                onChangeText={(text) => updateFormData('phoneNumber', text)}
                keyboardType="phone-pad"
              />
              {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
            </View>
          </View>

          {/* Business Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>사업자 정보</Text>
            
            {/* Business Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>상호명 *</Text>
              <TextInput
                style={[styles.input, errors.businessName && styles.inputError]}
                placeholder="상호명을 입력하세요"
                value={formData.businessName}
                onChangeText={(text) => updateFormData('businessName', text)}
              />
              {errors.businessName && <Text style={styles.errorText}>{errors.businessName}</Text>}
            </View>

            {/* Business Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>사업자등록번호 *</Text>
              <TextInput
                style={[styles.input, errors.businessNumber && styles.inputError]}
                placeholder="000-00-00000"
                value={formData.businessNumber}
                onChangeText={(text) => updateFormData('businessNumber', text)}
              />
              {errors.businessNumber && <Text style={styles.errorText}>{errors.businessNumber}</Text>}
            </View>

            {/* Business Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>업종 *</Text>
              <TextInput
                style={[styles.input, errors.businessType && styles.inputError]}
                placeholder="예: 음식점, 카페, 편의점"
                value={formData.businessType}
                onChangeText={(text) => updateFormData('businessType', text)}
              />
              {errors.businessType && <Text style={styles.errorText}>{errors.businessType}</Text>}
            </View>
          </View>

          {/* Sign Up Button */}
          <Pressable
            style={[styles.signUpButton, isLoading && styles.signUpButtonDisabled]}
            onPress={handleSignUp}
            disabled={isLoading}
          >
            <Text style={styles.signUpButtonText}>
              {isLoading ? "가입 중..." : "회원가입"}
            </Text>
          </Pressable>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>이미 계정이 있으신가요? </Text>
            <Pressable onPress={onGoToLogin}>
              <Text style={styles.loginLink}>로그인</Text>
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
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#404040', // 원본: hsl(25 25% 15%)
    marginBottom: 8,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e67e22', // 원본: hsl(15 85% 58%) - 새로운 따뜻한 오렌지
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e6e6e6', // 원본: hsl(25 30% 90%)
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#262626', // 원본: hsl(15 8% 25%)
  },
  filterButton: {
    padding: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e6e6e6', // 원본: hsl(25 30% 90%)
    borderRadius: 8,
  },
  categoryContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoryContent: {
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e6e6e6', // 원본: hsl(25 30% 90%)
    borderRadius: 20,
  },
  categoryButtonActive: {
    backgroundColor: '#e67e22', // 원본: hsl(15 85% 58%) - 새로운 따뜻한 오렌지
    borderColor: '#e67e22', // 원본: hsl(15 85% 58%) - 새로운 따뜻한 오렌지
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#8a8a8a', // 원본: hsl(15 5% 55%)
  },
  categoryButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  menuList: {
    flex: 1,
  },
  menuListContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  menuItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e6e6e6', // 원본: hsl(25 30% 90%)
  },
  menuItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#262626', // 원본: hsl(15 8% 25%)
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#8a8a8a', // 원본: hsl(15 5% 55%)
    marginBottom: 8,
    lineHeight: 20,
  },
  menuItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e67e22', // 원본: hsl(15 85% 58%) - 새로운 따뜻한 오렌지
  },
  menuItemCategory: {
    fontSize: 12,
    color: '#8a8a8a', // 원본: hsl(15 5% 55%)
    backgroundColor: '#f5f5f5', // 원본: hsl(25 20% 96%)
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  menuItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  statusBadgeSuccess: {
    backgroundColor: '#22c55e', // 원본: hsl(142 70% 50%)
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeTextSuccess: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  statusBadgeWarning: {
    backgroundColor: '#eab308', // 원본: hsl(45 90% 55%)
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeTextWarning: {
    color: '#262626', // 원본: hsl(15 8% 25%)
    fontSize: 12,
    fontWeight: '500',
  },
  statusBadgeSecondary: {
    backgroundColor: '#f5f5f5', // 원본: hsl(25 20% 96%)
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeTextSecondary: {
    color: '#8a8a8a', // 원본: hsl(15 5% 55%)
    fontSize: 12,
    fontWeight: '500',
  },
  recommendedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#e67e22', // 원본: hsl(15 85% 58%) - 새로운 따뜻한 오렌지
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  recommendedText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '500',
  },
  signUpButton: {
    backgroundColor: '#e67e22', // 원본: hsl(15 85% 58%) - 새로운 따뜻한 오렌지
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  signUpButtonDisabled: {
    backgroundColor: '#8a8a8a', // 원본: hsl(15 5% 55%)
  },
  signUpButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  loginText: {
    color: '#8a8a8a', // 원본: hsl(15 5% 55%)
    fontSize: 16,
  },
  loginLink: {
    color: '#e67e22', // 원본: hsl(15 85% 58%) - 새로운 따뜻한 오렌지
    fontSize: 16,
    fontWeight: '600',
  },
}); 