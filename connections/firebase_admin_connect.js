// 避免讓金鑰曝光，所以使用環境變數的方式來讀取
// 引入dotenv()這個套件，幫助讀取環境變數
const firebaseAdmin = require('firebase-admin');
require('dotenv').config();

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert({
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  }),
  databaseURL: process.env.FIREBASE_DATABASEURL,
});

const db = firebaseAdmin.database();

module.exports = db; // 把整個金鑰打包輸出，給其他模組使用
