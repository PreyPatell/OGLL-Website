import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';
import logo from '../assets/OLLI LOGO transparent.png'

const Navigation = () => {
  const location = useLocation();
  const token = localStorage.getItem('access-token');
  const [decodedToken, setDecodedToken] = useState(null);

  const handleSignOut = () => {
    // Clear access token from localStorage
    localStorage.removeItem('access-token');
    // Redirect user to the home page
  };

  useEffect(() => {
    const accessToken = localStorage.getItem('access-token');
    console.log(accessToken);

    if (accessToken) {
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
            console.log(data)
            setDecodedToken(data.decodedToken);
        })
        .catch(error => {
            console.error('Error decoding token:', error.message);
        });
    } else {
        console.error('JWT token not found in local storage');
        setDecodedToken(null);
    }
  }, [token]);

  return (
    <nav className="navbar">
      <ul>
        <div className="page-title">
          <img src={logo} alt="OOL Logo" className="logo" />
          <span className="brand-text">Ongoing Living & <br/> Learning Inc.</span>
        </div>
        <li><Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link></li>
        <li><Link to="/events" className={location.pathname === '/events' ? 'active' : ''}>Events</Link></li>
        <li><Link to="/donate" className={location.pathname === '/donate' ? 'active' : ''}>Donate</Link></li>
        <li><Link to="/gallery" className={location.pathname === '/gallery' ? 'active' : ''}>Gallery</Link></li>
        <li><Link to="/chatroom" className={location.pathname === '/chatroom' ? 'active' : ''}>Chatroom</Link></li>
        <li><Link to="/profile" className={location.pathname === '/profile' ? 'active' : ''}>Profile</Link></li>
        {decodedToken && decodedToken.role == 'employee' && (<li><Link to="/punchcard" className={location.pathname === '/punchcard' ? 'active' : ''}>PunchCard</Link></li>)}
        {decodedToken && decodedToken.role == 'admin' &&(<li><Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''}>Admin</Link></li>)}
      </ul>

    {!token && (
      <ul className='loginsignup'>
        <li><Link to="/login" className={location.pathname === '/login' ? 'active' : ''}>Login</Link></li>
        <li><Link to="/signup" className={location.pathname === '/signup' ? 'active' : ''}>Sign Up</Link></li>
      </ul>
      )}

    {token &&(
      <ul className='signout'>
        <li><Link to="/" onClick={handleSignOut} className={location.pathname === '/'}>Signout</Link></li>
      </ul>
    )}
    </nav>
    
  );
}

export default Navigation;
