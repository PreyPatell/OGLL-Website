import React, { useState, useEffect } from 'react';
import './Admin.css';

const Admin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [eventName, setEventName] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [eventLocation, setEventLocation] = useState('');
    const [eventSponsor, setEventSponsor] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [employeeEmail, setEmployeeEmail] = useState('');
    const [employeePassword, setEmployeePassword] = useState('');
    const [employeeUsername, setEmployeeUsername] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileName, setFileName] = useState('No File Chosen');
    const [selectedWaiverFile, setSelectedWaiverFile] = useState(null);
    const [fileWaiverName, setWaiverFileName] = useState('No File Chosen');
    const [adminMessage, setAdminMessage] = useState('');
    const [eventMessage, setEventMessage] = useState('');
    const [employeeMessage, setEmployeeMessage] = useState('');
    const [newsletterMessage, setNewsletterMessage] = useState('');
    const [waiverMessage, setWaiverMessage] = useState('');
    const [statusMessage, setStatusMessage] = useState('');

    const [decodedToken, setDecodedToken] = useState(null);

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
        fetchAllFiles()
    }, []);

    const handleAdminAccountCreation = async (e) => {
        e.preventDefault();
        console.log(email,password,username)
        // Perform admin account creation functionality using API calls
        try {
            // Example API call
            const response = await fetch("http://localhost:3001/admin/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, username }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Something went wrong!');
            setAdminMessage(data.message);
            setEmail('');
            setPassword('');
            setUsername('');
        } catch (error) {
            setAdminMessage(error.message || "Something went wrong");
        }
    };

    const handleEventCreation = async (e) => {
        e.preventDefault();
        console.log(startTime, endTime)
        // Create new Date objects for start time and end time separately
        const startTimeDate = new Date(`2000-01-01T${startTime}`);
        const endTimeDate = new Date(`2000-01-01T${endTime}`);

        // Adjust the time zone offset (in minutes) to match the desired time zone
        const timezoneOffset = startTimeDate.getTimezoneOffset(); // Get current time zone offset
        startTimeDate.setMinutes(startTimeDate.getMinutes() - timezoneOffset); // Adjust start time
        endTimeDate.setMinutes(endTimeDate.getMinutes() - timezoneOffset); // Adjust end time

        // Format the time part of the date objects as strings
        const formattedStartTime = startTimeDate.toISOString().slice(11, 19);
        const formattedEndTime = endTimeDate.toISOString().slice(11, 19);

        // Combine the event date with the formatted time strings
        const eventStartTime = `${eventDate}T${formattedStartTime}`;
        const eventEndTime = `${eventDate}T${formattedEndTime}`;

        console.log(eventStartTime, eventEndTime);
        // Perform event creation functionality using API calls
        try {
            // Example API call
            const response = await fetch("http://localhost:3001/api/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ eventName, eventDate, eventLocation, eventSponsor, startTime:eventStartTime, endTime:eventEndTime }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Something went wrong!');
            setEventMessage(data.message);
            setEventName('');
            setEventDate('');
            setEventLocation('');
            setEventSponsor('');
            setStartTime('');
            setEndTime('');
        } catch (error) {
            setEventMessage(error.message || "Something went wrong");
        }
    };

    const handleEmployeeAccountCreation = async (e) => {
        e.preventDefault();
        console.log(employeeEmail,employeePassword,employeeUsername)
        // Perform employee account creation functionality using API calls
        try {
            // Example API call
            const response = await fetch("http://localhost:3001/admin/employee", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email:employeeEmail, password:employeePassword, username:employeeUsername }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Something went wrong!');
            setEmployeeMessage(data.message);
            setEmployeeEmail('');
            setEmployeePassword('');
            setEmployeeUsername('');
        } catch (error) {
            setEmployeeMessage(error.message || "Something went wrong");
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const fileNameParts = file.name.split('.');
            const extension = fileNameParts.pop();
            const fileNameWithoutExtension = fileNameParts.join('.');
            const regex = /^newsletter_\d{4}-\d{2}-\d{2}$/;
            if (extension.toLowerCase() !== 'pdf' || !regex.test(fileNameWithoutExtension)) {
                // File format or name doesn't match the required pattern
                alert('Please select a PDF file with the name in the format "newsletter_YYYY-MM-DD.pdf" (e.g., newsletter_2024-03-29.pdf)');
                return;
            }
            setSelectedFile(file);
            setFileName(file.name);
        } else {
            setFileName('No File Chosen');
        }
    };

    const handleWaiverFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedWaiverFile(file);
            setWaiverFileName(file.name);
        } else {
            setWaiverFileName('No File Chosen');
        }
    };     

    // Function to handle creating a unique fileId
    function uuidv4() {
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
          (
            c ^
            (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
          ).toString(16)
        );
      }

