import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Footer.css';

function Footer() {
  const location = useLocation();

  return (
    <footer>
      <div className='pages'>
        <Link className={location.pathname === '/contact' ? 'a current-page' : 'a'} to={'/contact'}>Contact</Link>
        <Link className={location.pathname === '/location' ? 'a current-page' : 'a'} to={'/location'}>Location</Link>
        <Link className={location.pathname === '/aboutUs' ? 'a current-page' : 'a'} to={'/aboutUs'}>About Us</Link>
        <Link className={location.pathname === '/feedback' ? 'a current-page' : 'a'} to={'/feedback'}>Feedback</Link>
      </div>

      <div className='copyright'>
        <p>@ 2024 All Rights Reserved</p>
      </div>
    </footer>
  );
}

export default Footer;