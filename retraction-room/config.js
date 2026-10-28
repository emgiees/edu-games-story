/* ============================================================
   THE RETRACTION ROOM - configuration
   ------------------------------------------------------------
   FIREBASE_CONFIG is the same Firebase project used by the other
   games in edu-games-story (copied from quiz/firebase-config.js).
   This game stores everything under its own branch, ROOT_KEY, so
   it does not touch the data of the other games.

   Test mode: open the game with ?local=1 at the end of the address
   (or delete the databaseURL below) and it runs on this device only,
   with no Firebase at all.

   INSTRUCTOR_PIN protects the instructor console. Change it before
   the first session. Like in the earlier games it is a soft barrier,
   not real security, so keep nothing sensitive in the database
   beyond student names and results.
   ============================================================ */

window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyCSCc7QlbUv8f9Iae8eRZtLo9ER25feXkU",
  authDomain: "my-edu-games.firebaseapp.com",
  databaseURL: "https://my-edu-games-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "my-edu-games",
  storageBucket: "my-edu-games.firebasestorage.app",
  messagingSenderId: "535387410502",
  appId: "1:535387410502:web:512e168834426cdaf93a47"
};

window.RR_CONFIG = {
  ROOT_KEY: 'retraction-room',
  INSTRUCTOR_PIN: '0000'
};
