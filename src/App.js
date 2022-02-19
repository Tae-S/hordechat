import './App.css'

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

import { useAuthState } from 'react-firebase-hooks/auth'
import { useCollectionData } from 'react-firebase-hooks/firestore'
import { Firestore } from 'firebase/firestore'
import { useEffect, useRef, useState } from 'react';

import Filter from 'bad-words'

//NEW
import { query, where, orderBy, limit, onSnapshot } from "firebase/firestore"
import { collection, doc, setDoc, addDoc, getDocs } from "firebase/firestore"
import { getFirestore } from "firebase/firestore"



//firebase init
firebase.initializeApp({
  apiKey: "AIzaSyAFIn-r6UzZLnRZUkOmPcXMyzjMvYavVwM",
  authDomain: "hordechat.firebaseapp.com",
  projectId: "hordechat",
  storageBucket: "hordechat.appspot.com",
  messagingSenderId: "804482395048",
  appId: "1:804482395048:web:dd2d690839cb3a76f38b9d",
  measurementId: "G-62CR7JVG8Z"
})
/**
 * const functions = require("firebase-functions");
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


 */

const firestore = firebase.firestore()
const auth = firebase.auth()

function App() {
  // console.log(document.body.scrollHeight,window.innerHeight)
  const [user] = useAuthState(auth)
  return (
    <div className='app-container'>
      <header></header>
      <section className='section' style={{'height':`${document.body.scrollHeight<= 0?'100%':(Math.max(document.body.scrollHeight,1)) + 'px'}`}}>
        {user?<Chatroom />:<SignIn />}
      </section>
    </div>
  )
}

function SignIn()
{
  const googleSignIn = ()=>{
      const provider = new firebase.auth.GoogleAuthProvider()
      auth.signInWithPopup(provider)
  }
  return(
      <button onClick={()=>googleSignIn()}>Sign in using Google</button>
  )
}

function SignOut()
{
  return auth.currentUser && (
    <button onClick={()=> auth.signOut()}>Sign Out</button>
  )
}


function Chatroom()
{
  // const messageCollection = firebase.firestore.collection('messages')
  // const query = messageCollection.orderBy('createdAt').limit(30)
  
  
  // const messageCollection=  firestore.collection('messages')//OLD
  // const query = messageCollection.orderBy('createdAt','asc').limit(30)//OLD
  


  //NEW
  let messages = []
  const db = getFirestore()
  const messagesRef = collection(db,'messages')
  const messageQuery = query(collection(db,'messages'),orderBy('createdAt','desc'),limit(30))
  let initialSnap 
  useEffect(async ()=>{
    console.log('awaiting..')
    initialSnap = await getDocs(messageQuery)
    initialSnap.forEach((snap)=>{
      messages.push(snap)
      // console.log(snap)
    })
  },[])
  // let initialSnap = 
  
  
  // console.log(typeof(messageQuery),messageQuery)
  // console.log(messages)
  const handleMessages = onSnapshot(messageQuery,(querySnapshot)=>{
    messages = []
    querySnapshot.forEach((doc)=>{
      messages.push(doc.data())
      
    })
    console.log('change,',messages)
  })

  //controlled messageValue
  const [msgValue,setMsgValue] = useState('')
  const [profane,setProfane] = useState(false)
  

  //listen to data change using useCollectionData
  // const [messages] = useCollectionData(query,{idField: 'id'})//OLD

  const dummy = useRef()
  let id
  useEffect(()=>{
    clearTimeout(id)
   id = setTimeout(()=>{
      console.log('ran')
      dummy.current.scrollIntoView({behaviour: 'smooth'})
      const section = document.querySelector('.section')
      section.style.height = `${document.body.scrollHeight<= 0?'100%':(Math.max(document.body.scrollHeight+8,1)) + 'px'}`
    },1400)
    
    // return ()=>{}??OLD
  },[msgValue === null])
  
  const sendMsg = async(e)=>{
    //write to firebase firestore

    e.preventDefault()
    const { uid, photoURL } = auth.currentUser
    if(msgValue.trim() === '')return

    //profanity check
    const filter = new Filter()
    if(filter.isProfane(msgValue)){
      setProfane(true)
    }else setProfane(false)
    // await messagesRef.add({//OLD
    await addDoc(collection(db,"messages"),{
      text:profane?'I got kicked for saying %*$#! and need to get a pass to join the horde again...':msgValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL
    }).then(res=>console.log('added doc',res)).catch((err)=>console.log(err))
      
    // }).then((res)=>console.log(res))//OLD
    setMsgValue('')
    setProfane(false)
    dummy.current.scrollIntoView({behaviour: 'smooth'})
  }
  const handleChange = (e)=>{
    
    // const filter = new Filter()
    // if(filter.isProfane(msgValue)){
    //   console.log('is profane')
    //   setProfane(true)
    // }else setProfane(false)
    
    setMsgValue(e.target.value)
  }
  return(
    <>
      <div className='msg-container'>
        {/* {messages && messages.map((message)=>{return <ChatMessage key={message.id} message={message} />})} */}
        {onSnapshot(messageQuery,(querySnapshot)=>{querySnapshot.forEach((doc)=>{messages=[];messages.push(doc.data())})})}
        {messages.map((message)=> {return <ChatMessage key={message.id} message={message}/>})}
        
      </div>
      <form onSubmit={sendMsg} className='msg-form'>
        <div>
          <input className='msg-field' type='text' onChange={(e)=>handleChange(e)} value={msgValue} placeholder='Let the horde know something new...'/>
        </div>
        <button className='btn ' type='submit'><ion-icon name="send-outline"></ion-icon></button>
      </form>  
      <div ref={dummy}></div>
    </>
  )
}

function ChatMessage(props)
{
  // console.log(props.message)
  const {text, uid, photoURL} = props.message
  console.log(text,uid,photoURL)
  const messageClass = uid === auth.currentUser.uid? 'sender':'other'

  return (
    <>
      <div className={`message ${messageClass}`}>
        <img src={photoURL} />
        <p>{text}</p>
      </div>
      
    </>
  )
}
export default App
