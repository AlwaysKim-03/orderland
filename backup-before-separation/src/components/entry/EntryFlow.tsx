import { useState } from "react";
import { LoadingScreen } from "./LoadingScreen";
import { OnboardingSlides } from "./OnboardingSlides";
import { UserTypeSelection } from "./UserTypeSelection";
import { OwnerAuth } from "./OwnerAuth";

type FlowStep = "loading" | "onboarding" | "userType" | "ownerAuth" | "complete";

interface EntryFlowProps {
  onComplete: () => void;
}

export function EntryFlow({ onComplete }: EntryFlowProps) {
  const [currentStep, setCurrentStep] = useState<FlowStep>("loading");

  const handleStepComplete = (nextStep: FlowStep) => {
    setCurrentStep(nextStep);
  };

  const handleSkipToMain = () => {
    onComplete();
  };

  const handleOrderStatus = () => {
    // Go directly to main app with order status
    onComplete();
  };

  switch (currentStep) {
    case "loading":
      return <LoadingScreen onComplete={() => handleStepComplete("onboarding")} />;
    
    case "onboarding":
      return (
        <OnboardingSlides
          onComplete={() => handleStepComplete("userType")}
          onSkip={handleSkipToMain}
        />
      );
    
    case "userType":
      return (
        <UserTypeSelection
          onOwnerSelect={() => handleStepComplete("ownerAuth")}
          onOrderStatus={handleOrderStatus}
        />
      );
    
    case "ownerAuth":
      return (
        <OwnerAuth
          onLoginSuccess={onComplete}
          onBack={() => handleStepComplete("userType")}
        />
      );
    
    default:
      return null;
  }
}