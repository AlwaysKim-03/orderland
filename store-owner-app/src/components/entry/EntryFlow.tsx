import { useState, useEffect } from "react";
import { LoadingScreen } from "./LoadingScreen";
import { OnboardingSlides } from "./OnboardingSlides";
import { UserTypeSelection } from "./UserTypeSelection";
import { OwnerAuth } from "./OwnerAuth";
import { LoginScreen } from "../auth/LoginScreen";
import { SignUpScreen } from "../auth/SignUpScreen";

type FlowStep = 
  | "loading" 
  | "onboarding" 
  | "userTypeSelection" 
  | "ownerAuth" 
  | "login" 
  | "signup";

interface EntryFlowProps {
  onComplete: () => void;
}

export function EntryFlow({ onComplete }: EntryFlowProps) {
  const [currentStep, setCurrentStep] = useState<FlowStep>("loading");
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    // 로딩 완료 후 온보딩 또는 사용자 타입 선택으로 이동
    const timer = setTimeout(() => {
      if (hasSeenOnboarding) {
        setCurrentStep("userTypeSelection");
      } else {
        setCurrentStep("onboarding");
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [hasSeenOnboarding]);

  const handleOnboardingComplete = () => {
    setHasSeenOnboarding(true);
    setCurrentStep("userTypeSelection");
  };

  const handleOnboardingSkip = () => {
    setHasSeenOnboarding(true);
    setCurrentStep("userTypeSelection");
  };

  const handleOwnerSelect = () => {
    setCurrentStep("login");
  };

  const handleOrderStatus = () => {
    // 주문 현황 모드로 바로 이동
    onComplete();
  };

  const handleLoginSuccess = () => {
    onComplete();
  };

  const handleSignUpSuccess = () => {
    setCurrentStep("login");
  };

  const handleGoToSignUp = () => {
    setCurrentStep("signup");
  };

  const handleGoToLogin = () => {
    setCurrentStep("login");
  };

  const handleBackToUserType = () => {
    setCurrentStep("userTypeSelection");
  };

  const handleBackToLogin = () => {
    setCurrentStep("login");
  };

  switch (currentStep) {
    case "loading":
      return <LoadingScreen onComplete={() => {}} />;
    
    case "onboarding":
      return (
        <OnboardingSlides
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      );
    
    case "userTypeSelection":
      return (
        <UserTypeSelection
          onOwnerSelect={handleOwnerSelect}
          onOrderStatus={handleOrderStatus}
        />
      );
    
    case "login":
      return (
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onBack={handleBackToUserType}
          onGoToSignUp={handleGoToSignUp}
        />
      );

    case "signup":
      return (
        <SignUpScreen
          onSignUpSuccess={handleSignUpSuccess}
          onBack={handleBackToLogin}
          onGoToLogin={handleGoToLogin}
        />
      );
    
    default:
      return <LoadingScreen onComplete={() => {}} />;
  }
}