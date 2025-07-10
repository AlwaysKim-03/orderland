const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

function toInternationalPhone(value) {
  const onlyNums = value.replace(/\D/g, '');
  if (onlyNums.startsWith('010')) {
    return '+82' + onlyNums.slice(1);
  }
  return value;
}

async function updateAllPhones() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.phone && !data.phone.startsWith('+82')) {
      const newPhone = toInternationalPhone(data.phone);
      await doc.ref.update({ phone: newPhone });
      console.log(`Updated ${doc.id}: ${data.phone} -> ${newPhone}`);
    }
  }
  console.log('변환 완료!');
}

updateAllPhones(); 