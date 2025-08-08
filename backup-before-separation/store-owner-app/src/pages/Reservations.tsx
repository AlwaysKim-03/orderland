import { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, FlatList } from "react-native";
import { Calendar, Clock, Users, Phone, MapPin, Plus } from "lucide-react";
import { MobileHeader } from "../components/ui/mobile-header";

interface Reservation {
  id: string;
  customerName: string;
  phoneNumber: string;
  date: string;
  time: string;
  guests: number;
  tableNumber?: number;
  status: "confirmed" | "pending" | "cancelled";
  specialRequests?: string;
}

const mockReservations: Reservation[] = [
  {
    id: "1",
    customerName: "김철수",
    phoneNumber: "010-1234-5678",
    date: "2024-01-15",
    time: "18:00",
    guests: 4,
    tableNumber: 3,
    status: "confirmed",
    specialRequests: "창가 자리 부탁드립니다"
  },
  {
    id: "2",
    customerName: "이영희",
    phoneNumber: "010-9876-5432",
    date: "2024-01-15",
    time: "19:30",
    guests: 2,
    status: "pending"
  },
  {
    id: "3",
    customerName: "박민수",
    phoneNumber: "010-5555-1234",
    date: "2024-01-16",
    time: "12:00",
    guests: 6,
    tableNumber: 5,
    status: "confirmed"
  }
];

  const getStatusBadge = (status: Reservation["status"]) => {
    switch (status) {
      case "confirmed":
      return (
        <View style={styles.statusBadgeSuccess}>
          <Text style={styles.statusBadgeTextSuccess}>확정</Text>
        </View>
      );
    case "pending":
      return (
        <View style={styles.statusBadgeWarning}>
          <Text style={styles.statusBadgeTextWarning}>대기중</Text>
        </View>
      );
      case "cancelled":
      return (
        <View style={styles.statusBadgeDestructive}>
          <Text style={styles.statusBadgeTextDestructive}>취소</Text>
        </View>
      );
  }
};

const getStatusColor = (status: Reservation["status"]) => {
  switch (status) {
    case "confirmed":
      return "#22c55e"; // 원본: hsl(142 70% 50%)
    case "pending":
      return "#eab308"; // 원본: hsl(45 90% 55%)
    case "cancelled":
      return "#ef4444"; // 원본: hsl(0 70% 60%)
    }
  };

