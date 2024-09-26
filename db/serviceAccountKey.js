import dotenv from 'dotenv';
dotenv.config('../');

export default {
  type: 'service_account',
  projectId: process.env.FIRESTORE_PROJECT_ID,
  privateKeyId: process.env.FIRESTORE_PRIVATE_KEY_ID,
  privateKey: process.env.FIRESTORE_PRIVATE_KEY,
  clientEmail: process.env.FIRESTORE_CLIENT_EMAIL,
  clientId: process.env.FIRESTORE_CLIENT_ID,
  authUri: 'https://accounts.google.com/o/oauth2/auth',
  tokenUri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url:
    'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-7m4dp%40web2-pwa-project.iam.gserviceaccount.com',
  universeDomain: 'googleapis.com',
};
