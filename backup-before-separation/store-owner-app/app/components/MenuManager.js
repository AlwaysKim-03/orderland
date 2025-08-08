import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  Alert, 
  Image, 
  StyleSheet,
  FlatList,
  Switch,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { db, auth } from '../../firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function MenuManager() {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddMenuModalVisible, setAddMenuModalVisible] = useState(false);
  const [isAddCategoryModalVisible, setAddCategoryModalVisible] = useState(false);
  const [isEditMenuModalVisible, setEditMenuModalVisible] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [newMenu, setNewMenu] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    image: '',
    video: ''
  });
  const [newCategory, setNewCategory] = useState({ name: '' });

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Firebase에서 카테고리 데이터 가져오기
    const categoriesQuery = query(
      collection(db, 'categories'), 
      where('storeId', '==', user.uid),
      orderBy('order')
    );
    const unsubCategories = onSnapshot(categoriesQuery, (snapshot) => {
      const categoriesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(categoriesData);
    });

    // Firebase에서 메뉴 데이터 가져오기
    const menuQuery = query(
      collection(db, 'menus'), 
      where('storeId', '==', user.uid),
      orderBy('name')
    );
    const unsubMenus = onSnapshot(menuQuery, (snapshot) => {
      const menuData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMenuItems(menuData);
    });

    return () => {
      unsubCategories();
      unsubMenus();
    };
  }, []);

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      Alert.alert('오류', '카테고리 이름을 입력해주세요.');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('오류', '로그인이 필요합니다.');
        return;
      }

      const categoryData = {
        name: newCategory.name.trim(),
        storeId: user.uid,
        order: categories.length + 1,
        createdAt: new Date()
      };

      await addDoc(collection(db, 'categories'), categoryData);
      setNewCategory({ name: '' });
      setAddCategoryModalVisible(false);
      Alert.alert('성공', `"${newCategory.name}" 카테고리가 추가되었습니다.`);
    } catch (error) {
      Alert.alert('오류', '카테고리 추가에 실패했습니다: ' + error.message);
    }
  };

  const handleAddMenu = async () => {
    if (!newMenu.name || !newMenu.price || !newMenu.categoryId) {
      Alert.alert('오류', '필수 항목을 모두 입력해주세요.');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('오류', '로그인이 필요합니다.');
        return;
      }

      const menuData = {
        ...newMenu,
        storeId: user.uid,
        price: Number(newMenu.price),
        status: {
          soldOut: false,
          ingredientsOut: false,
          salesStopped: false
        },
        createdAt: new Date()
      };

      await addDoc(collection(db, 'menus'), menuData);
      setNewMenu({
        name: '',
        description: '',
        price: '',
        categoryId: '',
        image: '',
        video: ''
      });
      setAddMenuModalVisible(false);
      Alert.alert('성공', `"${newMenu.name}" 메뉴가 추가되었습니다.`);
    } catch (error) {
      Alert.alert('오류', '메뉴 추가에 실패했습니다: ' + error.message);
    }
  };

  const handleEditMenu = async () => {
    if (!editingMenu.name || !editingMenu.price || !editingMenu.categoryId) {
      Alert.alert('오류', '필수 항목을 모두 입력해주세요.');
      return;
    }

    try {
      const menuRef = doc(db, 'menus', editingMenu.id);
      await updateDoc(menuRef, {
        name: editingMenu.name,
        description: editingMenu.description,
        price: Number(editingMenu.price),
        categoryId: editingMenu.categoryId,
        image: editingMenu.image,
        video: editingMenu.video
      });

      setEditMenuModalVisible(false);
      setEditingMenu(null);
      Alert.alert('성공', `"${editingMenu.name}" 메뉴가 수정되었습니다.`);
    } catch (error) {
      Alert.alert('오류', '메뉴 수정에 실패했습니다: ' + error.message);
    }
  };

  const handleToggleStatus = async (menuId, statusType) => {
    try {
      const menu = menuItems.find(item => item.id === menuId);
      if (!menu) return;

      const newStatus = {
        ...menu.status,
        [statusType]: !menu.status[statusType]
      };

      const menuRef = doc(db, 'menus', menuId);
      await updateDoc(menuRef, { status: newStatus });

      const statusText = {
        soldOut: '품절',
        ingredientsOut: '재료 소진',
        salesStopped: '판매 중지'
      };

      Alert.alert('상태 변경됨', `"${menu.name}" ${statusText[statusType]} 상태가 변경되었습니다.`);
    } catch (error) {
      Alert.alert('오류', '상태 변경에 실패했습니다: ' + error.message);
    }
  };

  const handleToggleBadge = async (menuId, badgeType) => {
    try {
      const menu = menuItems.find(item => item.id === menuId);
      if (!menu) return;

      const badgeData = badgeType ? {
        type: badgeType,
        text: badgeType === 'recommend' ? '사장님 추천' :
              badgeType === 'best' ? '베스트 메뉴' : '신메뉴'
      } : null;

      const menuRef = doc(db, 'menus', menuId);
      await updateDoc(menuRef, { badge: badgeData });
    } catch (error) {
      Alert.alert('오류', '배지 변경에 실패했습니다: ' + error.message);
    }
  };

  const handleDeleteMenu = async (menuId) => {
    const menu = menuItems.find(item => item.id === menuId);

    Alert.alert(
      '메뉴 삭제',
      `"${menu?.name}" 메뉴를 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'menus', menuId));
              Alert.alert('성공', `"${menu?.name}" 메뉴가 삭제되었습니다.`);
            } catch (error) {
              Alert.alert('오류', '메뉴 삭제에 실패했습니다: ' + error.message);
            }
          }
        }
      ]
    );
  };

  const handleDeleteCategory = async (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    const categoryMenus = menuItems.filter(item => item.categoryId === categoryId);

    Alert.alert(
      '카테고리 삭제',
      `"${category?.name}" 카테고리와 ${categoryMenus.length}개의 메뉴를 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              // 카테고리 삭제
              await deleteDoc(doc(db, 'categories', categoryId));

              // 해당 카테고리의 메뉴들도 삭제
              for (const menu of categoryMenus) {
                await deleteDoc(doc(db, 'menus', menu.id));
              }

              Alert.alert('성공', `"${category?.name}" 카테고리와 ${categoryMenus.length}개의 메뉴가 삭제되었습니다.`);
            } catch (error) {
              Alert.alert('오류', '카테고리 삭제에 실패했습니다: ' + error.message);
            }
          }
        }
      ]
    );
  };

  const handlePickImage = async (setImageUrl) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const storage = getStorage();
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        const fileRef = ref(storage, `menus/${Date.now()}_${asset.fileName || 'menu'}.jpg`);
        await uploadBytes(fileRef, blob);
        const url = await getDownloadURL(fileRef);
        setImageUrl(url);
      }
    } catch (error) {
      Alert.alert('오류', '이미지 업로드에 실패했습니다: ' + error.message);
    }
  };

  const openEditMenu = (menu) => {
    setEditingMenu({
      ...menu,
      price: menu.price.toString()
    });
    setEditMenuModalVisible(true);
  };

  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === '전체' || item.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusBadge = (status) => {
    if (status?.soldOut) {
      return <View style={styles.badgeSoldOut}><Text style={styles.badgeText}>품절</Text></View>;
    } else if (status?.ingredientsOut) {
      return <View style={styles.badgeIngredients}><Text style={styles.badgeText}>재료 소진</Text></View>;
    } else if (status?.salesStopped) {
      return <View style={styles.badgeStopped}><Text style={styles.badgeText}>판매중지</Text></View>;
    } else {
      return <View style={styles.badgeAvailable}><Text style={styles.badgeText}>판매중</Text></View>;
    }
  };

  const getDefaultIcon = (category) => {
    const icons = {
      "찌개류": "🍲",
      "볶음류": "🍳", 
      "구이류": "🥩",
      "면류": "🍜",
      "밥류": "🍚"
    };
    return icons[category] || "🍽️";
  };

  // Empty state when no menu items
  if (menuItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>메뉴 관리</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setAddMenuModalVisible(true)}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🍽️</Text>
          <Text style={styles.emptyTitle}>메뉴를 추가해보세요!</Text>
          <Text style={styles.emptyDescription}>
            첫 번째 메뉴를 등록하고 고객들에게 맛있는 음식을 소개해보세요
          </Text>
          
          <View style={styles.emptyButtons}>
            <TouchableOpacity
              style={styles.addCategoryButton}
              onPress={() => setAddCategoryModalVisible(true)}
            >
              <Ionicons name="add" size={20} color="#3B82F6" />
              <Text style={styles.addCategoryButtonText}>카테고리 추가</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addMenuButton}
              onPress={() => setAddMenuModalVisible(true)}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.addMenuButtonText}>메뉴 추가</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>메뉴 관리</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setAddMenuModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="메뉴 검색..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
        <TouchableOpacity
          style={[styles.categoryTab, selectedCategory === '전체' && styles.categoryTabActive]}
          onPress={() => setSelectedCategory('전체')}
        >
          <Text style={[styles.categoryTabText, selectedCategory === '전체' && styles.categoryTabTextActive]}>
            전체
          </Text>
        </TouchableOpacity>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[styles.categoryTab, selectedCategory === category.id && styles.categoryTabActive]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text style={[styles.categoryTabText, selectedCategory === category.id && styles.categoryTabTextActive]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Menu List */}
      <FlatList
        data={filteredMenuItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item: menu }) => {
          const category = categories.find(cat => cat.id === menu.categoryId);
          
          return (
            <View style={styles.menuCard}>
              <View style={styles.menuHeader}>
                <View style={styles.menuInfo}>
                  <Text style={styles.menuIcon}>{getDefaultIcon(category?.name)}</Text>
                  <View style={styles.menuDetails}>
                    <Text style={styles.menuName}>{menu.name}</Text>
                    <Text style={styles.menuDescription}>{menu.description}</Text>
                    <Text style={styles.menuCategory}>{category?.name}</Text>
                  </View>
                </View>
                <View style={styles.menuActions}>
                  {getStatusBadge(menu.status)}
                  <Text style={styles.menuPrice}>₩{menu.price?.toLocaleString()}</Text>
                </View>
              </View>

              <View style={styles.menuControls}>
                <View style={styles.statusControls}>
                  <Text style={styles.controlsTitle}>상태 관리</Text>
                  
                  <View style={styles.statusControl}>
                    <View style={styles.statusControlLabel}>
                      <Ionicons name="warning" size={16} color="#EF4444" />
                      <Text style={styles.statusControlText}>품절</Text>
                    </View>
                    <Switch
                      value={menu.status?.soldOut || false}
                      onValueChange={() => handleToggleStatus(menu.id, 'soldOut')}
                    />
                  </View>

                  <View style={styles.statusControl}>
                    <View style={styles.statusControlLabel}>
                      <MaterialIcons name="inventory" size={16} color="#F97316" />
                      <Text style={styles.statusControlText}>재료 소진</Text>
                    </View>
                    <Switch
                      value={menu.status?.ingredientsOut || false}
                      onValueChange={() => handleToggleStatus(menu.id, 'ingredientsOut')}
                    />
                  </View>

                  <View style={styles.statusControl}>
                    <View style={styles.statusControlLabel}>
                      <Ionicons name="stop-circle" size={16} color="#6B7280" />
                      <Text style={styles.statusControlText}>판매 중지</Text>
                    </View>
                    <Switch
                      value={menu.status?.salesStopped || false}
                      onValueChange={() => handleToggleStatus(menu.id, 'salesStopped')}
                    />
                  </View>
                </View>

                <View style={styles.badgeControls}>
                  <Text style={styles.controlsTitle}>추천 뱃지</Text>
                  <View style={styles.badgeButtons}>
                    <TouchableOpacity
                      style={[
                        styles.badgeButton,
                        menu.badge?.type === 'recommend' && styles.badgeButtonActive
                      ]}
                      onPress={() => handleToggleBadge(menu.id, menu.badge?.type === 'recommend' ? null : 'recommend')}
                    >
                      <FontAwesome5 name="crown" size={12} color={menu.badge?.type === 'recommend' ? 'white' : '#6B7280'} />
                      <Text style={[
                        styles.badgeButtonText,
                        menu.badge?.type === 'recommend' && styles.badgeButtonTextActive
                      ]}>사장님 추천</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.badgeButton,
                        menu.badge?.type === 'best' && styles.badgeButtonActive
                      ]}
                      onPress={() => handleToggleBadge(menu.id, menu.badge?.type === 'best' ? null : 'best')}
                    >
                      <FontAwesome5 name="star" size={12} color={menu.badge?.type === 'best' ? 'white' : '#6B7280'} />
                      <Text style={[
                        styles.badgeButtonText,
                        menu.badge?.type === 'best' && styles.badgeButtonTextActive
                      ]}>베스트</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.badgeButton,
                        menu.badge?.type === 'new' && styles.badgeButtonActive
                      ]}
                      onPress={() => handleToggleBadge(menu.id, menu.badge?.type === 'new' ? null : 'new')}
                    >
                      <FontAwesome5 name="award" size={12} color={menu.badge?.type === 'new' ? 'white' : '#6B7280'} />
                      <Text style={[
                        styles.badgeButtonText,
                        menu.badge?.type === 'new' && styles.badgeButtonTextActive
                      ]}>신메뉴</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openEditMenu(menu)}
                  >
                    <Ionicons name="create" size={16} color="#6B7280" />
                    <Text style={styles.editButtonText}>수정</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteMenu(menu.id)}
                  >
                    <Ionicons name="trash" size={16} color="#EF4444" />
                    <Text style={styles.deleteButtonText}>삭제</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.menuList}
      />

      {/* Add Category Modal */}
      <Modal
        visible={isAddCategoryModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddCategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>카테고리 추가</Text>
            <Text style={styles.modalSubtitle}>새로운 메뉴 카테고리를 추가합니다.</Text>

            <TextInput
              style={styles.input}
              placeholder="카테고리 이름 (예: 국물류, 육류, 음료)"
              value={newCategory.name}
              onChangeText={(text) => setNewCategory({ name: text })}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setAddCategoryModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleAddCategory}
              >
                <Text style={styles.confirmButtonText}>추가</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Menu Modal */}
      <Modal
        visible={isAddMenuModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddMenuModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>메뉴 추가</Text>
            <Text style={styles.modalSubtitle}>새로운 메뉴를 추가합니다.</Text>

            <TextInput
              style={styles.input}
              placeholder="메뉴 이름"
              value={newMenu.name}
              onChangeText={(text) => setNewMenu({...newMenu, name: text})}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="메뉴 설명"
              value={newMenu.description}
              onChangeText={(text) => setNewMenu({...newMenu, description: text})}
              multiline
              numberOfLines={3}
            />

            <TextInput
              style={styles.input}
              placeholder="가격"
              value={newMenu.price}
              onChangeText={(text) => setNewMenu({...newMenu, price: text})}
              keyboardType="numeric"
            />

            <View style={styles.selectContainer}>
              <Text style={styles.selectLabel}>카테고리</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryOption,
                      newMenu.categoryId === category.id && styles.categoryOptionActive
                    ]}
                    onPress={() => setNewMenu({...newMenu, categoryId: category.id})}
                  >
                    <Text style={[
                      styles.categoryOptionText,
                      newMenu.categoryId === category.id && styles.categoryOptionTextActive
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.imageUploadContainer}>
              <Text style={styles.imageUploadLabel}>이미지</Text>
              <View style={styles.imageUploadRow}>
                <TextInput
                  style={[styles.input, styles.imageInput]}
                  placeholder="이미지 URL (선택사항)"
                  value={newMenu.image}
                  onChangeText={(text) => setNewMenu({...newMenu, image: text})}
                />
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => handlePickImage((url) => setNewMenu({...newMenu, image: url}))}
                >
                  <Ionicons name="cloud-upload" size={20} color="#3B82F6" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.imageUploadContainer}>
              <Text style={styles.imageUploadLabel}>동영상</Text>
              <View style={styles.imageUploadRow}>
                <TextInput
                  style={[styles.input, styles.imageInput]}
                  placeholder="동영상 URL (선택사항)"
                  value={newMenu.video}
                  onChangeText={(text) => setNewMenu({...newMenu, video: text})}
                />
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => handlePickImage((url) => setNewMenu({...newMenu, video: url}))}
                >
                  <Ionicons name="videocam" size={20} color="#3B82F6" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setAddMenuModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleAddMenu}
              >
                <Text style={styles.confirmButtonText}>추가</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Menu Modal */}
      <Modal
        visible={isEditMenuModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditMenuModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>메뉴 수정</Text>
            <Text style={styles.modalSubtitle}>메뉴 정보를 수정합니다.</Text>

            <TextInput
              style={styles.input}
              placeholder="메뉴 이름"
              value={editingMenu?.name || ''}
              onChangeText={(text) => setEditingMenu({...editingMenu, name: text})}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="메뉴 설명"
              value={editingMenu?.description || ''}
              onChangeText={(text) => setEditingMenu({...editingMenu, description: text})}
              multiline
              numberOfLines={3}
            />

            <TextInput
              style={styles.input}
              placeholder="가격"
              value={editingMenu?.price || ''}
              onChangeText={(text) => setEditingMenu({...editingMenu, price: text})}
              keyboardType="numeric"
            />

            <View style={styles.selectContainer}>
              <Text style={styles.selectLabel}>카테고리</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryOption,
                      editingMenu?.categoryId === category.id && styles.categoryOptionActive
                    ]}
                    onPress={() => setEditingMenu({...editingMenu, categoryId: category.id})}
                  >
                    <Text style={[
                      styles.categoryOptionText,
                      editingMenu?.categoryId === category.id && styles.categoryOptionTextActive
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.imageUploadContainer}>
              <Text style={styles.imageUploadLabel}>이미지</Text>
              <View style={styles.imageUploadRow}>
                <TextInput
                  style={[styles.input, styles.imageInput]}
                  placeholder="이미지 URL (선택사항)"
                  value={editingMenu?.image || ''}
                  onChangeText={(text) => setEditingMenu({...editingMenu, image: text})}
                />
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => handlePickImage((url) => setEditingMenu({...editingMenu, image: url}))}
                >
                  <Ionicons name="cloud-upload" size={20} color="#3B82F6" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.imageUploadContainer}>
              <Text style={styles.imageUploadLabel}>동영상</Text>
              <View style={styles.imageUploadRow}>
                <TextInput
                  style={[styles.input, styles.imageInput]}
                  placeholder="동영상 URL (선택사항)"
                  value={editingMenu?.video || ''}
                  onChangeText={(text) => setEditingMenu({...editingMenu, video: text})}
                />
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => handlePickImage((url) => setEditingMenu({...editingMenu, video: url}))}
                >
                  <Ionicons name="videocam" size={20} color="#3B82F6" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditMenuModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleEditMenu}
              >
                <Text style={styles.confirmButtonText}>저장</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    padding: 20,
    backgroundColor: 'white',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  categoryContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  categoryTabActive: {
    backgroundColor: '#3B82F6',
  },
  categoryTabText: {
    fontSize: 14,
    color: '#6B7280',
  },
  categoryTabTextActive: {
    color: 'white',
  },
  menuList: {
    padding: 20,
  },
  menuCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  menuInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  menuIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  menuDetails: {
    flex: 1,
  },
  menuName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  menuCategory: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  menuActions: {
    alignItems: 'flex-end',
  },
  menuPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginTop: 4,
  },
  menuControls: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  statusControls: {
    marginBottom: 16,
  },
  controlsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  statusControl: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusControlLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusControlText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 4,
  },
  badgeControls: {
    marginBottom: 16,
  },
  badgeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  badgeButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  badgeButtonText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  badgeButtonTextActive: {
    color: 'white',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  editButtonText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#EF4444',
    marginLeft: 4,
  },
  badgeSoldOut: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeIngredients: {
    backgroundColor: '#F97316',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeStopped: {
    backgroundColor: '#6B7280',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeAvailable: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  emptyButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  addCategoryButtonText: {
    fontSize: 16,
    color: '#3B82F6',
    marginLeft: 8,
  },
  addMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
  },
  addMenuButtonText: {
    fontSize: 16,
    color: 'white',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  selectContainer: {
    marginBottom: 16,
  },
  selectLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  categoryOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  categoryOptionActive: {
    backgroundColor: '#3B82F6',
  },
  categoryOptionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  categoryOptionTextActive: {
    color: 'white',
  },
  imageUploadContainer: {
    marginBottom: 16,
  },
  imageUploadLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  imageUploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  imageInput: {
    flex: 1,
  },
  uploadButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  confirmButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
  },
  confirmButtonText: {
    fontSize: 14,
    color: 'white',
  },
}); 