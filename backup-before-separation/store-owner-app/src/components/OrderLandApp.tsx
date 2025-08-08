import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { BottomNav } from "./ui/bottom-nav";
import { EntryFlow } from "./entry/EntryFlow";
import { Toaster } from "./ui/toaster";
import { 
  ClipboardList, 
  UtensilsCrossed, 
  Calendar, 
  TrendingUp, 
  Settings as SettingsIcon 
} from "lucide-react";
import OrderStatus from "../pages/OrderStatus";
import MenuManagement from "../pages/MenuManagement";
import Reservations from "../pages/Reservations";
import SalesAnalytics from "../pages/SalesAnalytics";
import Settings from "../pages/Settings";

type TabId = "orders" | "menu" | "reservations" | "sales" | "settings";

const tabs = [
  {
    id: "orders" as TabId,
    label: "주문현황",
    icon: ClipboardList,
    badge: 3 // Active orders count
  },
  {
    id: "menu" as TabId,
    label: "메뉴관리",
    icon: UtensilsCrossed
  },
  {
    id: "reservations" as TabId,
    label: "예약",
    icon: Calendar,
    badge: 2 // Today's reservations
  },
  {
    id: "sales" as TabId,
    label: "매출",
    icon: TrendingUp
  },
  {
    id: "settings" as TabId,
    label: "설정",
    icon: SettingsIcon
  }
];

export function OrderLandApp() {
  const [showEntryFlow, setShowEntryFlow] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("orders");

  const handleTabChange = (tabId: string) => {
    const tab = tabId as TabId;
    setActiveTab(tab);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case "orders":
        return <OrderStatus />;
      case "menu":
        return <MenuManagement />;
      case "reservations":
        return <Reservations />;
      case "sales":
        return <SalesAnalytics />;
      case "settings":
        return <Settings />;
      default:
        return <OrderStatus />;
    }
  };

  // Show entry flow for first-time users
  if (showEntryFlow) {
    return <EntryFlow onComplete={() => setShowEntryFlow(false)} />;
  }

  return (
    <View style={styles.container}>
      {/* Main Content */}
      {renderActiveTab()}
      
      {/* Bottom Navigation */}
      <BottomNav
        items={tabs.map(tab => ({
          ...tab,
          isActive: activeTab === tab.id
        }))}
        onItemClick={handleTabChange}
      />
      
      {/* Toast Notifications */}
      <Toaster />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefefe', // 원본: hsl(32 100% 98%)
  },
});