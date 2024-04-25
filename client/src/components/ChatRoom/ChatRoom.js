import React, { useRef, useState, useEffect } from 'react';
import './ChatRoom.css';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';
import 'firebase/compat/analytics';
import profilePic from '../assets/profile-pic.png';
import { useCollectionData } from 'react-firebase-hooks/firestore';

firebase.initializeApp({
  apiKey: "AIzaSyD4bJWPiTTM4N_pVcHnMDWSr9jWQPxaZHc",
  authDomain: "se3350-group24.firebaseapp.com",
  projectId: "se3350-group24",
  storageBucket: "se3350-group24.appspot.com",
  messagingSenderId: "94226991326",
  appId: "1:94226991326:web:5f4af1c863898bdd585a4f",
  measurementId: "G-9XKW5J60DR"
});

const auth = firebase.auth();
const firestore = firebase.firestore();

function ChatRoom() {
  const dummy = useRef();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false); // State to track if the user is an admin


  useEffect(() => {
    const accessToken = localStorage.getItem('access-token');
    if (accessToken) {
      // Fetch user data using access token
      fetch('http://localhost:3001/api/decode-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ accessToken }),
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to decode token');
        }
        return response.json();
      })
      .then(data => {
        setUser(data.decodedToken); // Set the user data
        setIsAdmin(data.decodedToken.role === 'admin'); // Set isAdmin based on user role

      })
      .catch(error => {
        console.error('Error decoding token:', error.message);
      });
    } else {
      console.error('JWT token not found in local storage');
    }
  }, []);

  const [messages] = useCollectionData(
    firestore.collection('messages').orderBy('createdAt').limit(25),
    { idField: 'id' }
  );
  const [formValue, setFormValue] = useState('');

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!user) {
      console.error('User is not authenticated.');
      return;
    }
    const { email, username} = user;
    const messageData = {
      text: formValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      email: email,
      username: username,
      photoURL: profilePic
    };
    try {
      await firestore.collection('messages').add(messageData);
      setFormValue('');
      console.log(username)
      dummy.current.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error('Error sending message:', error.message);
    }
  };

  const clearChat = async () => {
    try {
      const snapshot = await firestore.collection('messages').get();
      const batch = firestore.batch();
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log('Chat cleared successfully.');
    } catch (error) {
      console.error('Error clearing chat:', error.message);
    }
  }

  return (
    <>
      <h1 className='chatHead'>Ongoing Living and Learning Global ChatRoom</h1>
      {isAdmin && (
        <button type="submit"onClick={clearChat} className="clearButton">
          Clear Chat
        </button>
      )}      
      {user && (
        <div> 
          <main className='chatMain'>
            {messages && messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
            <span ref={dummy}></span>
          </main>
          <form onSubmit={sendMessage} className="message-form">
            <ul className='messageList'>
              <li>
                <input className='chatInput' value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder="Talk with your friends!" />
              </li>
              <li>
                <button className='chatEnter' type="submit" disabled={!formValue}>ENTER</button>
              </li>
            </ul>
          </form>
        </div>
      )}
    </>
  );
}

function ChatMessage(props) {
  const { text, email, photoURL, createdAt, username } = props.message;

  // Convert createdAt timestamp to a JavaScript Date object
  const createdAtDate = createdAt ? createdAt.toDate() : null;

  // Check if auth.currentUser exists and has an email property
  const currentUserEmail = auth.currentUser ? auth.currentUser.email : null;

  // Determine messageClass based on whether the message was sent by the current user
  const messageClass = email === currentUserEmail ? 'sent' : 'received';

  // Function to format the date to EST
  const formatToEST = (date) => {
    if (!date) return '';
    return date.toLocaleString('en-US', { timeZone: 'America/New_York' });
  };

  return (
    
    <div className={`message ${messageClass}`}>
      <img className="profilePic" src={photoURL} alt="Profile" />
        <ul>
          <li>
            <p className="username">{username}</p>
          </li>
          <li>
            <p>{text}</p>
          </li>
      </ul>
      
      {createdAtDate && <p className='time'>Sent at {formatToEST(createdAtDate)}</p>}
    </div>
  );
}




export default ChatRoom;
