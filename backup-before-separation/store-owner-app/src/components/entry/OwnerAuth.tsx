import { useState } from "react";
import { View, Text, Pressable, TextInput, StyleSheet, ScrollView } from "react-native";
import { ArrowLeft } from "lucide-react";

type AuthStep = "phone" | "email" | "business";

interface OwnerAuthProps {
  onLoginSuccess: () => void;
  onBack: () => void;
}

export function OwnerAuth({ onLoginSuccess, onBack }: OwnerAuthProps) {
  const [currentStep, setCurrentStep] = useState<AuthStep>("phone");
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [formData, setFormData] = useState({
    phone: "",
    name: "",
    email: "",
    businessNumber: "",
    businessName: "",
    businessType: ""
  });

  const handlePhoneAuth = async () => {
    if (!formData.phone || !formData.name) {
      console.log("전화번호와 이름을 모두 입력해주세요.");
      return;
    }

    setIsLoading(true);
    // Simulate sending verification code
    setTimeout(() => {
      setIsLoading(false);
      setVerificationSent(true);
      console.log("인증번호를 전송했어요 📱");
    }, 1500);
  };

  const handleVerificationSubmit = () => {
    if (verificationCode.length !== 6) {
      console.log("6자리 인증번호를 모두 입력해주세요.");
      return;
    }

    setCurrentStep("email");
    console.log("전화번호 인증 완료! ✅");
  };

  const handleEmailAuth = async () => {
    if (!formData.email) {
      console.log("이메일 주소를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setCurrentStep("business");
      console.log("인증 메일을 보냈어요 📧");
    }, 1500);
  };

  const handleBusinessInfoSubmit = async () => {
    if (!formData.businessNumber || !formData.businessName || !formData.businessType) {
      console.log("모든 사업자 정보를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess();
      console.log("인증이 완료되었습니다! 🎉");
    }, 2000);
  };

  const renderPhoneStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>전화번호 인증</Text>
      <Text style={styles.stepDescription}>
        본인 확인을 위해 전화번호 인증을 진행해주세요.
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>이름</Text>
        <TextInput
          style={styles.input}
          placeholder="이름을 입력하세요"
          value={formData.name}
          onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            />
      </View>
          
      <View style={styles.inputGroup}>
        <Text style={styles.label}>전화번호</Text>
        <TextInput
          style={styles.input}
          placeholder="010-0000-0000"
          value={formData.phone}
          onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
          keyboardType="phone-pad"
            />
      </View>

      {verificationSent && (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>인증번호</Text>
          <TextInput
            style={styles.input}
            placeholder="6자리 인증번호"
              value={verificationCode}
            onChangeText={setVerificationCode}
            keyboardType="numeric"
              maxLength={6}
            />
        </View>
      )}

      <Pressable
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={verificationSent ? handleVerificationSubmit : handlePhoneAuth}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? "처리중..." : verificationSent ? "인증번호 확인" : "인증번호 받기"}
        </Text>
      </Pressable>
    </View>
  );

  const renderEmailStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>이메일 인증</Text>
      <Text style={styles.stepDescription}>
        사업자 인증을 위해 이메일 인증을 진행해주세요.
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>이메일</Text>
        <TextInput
          style={styles.input}
          placeholder="example@email.com"
            value={formData.email}
          onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
          keyboardType="email-address"
          />
      </View>

      <Pressable
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleEmailAuth}
          disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? "처리중..." : "인증 메일 보내기"}
        </Text>
      </Pressable>
    </View>
  );

  const renderBusinessStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>사업자 정보</Text>
      <Text style={styles.stepDescription}>
        사업자 등록 정보를 입력해주세요.
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>사업자등록번호</Text>
        <TextInput
          style={styles.input}
          placeholder="000-00-00000"
            value={formData.businessNumber}
          onChangeText={(text) => setFormData(prev => ({ ...prev, businessNumber: text }))}
          />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>상호명</Text>
        <TextInput
          style={styles.input}
          placeholder="상호명을 입력하세요"
            value={formData.businessName}
          onChangeText={(text) => setFormData(prev => ({ ...prev, businessName: text }))}
          />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>업종</Text>
        <TextInput
          style={styles.input}
          placeholder="예: 음식점, 카페"
            value={formData.businessType}
          onChangeText={(text) => setFormData(prev => ({ ...prev, businessType: text }))}
        />
      </View>

      <Pressable
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleBusinessInfoSubmit}
          disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? "처리중..." : "인증 완료"}
        </Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#8a8a8a" />
        </Pressable>
        <Text style={styles.headerTitle}>사장님 인증</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress Steps */}
      <View style={styles.progressContainer}>
        {["phone", "email", "business"].map((step, index) => (
          <View key={step} style={styles.progressStep}>
            <View style={[
              styles.progressDot,
              currentStep === step && styles.progressDotActive,
              ["phone", "email", "business"].indexOf(currentStep) > index && styles.progressDotCompleted
            ]}>
              {["phone", "email", "business"].indexOf(currentStep) > index && (
                <Text style={styles.progressCheck}>✓</Text>
              )}
            </View>
            {index < 2 && (
              <View style={[
                styles.progressLine,
                ["phone", "email", "business"].indexOf(currentStep) > index && styles.progressLineActive
              ]} />
            )}
          </View>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {currentStep === "phone" && renderPhoneStep()}
        {currentStep === "email" && renderEmailStep()}
        {currentStep === "business" && renderBusinessStep()}
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
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  progressStep: {
    alignItems: 'center',
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e6e6e6', // 원본: hsl(25 8% 96%)
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotActive: {
    backgroundColor: '#ff6b35', // 원본: hsl(25 95% 53%) - 따뜻한 오렌지
  },
  progressDotCompleted: {
    backgroundColor: '#22c55e', // 원본: hsl(142 76% 36%) - 성공 색상
  },
  progressCheck: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressLine: {
    width: 60,
    height: 2,
    backgroundColor: '#e6e6e6', // 원본: hsl(25 8% 96%)
    marginTop: 8,
  },
  progressLineActive: {
    backgroundColor: '#ff6b35', // 원본: hsl(25 95% 53%) - 따뜻한 오렌지
  },
  content: {
    flex: 1,
    padding: 24,
  },
  stepContainer: {
    gap: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#404040', // 원본: hsl(25 25% 15%)
    textAlign: 'center',
  },
  stepDescription: {
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
  button: {
    backgroundColor: '#ff6b35', // 원본: hsl(25 95% 53%) - 따뜻한 오렌지
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#8a8a8a', // 원본: hsl(25 15% 55%)
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});