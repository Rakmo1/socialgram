const admin = require('firebase-admin');

var serviceAccount = require("../svaccount.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://socialgram-8f52c.firebaseio.com",
  storageBucket: "socialgram-8f52c.appspot.com"
});

const db = admin.firestore();

module.exports = { admin, db };