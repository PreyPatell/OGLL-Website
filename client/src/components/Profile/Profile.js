import React, { useState, useEffect, useRef } from 'react';
import './Profile.css';
import newsletterPDF from '../assets/newsletter_2024-03-29.pdf';


function Profile() {

    const [decodedToken, setDecodedToken] = useState(null);
    const [profileData, setProfileData] = useState(null); // State to store user profile data

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
                // Fetch user profile data based on decoded email
                fetchUserProfile(data.decodedToken.email);
            })
            .catch(error => {
                console.error('Error decoding token:', error.message);
            });
        } else {
            console.error('JWT token not found in local storage');
        }
    }, []);
    
    // Function to fetch user profile data based on email
    const fetchUserProfile = (email) => {
        fetch('http://localhost:3001/api/profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch user profile');
            }
            return response.json();
        })
        .then(data => {
            console.log(data.userProfile)
            setProfileData(data.userProfile);
            // Initialize state variables after fetching user profile data
            setFirstName(data.userProfile.fName ? data.userProfile.fName : '');
            setLastName(data.userProfile.lName ? data.userProfile.lName : '');
            setUsername(data.userProfile.username ? data.userProfile.username : '');
            setEmail(data.userProfile.email ? data.userProfile.email : '');
            setAddress(data.userProfile.address ? data.userProfile.address : '');
            setCity(data.userProfile.city ? data.userProfile.city : '');
            setProvince(data.userProfile.province ? data.userProfile.province : '');
            setEmailNotifications(data.userProfile.isNotification ? Boolean(data.userProfile.isNotification) : false);
        })
        .catch(error => {
            console.error('Error fetching user profile:', error.message);
        });
    };
    
    // State variables are initialized after fetching user profile data
    const [pageTitle, setPageTitle] = useState('Edit Profile');
    const [firstName, setFirstName] = useState(''); // Initialize empty
    const [username, setUsername] = useState(''); // Initialize empty
    const [lastName, setLastName] = useState(''); // Initialize empty
    const [email, setEmail] = useState(''); // Initialize empty
    const [address, setAddress] = useState(''); // Initialize empty
    const [city, setCity] = useState(''); // Initialize empty
    const [province, setProvince] = useState(''); // Initialize empty
    const [emailNotifications, setEmailNotifications] = useState(false); // Initialize with false
    const [subscriber, setSubscriber] = useState(false); // Initialize with false

    const [responseMessage, setResponseMessage] = useState('')
    

    const handleSaveProfile = () => {
        const updateData = {
            email: decodedToken.email,
            fName: firstName,
            lName: lastName,
            address: address,
            city: city,
            province: province,
        };
    
        fetch('http://localhost:3001/api/update-profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to update profile');
            }
            return response.json();
        })
        .then(data => {
            console.log('Profile updated successfully:', data.message);
            setResponseMessage(data.message)
            // Optionally, you can perform additional actions after successfully updating the profile
        })
        .catch(error => {
            console.error('Error updating profile:', error.message);
        });
    };

    const handleSaveNotification = () => {
        const updateData = {
            email: decodedToken.email,
            isNotification: emailNotifications,
            isSubscriber: subscriber
        };
    
        fetch('http://localhost:3001/api/update-profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to update notification settings');
            }
            return response.json();
        })
        .then(data => {
            console.log('Notification settings updated successfully:', data.message);
            setResponseMessage('Notification settings updated successfully')
            // Optionally, you can perform additional actions after successfully updating the notification settings
        })
        .catch(error => {
            console.error('Error updating notification settings:', error.message);
        });
    };

    const [selectedOption, setSelectedOption] = useState('');
    const [fileContent, setFileContent] = useState('');
    const [fileNames, setFileNames] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [showErrorMessage, setShowErrorMessage] = useState(false);
    const [showSuccessDeleteMessage, setShowSuccessDeleteMessage] = useState(false);
    const [showErrorDeleteMessage, setShowErrorDeleteMessage] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    // Function to handle creating a unique fileId
    function uuidv4() {
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
          (
            c ^
            (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
          ).toString(16)
        );
    }

    // Function to check if user has file with that name
    const doesFileExist = async () => {
        try {
            const response = await fetch(`http://localhost:3001/api/sql/filenames/${decodedToken.email}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            console.log('API Response:', data); // Log the API response
            if(data.fileNames.includes(selectedFile.name)){
                console.log('File exists:', selectedFile.name);
                setStatusMessage("This file already exists.");
                return true;
            }
            else {
                console.log('File does not exist:', selectedFile.name);
                return false;
            }
        } catch (error) {
            console.error('Error fetching fileIds:', error);
            return false; // Handle error gracefully
        }
    };

    // Uploading the pdf to sql and gcs
    const handleUploadPdf = async () => {
        try {
            const fileExists = await doesFileExist(); // Wait for the result of doesFileExist
            if (fileExists === true) {
                setShowErrorMessage(true);
            } else {
                let postId = uuidv4();
                let input = document.getElementById('fileInput');
                const file = input.files[0];
    
                // Create a new File object with the modified name
                let newFile = new File([file], `${postId}_post.pdf`, { type: "application/pdf" });
    
                // Uploading file to Google Cloud Storage and SQL
                let formData = new FormData();
                formData.append("fileInput", newFile);
    
                const fileName = document.getElementById('file-name').textContent;
    
                const data = {
                    fileId: postId + "_post.pdf",
                    email: decodedToken.email,
                    fileName: fileName,
                    fileType: decodedToken.role
                };
    
                formData.append("fileData", JSON.stringify(data));
    
                const uploadResponse = await fetch("http://localhost:3001/api/uploadFile", {
                    method: "POST",
                    body: formData,
                });
    
                const uploadResult = await uploadResponse.json();
                console.log(uploadResult);
    
                setShowSuccessMessage(true);
                setShowErrorMessage(false);
            }
        } catch (error) {
            console.error('Error handling PDF upload:', error);
            setShowSuccessMessage(false); // Hide success message if it was shown before
            setShowErrorMessage(true);
        }
    };
    

    // Function to handle retriving files to put into the select element
    const handleSelectPopulation = async () => {
        try {
            const response = await fetch(`http://localhost:3001/api/sql/fileNames/${decodedToken.email}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            setFileNames(data.fileNames);
            
        } catch (error) {
            console.error('Error fetching fileNames:', error);
        }
    };


    // Handling setting the file name 
    const [fileName, setFileName] = useState('No File Chosen');
    const handleFileChange = (e) => {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (file) {
        setFileName(file.name);
      } else {
        setFileName('No File Chosen');
      }
    };
  
    // Handling the downloading of a file to users browser
    const handleDownload = () => {
      if (selectedFile) {
        const url = URL.createObjectURL(selectedFile);
        const a = document.createElement('a');
        a.href = url;
        a.download = selectedFile.name;
        console.log(selectedFile.name)
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    };

    const returnFileId = async () => {
        const fileName = document.getElementById("current-option").value;
        try {
            const response = await fetch(`http://localhost:3001/api/sql/returnFileId?email=${decodedToken.email}&fileName=${fileName}`, {
                method: 'GET', 
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            return data.fileId;
        } catch (error) {
            console.error('Error fetching fileId from SQL database:', error);
            throw error; // Re-throw the error to be caught by the caller
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
                const fileId = await returnFileId();
                console.log("File id here: ", fileId);
                if (fileId) {
                    // Construct the URL using the selected file ID
                    const url = `https://storage.googleapis.com/se3350-group24_cloudbuild/${fileId}`;
                    // Load the file content
                    loadFileContent(url);
                }
            }
        } catch (error) {
            console.error('Error displaying PDF:', error);
        }
    };

    const [showConfirmation, setShowConfirmation] = useState(false);

    const confirmDelete = () => {
        setShowConfirmation(true);
    };

    const handleConfirm = () => {
        handleFileDelete()
        setShowConfirmation(false); // Close the confirmation dialog after deletion
    };

    const handleCancel = () => {
        setShowConfirmation(false); // Close the confirmation dialog on cancel
    };

    // Function to delete file from gcs and sql
    const handleFileDelete = async () => {
        const fileId = await returnFileId();
        
        const data = {
            fileId: fileId
        };

        fetch('http://localhost:3001/api/deleteFile', {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            console.log(data.message); 
            console.log("Deleted from SQL and GCS");
            setShowSuccessDeleteMessage(true);
            setShowErrorDeleteMessage(false);
            setTimeout(() => {
                setShowSuccessDeleteMessage(false);
            }, 10000);
        })
        .catch(error => {
            console.error('Error deleting file:', error);
            setShowSuccessDeleteMessage(false);
            setShowErrorDeleteMessage(true);
            setTimeout(() => {
                setShowErrorDeleteMessage(false);
            }, 10000);
        });
    };

    return (
        <>
            <div className="profile-navigation">
                <ul>
                    <li>
                        <a className={pageTitle === 'Edit Profile' ? 'active' : ''} onClick={() => setPageTitle('Edit Profile')}>
                            Edit Profile
                        </a>
                    </li>
                    <li>
                        <a className={pageTitle === 'Notification' ? 'active' : ''} onClick={() => setPageTitle('Notification')}>
                            Notification
                        </a>
                    </li>
                    <li>
                        <a className={pageTitle === 'Forms and Waivers' ? 'active' : ''} onClick={() => setPageTitle('Forms and Waivers')}>
                            Forms and Waivers
                        </a>
                    </li>
                </ul>
            </div>
    
            {pageTitle === 'Notification' ? (
                <div className="notification">
                    <h2>{pageTitle}</h2>
                    <form>
                        <label htmlFor="email-notification">Email Notifications</label>
                        <input
                            type="checkbox"
                            id="email-notification"
                            checked={emailNotifications}
                            onChange={(e) => setEmailNotifications(e.target.checked)}
                        />
    
                        <label htmlFor="newsletter-subscriber">Newsletter Subscriber</label>
                        <input
                            type="checkbox"
                            id="newsletter-subscriber"
                            checked={subscriber}
                            onChange={(e) => setSubscriber(e.target.checked)}
                        />
    
                        <button type="button" onClick={handleSaveNotification}>
                            Save
                        </button>
                    </form>
                </div>
            ) : pageTitle === 'Forms and Waivers' ? (
                <div className="forms-and-waivers-container">
                    <h2>{pageTitle}</h2>
                    <div className='form-container'>

                        <div className='upload-form-container'>
                            <h3>Please upload your form or waiver here.</h3>
                            <div className='file-form-container'>
                                <input
                                    type='file'
                                    id='fileInput'
                                    accept='application/pdf'
                                    style={{ display: 'none' }}
                                    onChange={handleFileChange}
                                />
                                <button
                                    className='choose-file-button'
                                    onClick={() => document.getElementById('fileInput').click()}
                                >
                                    Choose File
                                </button>
                                <h3 className='file-name' id='file-name' onClick={handleDownload}>
                                    {selectedFile ? selectedFile.name : 'No File Chosen'}
                                </h3>
                            </div>
                            <div className='save-button-container'>
                                <button onClick={handleUploadPdf} className='save-file-button'>Save</button>
                            </div>
                            {showSuccessMessage && (
                                <div className="success-message">
                                <p>Save successful!</p>
                                </div>
                            )}
                            {showErrorMessage && (
                                <div className="error-message">
                                <p>Save unsuccessful. Please try again.</p>
                                <p>{statusMessage}</p>
                                </div>
                            )}
                        </div>

                        <div className='file-options'>
                            <select value={selectedOption} onChange={displayPDF} onClick={handleSelectPopulation} className='file-option-select' id="current-option">
                                    <option value="">Select...</option>
                                    {fileNames.map((fileName, index) => (
                                    <option key={index} value={fileName}>{fileName}</option>
                                    ))}
                            </select>

                            <button onClick={confirmDelete} className='delete-file-button'>Delete</button>
                                {showConfirmation && (
                                    <div className='confirmation-dialog'>
                                        <p className='confirm-delete-text'>Are you sure you want to delete?</p>
                                        <button className='confirm-delete' onClick={handleConfirm}>Confirm</button>
                                        <button className='confirm-cancel' onClick={handleCancel}>Cancel</button>
                                    </div>
                                )}
                            {showSuccessDeleteMessage && (
                                <div className="success-message">
                                <p className='delete-message'>Delete successful!</p>
                                </div>
                            )}
                            {showErrorDeleteMessage && (
                                <div className="error-message">
                                <p>Delete unsuccessful. Please try again.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className='newsletter-body'>
                        <object ref={pdfContainerRef} className='newsletter-pdf' type="application/pdf" width="75%" height="1100px">
                            Your browser does not support PDFs. Please download the PDF to view it.
                        </object>
                    </div>

                </div>
            ) : (
                <div className="profile-edit">
                    <h2>{pageTitle}</h2>
                    <form>
                        <label htmlFor="first-name">Username</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
    
                        <label htmlFor="email">Email</label>
                        <span id="email" style={{ border: '1px solid #ccc', padding: '5px', display: 'inline-block', minWidth: '150px' }}>{email}</span>
    
                        <label htmlFor="first-name">First Name</label>
                        <input
                            type="text"
                            id="first-name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                        />
    
                        <label htmlFor="first-name">Last Name</label>
                        <input
                            type="text"
                            id="last-name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                        />
    
                        <label htmlFor="address">Address</label>
                        <input
                            type="text"
                            id="address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        />
    
                        <label htmlFor="city">City</label>
                        <input
                            type="text"
                            id="city"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                        />
    
                        <label htmlFor="province">Province</label>
                        <input
                            type="text"
                            id="province"
                            value={province}
                            onChange={(e) => setProvince(e.target.value)}
                        />
    
                        <button type="button" onClick={handleSaveProfile}>
                            Save
                        </button>
                    </form>
                </div>
            )}
            <p>{responseMessage}</p>
        </>
    );
    
}

export default Profile