export default function Reservations() {
  const [reservations, setReservations] = useState(mockReservations);
  const [selectedDate, setSelectedDate] = useState("2024-01-15");

  const todayReservations = reservations.filter(r => r.date === selectedDate);
  const confirmedCount = todayReservations.filter(r => r.status === "confirmed").length;
  const pendingCount = todayReservations.filter(r => r.status === "pending").length;

  const renderReservation = ({ item }: { item: Reservation }) => (
    <View style={styles.reservationCard}>
      <View style={styles.reservationHeader}>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.customerName}</Text>
          <View style={styles.customerMeta}>
            <Phone size={14} color="#8a8a8a" />
            <Text style={styles.phoneNumber}>{item.phoneNumber}</Text>
          </View>
        </View>
        {getStatusBadge(item.status)}
      </View>

      <View style={styles.reservationDetails}>
        <View style={styles.detailRow}>
          <Calendar size={16} color="#8a8a8a" />
          <Text style={styles.detailText}>{item.date}</Text>
        </View>
        <View style={styles.detailRow}>
          <Clock size={16} color="#8a8a8a" />
          <Text style={styles.detailText}>{item.time}</Text>
        </View>
        <View style={styles.detailRow}>
          <Users size={16} color="#8a8a8a" />
          <Text style={styles.detailText}>{item.guests}명</Text>
        </View>
        {item.tableNumber && (
          <View style={styles.detailRow}>
            <MapPin size={16} color="#8a8a8a" />
            <Text style={styles.detailText}>{item.tableNumber}번 테이블</Text>
          </View>
        )}
      </View>

      {item.specialRequests && (
        <View style={styles.specialRequests}>
          <Text style={styles.specialRequestsLabel}>특별 요청:</Text>
          <Text style={styles.specialRequestsText}>{item.specialRequests}</Text>
        </View>
      )}

      <View style={styles.reservationActions}>
        <Pressable style={[styles.actionButton, styles.callButton]}>
          <Phone size={16} color="#e67e22" />
          <Text style={styles.callButtonText}>전화</Text>
        </Pressable>
        <Pressable style={[styles.actionButton, styles.confirmButton]}>
          <Text style={styles.confirmButtonText}>확정</Text>
        </Pressable>
      </View>
    </View>
  );

  // Empty state
  if (reservations.length === 0) {
    return (
      <View style={styles.container}>
        <MobileHeader
          title="예약 관리"
          rightIcon={Plus}
          onRightClick={() => {}}
        />
        
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📅</Text>
          <Text style={styles.emptyTitle}>예약이 없습니다</Text>
          <Text style={styles.emptyDescription}>
            고객들의 예약을 받아보세요
          </Text>
          
          <Pressable style={styles.addButton}>
            <Plus size={20} color="#ffffff" />
            <Text style={styles.addButtonText}>예약 추가</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MobileHeader
        title="예약 관리"
        subtitle={`오늘 ${todayReservations.length}건`}
        rightIcon={Plus}
        onRightClick={() => {}}
      />

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{confirmedCount}</Text>
          <Text style={styles.statLabel}>확정</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{pendingCount}</Text>
          <Text style={styles.statLabel}>대기중</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{todayReservations.length}</Text>
          <Text style={styles.statLabel}>전체</Text>
        </View>
      </View>

      {/* Date Selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.dateContainer}
        contentContainerStyle={styles.dateContent}
      >
        {["2024-01-14", "2024-01-15", "2024-01-16", "2024-01-17", "2024-01-18"].map((date) => (
          <Pressable
            key={date}
            style={[
              styles.dateButton,
              selectedDate === date && styles.dateButtonActive
            ]}
            onPress={() => setSelectedDate(date)}
          >
            <Text style={[
              styles.dateButtonText,
              selectedDate === date && styles.dateButtonTextActive
            ]}>
              {new Date(date).toLocaleDateString('ko-KR', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Reservations List */}
      <FlatList
        data={todayReservations}
        renderItem={renderReservation}
        keyExtractor={(item) => item.id}
        style={styles.reservationsList}
        contentContainerStyle={styles.reservationsListContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefefe', // 원본: hsl(32 100% 98%)
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#262626', // 원본: hsl(15 8% 25%)
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#8a8a8a', // 원본: hsl(15 5% 55%)
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e67e22', // 원본: hsl(15 85% 58%)
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e6e6e6', // 원본: hsl(25 30% 90%)
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e67e22', // 원본: hsl(15 85% 58%)
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8a8a8a', // 원본: hsl(15 5% 55%)
  },
  dateContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  dateContent: {
    gap: 8,
  },
  dateButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e6e6e6', // 원본: hsl(25 30% 90%)
    borderRadius: 20,
  },
  dateButtonActive: {
    backgroundColor: '#e67e22', // 원본: hsl(15 85% 58%)
    borderColor: '#e67e22', // 원본: hsl(15 85% 58%)
  },
  dateButtonText: {
    fontSize: 14,
    color: '#8a8a8a', // 원본: hsl(15 5% 55%)
  },
  dateButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  reservationsList: {
    flex: 1,
  },
  reservationsListContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  reservationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e6e6e6', // 원본: hsl(25 30% 90%)
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#262626', // 원본: hsl(15 8% 25%)
    marginBottom: 4,
  },
  customerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phoneNumber: {
    fontSize: 14,
    color: '#8a8a8a', // 원본: hsl(15 5% 55%)
  },
  reservationDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#262626', // 원본: hsl(15 8% 25%)
  },
  specialRequests: {
    backgroundColor: '#f5f5f5', // 원본: hsl(25 20% 96%)
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  specialRequestsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8a8a8a', // 원본: hsl(15 5% 55%)
    marginBottom: 4,
  },
  specialRequestsText: {
    fontSize: 14,
    color: '#262626', // 원본: hsl(15 8% 25%)
    lineHeight: 20,
  },
  reservationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  callButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e67e22', // 원본: hsl(15 85% 58%)
  },
  callButtonText: {
    color: '#e67e22', // 원본: hsl(15 85% 58%)
    fontSize: 14,
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#e67e22', // 원본: hsl(15 85% 58%)
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
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
  statusBadgeDestructive: {
    backgroundColor: '#ef4444', // 원본: hsl(0 70% 60%)
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeTextDestructive: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
});