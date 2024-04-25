import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import image1 from '../assets/baking-home.jpg'
import image2 from '../assets/cooking-home.jpg'
import image3 from '../assets/horse-home.jpg'
import image4 from '../assets/snow-home.jpg'
import image5 from '../assets/stories-home.jpg'
import image6 from '../assets/mission-logo-main.png'
import image7 from '../assets/card1-home.png'
import image8 from '../assets/card2-home.png'
import image9 from '../assets/card3-home.png'
import newsletterPDF from '../assets/newsletter_2024-03-29.pdf';
import './Home.css'

function Home() {
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [subName, setSubName] = useState('');
  const [decodedToken, setDecodedToken] = useState(null);
  const [selectedOption, setSelectedOption] = useState('');
  const [fileNames, setFileNames] = useState([]);
  const [fileIds, setFileIds] = useState([]);

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
      }
      handleSelectPopulation(); // Fetch file names when component mounts
      if (fileNames.length) {
        setSelectedOption(fileNames[0])
      }
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:3001/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, subscriberName :subName }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message ||  'Something went wrong!');
      setMessage(data.message);
    } catch (error) {
      setMessage(error.message || "Something went wrong");
    }
  };

    // Function to handle retriving files to put into the select element
    const handleSelectPopulation = async () => {
      try {
          const response = await fetch(`http://localhost:3001/api/sql/allNewsletters`, {
              method: 'GET',
              headers: {
                  'Content-Type': 'application/json',
              },
          });
          const data = await response.json();
          setFileNames(data.fileNames);
          setFileIds(data.fileIds)
          console.log(fileNames);
          console.log(fileIds);
      } catch (error) {
          console.error('Error fetching fileNames:', error);
      }
    };
    

    // Function to load file content
    const pdfContainerRef = useRef(null);
    const loadFileContent = (url) => {
        // Set the data attribute of the PDF container
        if (pdfContainerRef.current) {
            pdfContainerRef.current.setAttribute('data', url);
        }
    };

    // Function to display pdf
    const displayPDF = async (event) => {
        console.log("Event target value:", event.target.value); // Check the value of event.target.value
        setSelectedOption(event.target.value);
        try {
            const selectedValue = event.target.value;
            console.log("Selected value:", selectedValue);
            if (selectedValue) {
                const fileName = document.getElementById("current-option").value;
                const fileIndex = fileNames.findIndex(file => file === fileName);
                if (fileIndex !== -1) {
                    const fileId = fileIds[fileIndex];
                    console.log("File ID:", fileId, typeof fileId);
                    const url = `https://storage.googleapis.com/se3350-group24_cloudbuild/${fileId}`;
                    console.log(url);
                    // Load the file content
                    loadFileContent(url);
                }
            }
        } catch (error) {
            console.error('Error displaying PDF:', error);
        }
    };

  return (
    <div className='home-container'>
        <div className='mission'>
          <div className='col-img'>
            <img src={image6} alt='img1'/>
          </div>
          <div className='col-text'>
          Ongoing Living & Learning Inc. is a newly 
          established company dedicated to providing 
          support and services for adults with disabilities, 
          including recreation and leisure activities, 
          employment assistance, and caregiver support groups.
          </div>
        </div>

        <div className='gallery'>
          <div className='gallery-header'> 
            <Link className='gallery-link' to={'/gallery'}>Gallery</Link>
          </div>
          <div className='img-grid'>
            <img src={image1} alt='img1'/>
            <img src={image2} alt='img2'/>
            <img src={image3} alt='img3'/>
            <img src={image4} alt='img4'/>
            <img src={image5} alt='img5'/>
          </div>
        </div>

        <div className='fetch'>
        <div className='newsletter'>
          <div className='newsletter-header'>
              <h1>Newsletter</h1>
              <select value={selectedOption} onChange={displayPDF} onMouseEnter={handleSelectPopulation} className='file-option-select' id="current-option">
                      <option value="">Select...</option>
                      {fileNames.map((fileName, index) => (
                      <option key={index} value={fileName}>{fileName}</option>
                      ))}
              </select>
          </div>
          <div className='newsletter-body'>
              <object ref={pdfContainerRef} className='newsletter-pdf' type="application/pdf" width="75%" height="1100px">
                  Your browser may not support PDFs. Please standby, otheriwse download the PDF.
              </object>
          </div>
          <div className='newsletter-signup'>
            <p className='home-p'>Name</p>
            <input className='home-input' type='text' value={subName} onChange={(e) => setSubName(e.target.value)} ></input>
            <p className='home-p'>Email</p>
            <input className='home-input' type='text' value={email}  onChange={(e) => setEmail(e.target.value)} required></input>
            <button className='sub-button' onClick={handleSubscribe}>Subscribe</button>
          </div>
          {message && <p>{message}</p>}
        </div>

        <div className='subdivisions'>
          <ul className='cards'>
            <li className='group'>
              <img src={image7} alt='img1'/>
              <p>Social, recreation, leisure, and 
                friendship program for young adults 
                with intellectual disabilities.</p>
            </li>
            <li className='living'>
              <img src={image8} alt='img1'/>
              <p>An opportunity to practice 
                independent living skills and 
                living with minimal supports.</p>
            </li>
            <li className='works'>
              <img src={image9} alt='img1'/>
              <p>Assisted employment for CHEER Group 
                members providing an opportunity to 
                gain job skills and income. </p>
            </li>
          </ul>
        </div>
    </div>
  </div>
  )
}

export default Home