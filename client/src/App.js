import './App.css';
import React, { useState, useEffect, useRef } from 'react';
import Home from './components/Home/Home.js';
import Footer from './components/Footer/Footer.js';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login/Login.js';
import Signup from './components/Signup/Signup.js';
import Navigation from './components/Navigation/Navigation.js';
import Profile from './components/Profile/Profile.js';
import AboutUs from './components/AboutUs/aboutUs.js';
import Calendar from './components/Calendar/Calendar.js';
import Contact from './components/Contact/Contact.js';
import Gallery from './components/Gallery/Gallery.js';
import Donate from './components/Donate/Donate.js'
import Feedback from './components/Feedback/Feedback.js'
import Location from './components/Location/location.js';
import Events from './components/Events/Events.js';
import ChatRoom from './components/ChatRoom/ChatRoom.js';
import Admin from './components/Admin/Admin.js';
import PunchCard from './components/PunchCard/PunchCard.js';

function App() {

  return (
    <Router>
      <Navigation/>
      <Routes>
        <Route path="/" element={<Home />}/>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/aboutUs" element={<AboutUs />} />
        <Route path="/calendar" element={<Calendar/>} />
        <Route path="/contact" element = {<Contact/>}/>
        <Route path="/gallery" element={< Gallery/>} />
        <Route path="/events" element={< Events/>} />
        <Route path="/chatroom" element={<ChatRoom/>} />
        <Route path="/donate" element={<Donate/>} />
        <Route path="/feedback" element={<Feedback/>} />
        <Route path="/location" element={<Location/>} />
        <Route path="/punchcard" element={<PunchCard/>} />
      </Routes>
      <Footer/>
    </Router>
  );
}

export default App;