// Function to handle uploading the pdf to google cloud storage and SQL
const handleUpload = async(fileInputId, fileNameElementId, messageTypeSetter) => {
    const fileExists = await doesFileExist(fileInputId); // Wait for the result of doesFileExist
    if (fileExists) {
        return;
    }
    const input = document.getElementById(fileInputId);
    const file = input.files[0];

    if (!file) {
        messageTypeSetter('Please select a file to upload.');
        return;
    }

    const postId = uuidv4();
    const newFile = new File([file], `${postId}_post.pdf`, { type: "application/pdf" });

    // Uploading file to Google Cloud Storage and metadata to SQL
    const formData = new FormData();
    formData.append(fileInputId, newFile);
    
    const fileName = document.getElementById(fileNameElementId).textContent;

    const data = {
        fileId: `${postId}_post.pdf`,
        email: decodedToken.email,
        fileName: fileName,
        fileType: decodedToken.role
    };

    formData.append('fileData', JSON.stringify(data));

    fetch("http://localhost:3001/api/uploadFile", {
        method: "POST",
        body: formData,
    })
    .then((res) => res.json())
    .then((response) => {
        console.log(response);
        messageTypeSetter(response.message);
    })
    .catch((error) => {
        console.error('Error uploading file and metadata:', error);
        messageTypeSetter('Error uploading file and metadata.');
    });
};

 // Function to check if user has file with that name
 const doesFileExist = async (fileInputId) => {
    let currentSelectedFile = selectedFile
    if (fileInputId == "waiverFileInput") {
        currentSelectedFile = selectedWaiverFile;
    }
    try {
        const response = await fetch(`http://localhost:3001/api/sql/filenames/${decodedToken.email}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const data = await response.json();
        console.log('API Response:', data); // Log the API response
        if(data.fileNames.includes(currentSelectedFile.name)){
            console.log('File exists:', currentSelectedFile.name);
            setStatusMessage("This file already exists.");
            return true;
        }
        else {
            console.log('File does not exist:', currentSelectedFile.name);
            setStatusMessage("");
            return false;
        }
    } catch (error) {
        console.error('Error fetching fileIds:', error);
        return false; // Handle error gracefully
    }
};

// Function to handle uploading the newsletter pdf
const handleNewsletterUpload = () => {
    handleUpload('newsletterFileInput', 'newsletter-file-name', setNewsletterMessage);
};

// Function to handle uploading the waiver pdf
const handleWaiverUpload = () => {
    handleUpload('waiverFileInput', 'waiver-file-name', setWaiverMessage);
};

    const [files, setFiles] = useState([]);
    const [fileIds, setFileIds] = useState([]);
    const [selectedFileId, setSelectedFileId] = useState(null);
    const [deleteMessage, setDeleteMessage] = useState('');

    // Function to handle retriving files to put into the select element
    const fetchAllFiles = async () => {
        try {
            const response = await fetch(`http://localhost:3001/api/sql/allFiles`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            setFiles(data.fileNames);
            setFileIds(data.fileIds)
        } catch (error) {
            console.error('Error fetching fileNames:', error);
        }
    };

    const handleFileDelete = async () => {
        const fileName = document.getElementById("current-option").value;
        const fileIndex = files.findIndex(file => file === fileName);
        if (fileIndex !== -1) {
            const fileId = fileIds[fileIndex];
            console.log("File ID:", fileId, typeof fileId);
            setSelectedFileId(fileId)
        } else {
            setDeleteMessage('Please select a file to delete.');
            return;
        }

        try {
            const response = await fetch('http://localhost:3001/api/deleteFile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ fileId: selectedFileId }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to delete file. Please Retry');
            setDeleteMessage(data.message);
            // Refresh the list of files after deletion
            fetchAllFiles();
        } catch (error) {
            console.error('Error deleting file:', error);
            setDeleteMessage(error.message || 'Error deleting file');
        }
    };

    const handleDropdownChange = () => {
        // Fetch all files when dropdown menu is changed
        fetchAllFiles();
    };

    return (
        <div className="admin-container">
            <div className="admin-section">
                <h2 className="admin-section-header">Create Admin Account</h2>
                <form className="admin-form" onSubmit={handleAdminAccountCreation}>
                    <div className="admin-form-input">
                        <input
                            type="text"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="admin-form-input">
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="admin-form-input">
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit">Create Admin Account</button>
                </form>
                {adminMessage && <p className="admin-message">{adminMessage}</p>}
            </div>
            <div className="admin-section">
                <h2 className="admin-section-header">Create Employee Account</h2>
                <form className="admin-form" onSubmit={handleEmployeeAccountCreation}>
                    <div className="admin-form-input">
                        <input
                            type="text"
                            placeholder="Email"
                            value={employeeEmail}
                            onChange={(e) => setEmployeeEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="admin-form-input">
                        <input
                            type="text"
                            placeholder="Username"
                            value={employeeUsername}
                            onChange={(e) => setEmployeeUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="admin-form-input">
                        <input
                            type="password"
                            placeholder="Password"
                            value={employeePassword}
                            onChange={(e) => setEmployeePassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit">Create Employee Account</button>
                </form>
                {employeeMessage && <p className="admin-message">{employeeMessage}</p>}
            </div>
            <div className="admin-section">
            <h2 className="admin-section-header">Create Event</h2>
                <form className="admin-form" onSubmit={handleEventCreation}>
                    <div className="admin-form-input">
                        <input
                            type="text"
                            placeholder="Event Name"
                            value={eventName}
                            onChange={(e) => setEventName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="admin-form-input">
                        <input
                            type="date"
                            placeholder="Event Date"
                            value={eventDate}
                            onChange={(e) => setEventDate(e.target.value)}
                            required
                        />
                    </div>
                    <div className="admin-form-input">
                        <input
                            type="text"
                            placeholder="Event Location"
                            value={eventLocation}
                            onChange={(e) => setEventLocation(e.target.value)}
                            required
                        />
                    </div>
                    <div className="admin-form-input">
                        <input
                            type="text"
                            placeholder="Event Sponsor"
                            value={eventSponsor}
                            onChange={(e) => setEventSponsor(e.target.value)}
                            required
                        />
                    </div>
                    <div className="admin-form-input">
                        <p>Start Time</p>
                        <input
                            type="time"
                            placeholder="Start Time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            required
                        />
                    </div>
                    <div className="admin-form-input">
                        <p>End Time</p>
                        <input
                            type="time"
                            placeholder="End Time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit">Create Event</button>
                </form>
                {eventMessage && <p className="admin-message">{eventMessage}</p>}
            </div>
            <div className="admin-section">
                <h2 className="admin-section-header">Upload Newsletter</h2>
                <div className="upload-form-container">
                    <input
                        type="file"
                        id="newsletterFileInput"
                        accept="application/pdf"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />
                    <button
                        className="choose-file-button"
                        onClick={() => document.getElementById('newsletterFileInput').click()}
                    >
                        Choose File
                    </button>
                    <h3 className="file-name" id="newsletter-file-name">
                        {fileName}
                    </h3>
                </div>
                <div className="save-button-container">
                    <button onClick={handleNewsletterUpload} className="save-file-button">Upload Newsletter</button>
                </div>
                {newsletterMessage && <p className="admin-message">{newsletterMessage}</p>}
            </div>
            <div className="admin-section">
                <h2 className="admin-section-header">Upload Event Waiver</h2>
                <div className="upload-form-container">
                    <input
                        type="file"
                        id="waiverFileInput"
                        accept="application/pdf"
                        style={{ display: 'none' }}
                        onChange={handleWaiverFileChange}
                    />
                    <button
                        className="choose-file-button"
                        onClick={() => document.getElementById('waiverFileInput').click()}
                    >
                        Choose File
                    </button>
                    <h3 className="file-name" id="waiver-file-name">
                        {fileWaiverName}
                    </h3>
                </div>
                <div className="save-button-container">
                    <button onClick={handleWaiverUpload} className="save-file-button">Upload Event Waiver</button>
                </div>
                {waiverMessage && <p className="admin-message">{waiverMessage}</p>}
            </div>
            {statusMessage && <p className="admin-message">{statusMessage}</p>}
            <div className="admin-container">
                <h2 className="admin-section-header">Delete Files</h2>
                    <div className='file-options'>
                        <select onMouseEnter={handleDropdownChange} className='file-option-select' id="current-option">
                                <option value="">Select...</option>
                                {files.map((fileName, index) => (
                                <option key={index} value={fileName}>{fileName}</option>
                                ))}
                        </select>

                        <button onClick={handleFileDelete} className='delete-file-button'>Delete</button>
                     </div>
                <div className="delete-message">{deleteMessage}</div>
        </div>
        </div>
    );
};

export default Admin;
