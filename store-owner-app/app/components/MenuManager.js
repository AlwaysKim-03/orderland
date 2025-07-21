import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, TextInput, StyleSheet, Alert, Modal, Image, TouchableOpacity } from 'react-native';
import { db, auth } from '../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function MenuManager() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: '', imageUrl: '' });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [categoryInput, setCategoryInput] = useState('');

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // 웹앱과 동일한 구조로 데이터 가져오기
    const unsubProducts = onSnapshot(
      query(collection(db, 'products'), where('storeId', '==', user.uid)),
      (snap) => {
        setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    );
    
    const unsubCats = onSnapshot(
      query(collection(db, 'categories'), where('storeId', '==', user.uid), orderBy('createdAt')),
      (snap) => {
        setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    );
    
    return () => { unsubProducts(); unsubCats(); };
  }, []);

  const openProductModal = (product = null) => {
    setEditingProduct(product);
    setNewProduct(product ? { ...product } : { name: '', price: '', category: categories[0]?.name || '', imageUrl: '' });
    setModalVisible(true);
  };

  const handlePickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({ 
        mediaTypes: ImagePicker.MediaTypeOptions.Images, 
        allowsEditing: true, 
        quality: 0.7 
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const storage = getStorage();
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        const fileRef = ref(storage, `products/${Date.now()}_${asset.fileName || 'product'}.jpg`);
        await uploadBytes(fileRef, blob);
        const url = await getDownloadURL(fileRef);
        setNewProduct(m => ({ ...m, imageUrl: url }));
      }
    } catch (error) {
      Alert.alert('오류', '이미지 업로드에 실패했습니다: ' + error.message);
    }
  };

  const handleSaveProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.category) {
      Alert.alert('오류', '모든 필드를 입력해주세요.');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('오류', '로그인이 필요합니다.');
        return;
      }

      const productData = {
        ...newProduct,
        storeId: user.uid,
        price: Number(newProduct.price),
        createdAt: new Date()
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
        Alert.alert('성공', '상품이 수정되었습니다.');
      } else {
        await addDoc(collection(db, 'products'), productData);
        Alert.alert('성공', '상품이 추가되었습니다.');
      }
      setModalVisible(false);
    } catch (error) {
      Alert.alert('오류', '상품 저장에 실패했습니다: ' + error.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      Alert.alert('성공', '상품이 삭제되었습니다.');
    } catch (error) {
      Alert.alert('오류', '상품 삭제에 실패했습니다: ' + error.message);
    }
  };

  const handleAddCategory = async () => {
    if (!categoryInput.trim()) {
      Alert.alert('오류', '카테고리명을 입력해주세요.');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('오류', '로그인이 필요합니다.');
        return;
      }

      await addDoc(collection(db, 'categories'), { 
        name: categoryInput.trim(),
        storeId: user.uid,
        createdAt: new Date()
      });
      setCategoryInput('');
      Alert.alert('성공', '카테고리가 추가되었습니다.');
    } catch (error) {
      Alert.alert('오류', '카테고리 추가에 실패했습니다: ' + error.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
      Alert.alert('성공', '카테고리가 삭제되었습니다.');
    } catch (error) {
      Alert.alert('오류', '카테고리 삭제에 실패했습니다: ' + error.message);
    }
  };

  return (
    <View style={styles.box}>
      <Text style={styles.sectionTitle}>음식메뉴 관리</Text>
      <View style={{ flexDirection: 'row', marginBottom: 12 }}>
        <TextInput style={styles.input} placeholder="카테고리 추가" value={categoryInput} onChangeText={setCategoryInput} />
        <Button title="추가" onPress={handleAddCategory} />
      </View>
      <FlatList
        data={categories}
        keyExtractor={item => item.id}
        horizontal
        renderItem={({ item }) => (
          <View style={styles.catBox}>
            <Text>{item.name}</Text>
            <TouchableOpacity onPress={() => handleDeleteCategory(item.id)}><Text style={{ color: '#d32f2f' }}>삭제</Text></TouchableOpacity>
          </View>
        )}
        style={{ marginBottom: 12 }}
      />
      <Button title="메뉴 추가" onPress={() => openProductModal()} />
      <FlatList
        data={products}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.productItem}>
            {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.productImg} /> : null}
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
              <Text>{item.price}원</Text>
              <Text>{item.category}</Text>
            </View>
            <Button title="수정" onPress={() => openProductModal(item)} />
            <Button title="삭제" color="#d32f2f" onPress={() => handleDeleteProduct(item.id)} />
          </View>
        )}
      />
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>{editingProduct ? '메뉴 수정' : '메뉴 추가'}</Text>
            <TextInput style={styles.input} placeholder="메뉴명" value={newProduct.name} onChangeText={v => setNewProduct(m => ({ ...m, name: v }))} />
            <TextInput style={styles.input} placeholder="가격" value={String(newProduct.price)} keyboardType="number-pad" onChangeText={v => setNewProduct(m => ({ ...m, price: v }))} />
            <TextInput style={styles.input} placeholder="카테고리" value={newProduct.category} onChangeText={v => setNewProduct(m => ({ ...m, category: v }))} />
            {newProduct.imageUrl ? <Image source={{ uri: newProduct.imageUrl }} style={styles.productImg} /> : null}
            <Button title="이미지 선택" onPress={handlePickImage} />
            <View style={{ flexDirection: 'row', marginTop: 12 }}>
              <Button title="저장" onPress={handleSaveProduct} />
              <Button title="취소" color="#aaa" onPress={() => setModalVisible(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: '#f8f8f8', borderRadius: 8, padding: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginRight: 8, flex: 1 },
  catBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, padding: 8, marginRight: 8, borderWidth: 1, borderColor: '#eee' },
  productItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, padding: 8, marginBottom: 8, borderWidth: 1, borderColor: '#eee' },
  productImg: { width: 60, height: 60, borderRadius: 8, marginRight: 8 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: 320 },
}); 