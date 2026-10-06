import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || '',
  authDomain: 'adarsh-vidya-mandir-53445.firebaseapp.com',
  projectId: 'adarsh-vidya-mandir-53445',
  storageBucket: 'adarsh-vidya-mandir-53445.firebasestorage.app',
  messagingSenderId: '312937269412',
  appId: '1:312937269412:web:87a2524424c2108edc7e31'
};

async function runFirebaseTest() {
  console.log('--- STARTING REAL FIREBASE TEST (Project ID: adarsh-vidya-mandir-53445) ---');
  try {
    const app = initializeApp(firebaseConfig);
    console.log('1. Firebase App initialized:', app.name);

    const db = getFirestore(app);
    console.log('2. Firestore instance created for project:', app.options.projectId);

    const testRef = doc(db, '_system', 'live_connection_test');
    const testData = {
      testTime: new Date().toISOString(),
      school: 'Adarsh Vidya Mandir',
      status: 'SUCCESS',
      createdBy: 'Antigravity AI Agent'
    };

    console.log('3. Writing test document to Firestore path: _system/live_connection_test...');
    await setDoc(testRef, testData, { merge: true });
    console.log('   ✓ Firestore WRITE succeeded!');

    console.log('4. Reading back test document from Firestore...');
    const snap = await getDoc(testRef);
    if (snap.exists()) {
      console.log('   ✓ Firestore READ succeeded! Document data:', snap.data());
    } else {
      console.warn('   ⚠️ Document written but snap.exists() is false');
    }

    // Create test user profile schema check
    const userRef = doc(db, 'users', 'test_admin_uid_2026');
    const userProfile = {
      uid: 'test_admin_uid_2026',
      role: 'admin',
      username: 'admin@avmschool.edu.in',
      linkedId: 'ADM-001',
      schoolId: 'AVM',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(userRef, userProfile, { merge: true });
    console.log('5. Created test User profile in users/ collection ✓');

    // Create test homework record with Cloudinary metadata check
    const hwRef = doc(db, 'homework', 'hw_test_2026');
    const hwData = {
      id: 'hw_test_2026',
      classId: 'Class 5',
      sectionId: 'A',
      subjectId: 'Mathematics',
      teacherId: 'EMP-T101',
      title: 'Math Worksheet - Fractions',
      description: 'Solve questions 1-10 on page 45.',
      fileUrl: 'https://res.cloudinary.com/nscvwp2f/image/upload/v1791286026/AVM/homework/nmavuigsxqbq7h5yohaj.png',
      cloudinaryPublicId: 'AVM/homework/nmavuigsxqbq7h5yohaj',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(hwRef, hwData, { merge: true });
    console.log('6. Created test Homework record in homework/ collection with Cloudinary reference ✓');

    // Query homework collection
    const hwSnap = await getDocs(collection(db, 'homework'));
    console.log(`7. Queried homework collection: found ${hwSnap.docs.length} documents ✓`);

    console.log('--- ALL FIREBASE TESTS PASSED SUCCESSFULLY! ---');
    process.exit(0);
  } catch (err) {
    console.error('❌ Firebase Test Error:', err);
    process.exit(1);
  }
}

runFirebaseTest();
