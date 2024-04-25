import React from 'react';
import './Contact.css';
import facebookimg from '../assets/facebook-logo.png'


function Contact() {

  const handleSubmit = () => {
    const subject = document.querySelector('.subject').value;
    const message = document.querySelector('.Message').value;
    const email = 'ihartmancheer@gmail.com';
    
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    
    window.location.href = mailtoLink;
  };


  return (
    <div className="contact-container">
      <ul className="contactText">
        <li className="contactList">
          {/* <label className="bold-text">Subject</label> */}
          <input className="subject" placeholder="Subject"></input>
          {/* <label className="bold-text">Message</label> */}
          <textarea className="Message" placeholder="Message"></textarea>
          {<br></br>}
          <button className='submit-button' onClick={handleSubmit}>Submit</button>
        </li>
      </ul>

      <div className='msgbox'>
        <label className="bold-text">Contact</label>
        <p className="sub-text">ihartmancheer@gmail.com</p>
        {<br></br>}
        <label className="bold-text">Based In</label>
        <p className="sub-text">Arkona, Ontario, Canada</p>
        {<br></br>}
        <a href="https://www.facebook.com/familyconnectionscheer" target="_blank" rel="noopener noreferrer">
        <img className ="fimage" src={facebookimg} alt="Facebook"></img>
      </a>
      </div>
    </div>
  );
}

export default Contact;