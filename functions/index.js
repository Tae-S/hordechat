const functions = require("firebase-functions");
const Filter = require('bad-words')

const admin = require('firebase-admin')
admin.initializeApp()

const db = admin.firestore()

exports.detectProfanity = functions.firestore.document('messages/{msgId}').onCreate(async(doc,ctx)=>{
    const filter = new Filter()
    const { text, uid } = doc.data()

    if(filter.isProfane(text)){
        const sanitized = filter.clean(text)
        await doc.ref.update({text:`I got kicked and need to join the horde again...`})
        await db.collection('banned').doc(uid).set({})
    }

})









// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
