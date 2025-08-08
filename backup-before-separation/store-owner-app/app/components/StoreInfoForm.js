import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Alert } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export default function StoreInfoForm({ userInfo, onUpdate }) {
  const [formData, setFormData] = useState({
    storeName: userInfo?.storeName || '',
    storeAddress: userInfo?.storeAddress || '',
    storePhone: userInfo?.storePhone || '',
    businessNumber: userInfo?.businessNumber || '',
    representativeName: userInfo?.representativeName || '',
    openingDate: userInfo?.openingDate || '',
    businessHours: userInfo?.businessHours || {
      monday: { open: '09:00', close: '22:00', closed: false },
      tuesday: { open: '09:00', close: '22:00', closed: false },
      wednesday: { open: '09:00', close: '22:00', closed: false },
      thursday: { open: '09:00', close: '22:00', closed: false },
      friday: { open: '09:00', close: '22:00', closed: false },
      saturday: { open: '10:00', close: '23:00', closed: false },
      sunday: { open: '10:00', close: '22:00', closed: false }
    }
  });

  const [isEditing, setIsEditing] = useState(false);

  const days = [
    { key: 'monday', label: '월요일' },
    { key: 'tuesday', label: '화요일' },
    { key: 'wednesday', label: '수요일' },
    { key: 'thursday', label: '목요일' },
    { key: 'friday', label: '금요일' },
    { key: 'saturday', label: '토요일' },
    { key: 'sunday', label: '일요일' }
  ];

  const handleSave = () => {
    if (!formData.storeName.trim()) {
      Alert.alert('오류', '매장명을 입력해주세요.');
      return;
    }

    if (!formData.storeAddress.trim()) {
      Alert.alert('오류', '매장 주소를 입력해주세요.');
      return;
    }

    onUpdate(formData);
    setIsEditing(false);
    Alert.alert('성공', '매장 정보가 저장되었습니다.');
  };

  const handleCancel = () => {
    setFormData({
      storeName: userInfo?.storeName || '',
      storeAddress: userInfo?.storeAddress || '',
      storePhone: userInfo?.storePhone || '',
      businessNumber: userInfo?.businessNumber || '',
      representativeName: userInfo?.representativeName || '',
      openingDate: userInfo?.openingDate || '',
      businessHours: userInfo?.businessHours || formData.businessHours
    });
    setIsEditing(false);
  };

  const updateBusinessHours = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day],
          [field]: value
        }
      }
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>매장 정보</Text>
          <Text style={styles.headerSubtitle}>매장의 기본 정보를 관리합니다</Text>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>기본 정보</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>매장명 *</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={formData.storeName}
              onChangeText={(text) => setFormData({...formData, storeName: text})}
              placeholder="매장명을 입력하세요"
              editable={isEditing}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>매장 주소 *</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={formData.storeAddress}
              onChangeText={(text) => setFormData({...formData, storeAddress: text})}
              placeholder="매장 주소를 입력하세요"
              editable={isEditing}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>전화번호</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={formData.storePhone}
              onChangeText={(text) => setFormData({...formData, storePhone: text})}
              placeholder="전화번호를 입력하세요"
              keyboardType="phone-pad"
              editable={isEditing}
            />
          </View>
        </View>

        {/* Business Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>사업자 정보</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>사업자등록번호</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={formData.businessNumber}
              onChangeText={(text) => setFormData({...formData, businessNumber: text})}
              placeholder="사업자등록번호를 입력하세요"
              editable={isEditing}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>대표자명</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={formData.representativeName}
              onChangeText={(text) => setFormData({...formData, representativeName: text})}
              placeholder="대표자명을 입력하세요"
              editable={isEditing}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>개업일</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={formData.openingDate}
              onChangeText={(text) => setFormData({...formData, openingDate: text})}
              placeholder="YYYY-MM-DD"
              editable={isEditing}
            />
          </View>
        </View>

        {/* Business Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>영업시간</Text>
          
          {days.map((day) => (
            <View key={day.key} style={styles.businessHoursRow}>
              <View style={styles.dayInfo}>
                <Text style={styles.dayLabel}>{day.label}</Text>
                <TouchableOpacity
                  style={[
                    styles.closedToggle,
                    formData.businessHours[day.key].closed && styles.closedToggleActive
                  ]}
                  onPress={() => {
                    if (isEditing) {
                      updateBusinessHours(day.key, 'closed', !formData.businessHours[day.key].closed);
                    }
                  }}
                  disabled={!isEditing}
                >
                  <Text style={[
                    styles.closedToggleText,
                    formData.businessHours[day.key].closed && styles.closedToggleTextActive
                  ]}>
                    {formData.businessHours[day.key].closed ? '휴무' : '영업'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {!formData.businessHours[day.key].closed && (
                <View style={styles.timeInputs}>
                  <TextInput
                    style={[styles.timeInput, !isEditing && styles.inputDisabled]}
                    value={formData.businessHours[day.key].open}
                    onChangeText={(text) => updateBusinessHours(day.key, 'open', text)}
                    placeholder="09:00"
                    editable={isEditing}
                  />
                  <Text style={styles.timeSeparator}>~</Text>
                  <TextInput
                    style={[styles.timeInput, !isEditing && styles.inputDisabled]}
                    value={formData.businessHours[day.key].close}
                    onChangeText={(text) => updateBusinessHours(day.key, 'close', text)}
                    placeholder="22:00"
                    editable={isEditing}
                  />
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {!isEditing ? (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(true)}
            >
              <Ionicons name="create" size={20} color="white" />
              <Text style={styles.editButtonText}>수정</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
              >
                <Ionicons name="checkmark" size={20} color="white" />
                <Text style={styles.saveButtonText}>저장</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    padding: 20,
    backgroundColor: 'white',
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  inputDisabled: {
    backgroundColor: '#F9FAFB',
    color: '#6B7280',
  },
  businessHoursRow: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  dayInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  closedToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
  },
  closedToggleActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  closedToggleText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  closedToggleTextActive: {
    color: 'white',
  },
  timeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'white',
  },
  timeSeparator: {
    marginHorizontal: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  actionButtons: {
    padding: 20,
    backgroundColor: 'white',
    marginTop: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
}); 