const express = require("express");
const cors = require("cors");
const app = express();
const axios = require('axios');
const mysql = require('mysql');
const { createTokens } = require('./jwt');
const config = require('./config/config.json');
const nodemailer = require('nodemailer');
const request = require('request');
require('dotenv').config();

//jwt stuff
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const router = express.Router()
const port = process.env.PORT || 3001;

// Google cloud storage information
const { Storage } = require('@google-cloud/storage');
const Multer = require('multer');
const path = require('path');

let projectId = 'se3350-group24';
let keyFilename = 'myKey.json';
const storage = new Storage({
    projectId,
    keyFilename 
});
const bucket = storage.bucket('se3350-group24_cloudbuild');

const multer = Multer({
    storage: Multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,  //5mb size
    }
});


app.use(express.json());
app.use(cors()); // Enable CORS
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'client')));


const con = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
});

// Endpoint to decode JWT token
app.post("/api/decode-token", (req, res) => {
    const authorizationHeader = req.headers['authorization'];

    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        return res.status(400).json({ message: "User not authenticated" });
    }

    const accessToken = authorizationHeader.split(' ')[1];

    try {
        const decodedToken = jwt.verify(accessToken, "thisisasecret");
        if (decodedToken) {
            res.json({ decodedToken });
        } else {
            throw new Error('Invalid token');
        }
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

//Login endpoint
app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;

    con.query(`SELECT * FROM User WHERE email = ? AND password = ?`, [email, password], (error, results) => {
        if (error) {
            console.error(`Error executing MySQL` + error.stack);
            res.status(500).json({ message: "Server Error" });
            return;
        }
        if (results.length > 0) {
            const user = results[0];
            const accessToken = createTokens(user);
            if (user.accountType === 'admin') {
                res.json({ message: "Admin login successful", user, accessToken });
            } else {
                res.json({ message: "Login successful", user, accessToken });
            }
        } else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    });
});


app.get("/api/logout", (req, res) => {
    res.clearCookie('access-token');
    res.json({ message: "Logged out" });
})


function getNewLoginURL() {
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.web.client_id}&redirect_uri=${encodeURIComponent(config.web.redirect_uris[0])}&response_type=code&scope=https://www.googleapis.com/auth/photoslibrary.readonly&access_type=offline&prompt=consent&state=new_access_token&include_granted_scopes=true`;
    return url;
}

async function getCode(code){
    const tokenURL = 'https://oauth2.googleapis.com/token';
    const params = new URLSearchParams({
        code: code,
        client_id: config.web.client_id,
        client_secret: config.web.client_secret,
        redirect_uri: config.web.redirect_uris[0],
        grant_type: 'authorization_code'
    });
    try{
        const response = await axios.post(tokenURL, params.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        return response.data;
    }catch (error){
        console.error('Error getting token:', error);
        return null;
    }
}


app.get("/api/google", (req, res) => {
    try {
        const url = getNewLoginURL();
        res.json({ url });
    } catch (err) {
        console.error('Error getting Google login URL:', err);
        res.status(500).json({ message: 'Error getting Google login URL' });
    }
});

//change this to store in database instead of hardcoding it maybe
//err where only photos on td works
async function getRefresh() {
    const tokenURL = 'https://oauth2.googleapis.com/token';
    const params = new URLSearchParams({
        refresh_token: hardcodedRefreshToken,
        client_id: config.web.client_id,
        client_secret: config.web.client_secret,
        grant_type: 'refresh_token'
    });

    try {
        const response = await axios.post(tokenURL, params.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        return response.data.access_token;
    } catch (error) {
        console.error('Error refreshing access token:', error);
        return null;
    }
}

async function listAlbums(token) {
    try {
        const response = await axios.get('https://photoslibrary.googleapis.com/v1/albums', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const albums = response.data.albums;
        if (albums) {
            return albums.map(album => ({
                id: album.id,
                title: album.title,
            }));
        } else {
            return [];
        }
    } catch (error) {
        console.error('Error retrieving albums:', error);
        throw error;
    }
}


app.get('/api/albums', async (req, res) => {
    try {
        const accessToken = await getRefresh();
        if (!accessToken) {
            return res.status(401).json({ message: 'Failed to obtain access token.' });
        }

        const albums = await listAlbums(accessToken);
        res.json({ albums });
    } catch (err) {
        res.status(500).json({ message: 'Error getting albums', error: err.message });
    }
});



//global variable to hold the token
let photoTOKEN = ""
let refreshTOKEN = ""

let accessTokenCache = {
    accessToken: null,
    expiresAt: null
};


app.get('/gtoken', async (req, res) => {
    const code = req.query.code;

    if (!code) {
        return res.status(400).json({ message: 'Code is required' });
    }
    try{
        const tokendata = await getCode(code);
        photoTOKEN = tokendata.access_token;
        refreshTOKEN = tokendata.refresh_token;
        res.json({ message: 'Code received', code: code, token: tokendata });
    } catch (err) {
    res.json({ message: 'Error getting token', error: err });
    }
});

//getting pics from google album
function getAllMedia(token, pageToken = null, pageSize = 50, albumId = null) {
    return new Promise(async (resolve, reject) => {
        try {
            let mediaItems = [];
            let nextPageToken = pageToken;
            const axiosConfig = {
                method: 'post',
                url: 'https://photoslibrary.googleapis.com/v1/mediaItems:search',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                data: {
                    pageSize: pageSize,
                    albumId: albumId,
                    pageToken: nextPageToken
                }
            };

            do {
                const response = await axios(axiosConfig);
                const items = response.data.mediaItems.map(item => item.baseUrl); // Extract only the baseUrl
                mediaItems = mediaItems.concat(items);
                nextPageToken = response.data.nextPageToken;
                axiosConfig.data.pageToken = nextPageToken;
            } while (nextPageToken);

            resolve(mediaItems);
        } catch (error) {
            console.error('Error retrieving media items:', error);
            reject(error);
        }
    });
}


//get all media endpoint using acess token
app.get('/api/media', async (req, res) => {
    try {
        const accessToken = await getRefresh();
        if (!accessToken) {
            return res.status(401).json({ message: 'Failed to obtain access token.' });
        }

        const pics = await getAllMedia(accessToken, null);
        res.json({ pics: pics });
    } catch (err) {
        res.status(500).json({ message: 'Error getting media', error: err.message });
    }
});

app.get('/api/media-from-album', async (req, res) => {
    const { albumId } = req.query; 

    if (!albumId) {
        return res.status(400).json({ message: 'Album ID is required' });
    }

    try {
        const accessToken = await getRefresh();
        if (!accessToken) {
            return res.status(401).json({ message: 'Failed to obtain access token.' });
        }

        const pics = await getAllMedia(accessToken, null, 50, albumId);
        res.json({ pics });
    } catch (err) {
        res.status(500).json({ message: 'Error getting media from album', error: err.message });
    }
});


//checking if email exits functions
function checkEmailExists(email, callback) {
    con.query('SELECT * FROM User WHERE email = ?', [email], (error, results) => {
        if (error) {
            console.error(error);
            callback(error, null);
        } else {
            callback(null, results.length > 0); // true if email exists, false otherwise
        }
    });
}

function checkSubscriberEmailExists(email, callback) {
    con.query('SELECT * FROM Subscriber WHERE email = ?', [email], (error, results) => {
        if (error) {
            console.error(error);
            callback(error, null);
        } else {
            callback(null, results.length > 0); // true if email exists, false otherwise
        }
    });
}

// Signup endpoint
app.post("/api/signup", (req, res) => {
    const { email, password, username, captchaToken } = req.body;
    
    // Verify CAPTCHA token
    const captchaVerifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${captchaSecretKey}&response=${captchaToken}`;

    request.post(captchaVerifyUrl, (captchaError, captchaResponse, captchaBody) => {
        if (captchaError) {
            console.error(captchaError);
            return res.status(500).json({ message: "CAPTCHA verification failed" });
        }

        const captchaResult = JSON.parse(captchaBody);

        if (!captchaResult.success) {
            return res.status(400).json({ message: "CAPTCHA verification failed" });
        }

        // CAPTCHA verification successful, proceed with user registration

        // Check if existing user using email
        checkEmailExists(email, (error, emailExists) => {
            if (error) {
                return res.status(500).json({ message: "Internal Server Error" });
            }

            if (emailExists) {
                return res.status(400).json({ message: "Email already exists" });
            }

            // Create a new user with accountType set to "user" by default
            const newUser = {
                email,
                password,
                username, // Add a default username if needed
                accountType: '2', // Set accountType to 'user'
                isNotification: '0',
                isSubscriber: '0'
            };

            // Insert the new user into the MySQL database
            con.query('INSERT INTO User SET ?', newUser, (error, results) => {
                if (error) {
                    console.error(error);
                    return res.status(500).json({ message: "Internal Server Error" });
                }

                res.json({ message: "Signup successful", user: newUser });
            });
        });
    });
});

// Admin creation endpoint
app.post("/admin/create", (req, res) => {
    const { email, password, username } = req.body;
    // Check if existing user using email
    checkEmailExists(email, (error, emailExists) => {
        if (error) {
            return res.status(500).json({ message: "Internal Server Error" });
        }

        if (emailExists) {
            return res.status(400).json({ message: "Email already exists" });
        }

        // Create a new user with accountType set to "user" by default
        const newUser = {
            email,
            password,
            username, // Add a default username if needed
            accountType: '1', // Set accountType to 'admin'
            isNotification: '1',
            isSubscriber: '1'
        };

        // Insert the new user into the MySQL database
        con.query('INSERT INTO User SET ?', newUser, (error, results) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ message: "Internal Server Error" });
            }

            res.json({ message: "Admin created", user: newUser });
        });
    });
});

// Employee creation endpoint
app.post("/admin/employee", (req, res) => {
    const { email, password, username } = req.body;
    // Check if existing user using email
    checkEmailExists(email, (error, emailExists) => {
        if (error) {
            return res.status(500).json({ message: "Internal Server Error" });
        }

        if (emailExists) {
            return res.status(400).json({ message: "Email already exists" });
        }

        // Create a new user with accountType set to "user" by default
        const newUser = {
            email,
            password,
            username, // Add a default username if needed
            accountType: '3', // Set accountType to 'employee'
            isNotification: '1',
            isSubscriber: '1'
        };

        // Insert the new user into the MySQL database
        con.query('INSERT INTO User SET ?', newUser, (error, results) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ message: "Internal Server Error" });
            }

            res.json({ message: "Employee created", user: newUser });
        });
    });
});


//undefiuned still
app.post("/api/subscribe", async (req, res) => {
    const { subscriberName, email } = req.body;
    // Check if existing user using email
    checkSubscriberEmailExists(email, async (error, emailExists) => {
        if (error) {
            return res.status(500).json({ message: "Internal Server Error" });
        }

        if (emailExists) {
            return res.status(400).json({ message: "Email is already subscribed" });
        }

        // Create a new user with accountType set to "user" by default
        const newSubscriber = {
            email,
            subscriberName
        };

        // Insert the new user into the MySQL database
        con.query('INSERT INTO Subscriber SET ?', newSubscriber, async (error, results) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ message: "Internal Server Error" });
            }
            
            //If email exists as user, update isNotification in user to true
            con.query(`UPDATE User SET isSubscriber = true WHERE email = ?`, [email], (error, results) => {
                if (error) {
                    console.error(error);
                    return res.status(500).json({ message: "Internal Server Error" });
                }
            });

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: 'searan1998@gmail.com',
                    pass: 'qtgurcumrjwdlmlc'
                }
            });

            const mailOptions = {
                from: {
                    name: 'Ongoing Living and Learning INC.',
                    address: 'searan1998@gmail.com'
                },
                to: email,
                subject: 'Ongoing Living and Learning Newsletter',
                text: `Hello ${subscriberName},\n\nThank you for subscribing to our newsletter!`,
                html: `<h1>Welcome to Ongoing Living and Learning Newsletter</h1><p>Hello ${subscriberName},<br><br>Thank you for subscribing to our newsletter!</p>`,
                attachments: [
                    {
                        filename: 'logo.png',
                        path: path.join(__dirname, './newsletters/logo.png'),
                    },
                    {
                        filename: 'OLLNewsletter.pdf',
                        path: path.join(__dirname, './newsletters/OLLNewsletter.pdf')
                    }
                ]
            };

            try {
                await transporter.sendMail(mailOptions);
                console.log('Email sent successfully');
            } catch (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ message: "Error sending email" });
            }

            res.json({ message: "Successfully Subscribed", subscriber: subscriberName });
        });
    })
})


// Endpoint to get user profile by email
app.post("/api/profile", (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    con.query('SELECT * FROM User WHERE email = ?', [email], (error, results) => {
        if (error) {
            console.error('Error retrieving user profile:', error);
            return res.status(500).json({ message: 'Error retrieving user profile' });
        }

        if (results.length > 0) {
            const userProfile = results[0];
            res.status(200).json({ userProfile });
        } else {
            res.status(404).json({ message: 'User profile not found' });
        }
    });
});


app.put("/api/update-profile", (req, res) => {
    const { email, password, username, accountType, fName, lName, address, city, province, isNotification, pfpLink, isSubscriber } = req.body;

    let updateFields = [];
    let query = 'UPDATE User SET ';

    // Check which fields are provided and add them to the update query
    if (password) updateFields.push(` password = '${password}'`);
    if (username) updateFields.push(` username = '${username}'`);
    if (accountType) updateFields.push(` accountType = '${accountType}'`);
    if (fName) updateFields.push(` fName = '${fName}'`);
    if (lName) updateFields.push(` lName = '${lName}'`);
    if (address) updateFields.push(` address = '${address}'`);
    if (city) updateFields.push(` city = '${city}'`);
    if (province) updateFields.push(` province = '${province}'`);
    if (isNotification !== undefined) updateFields.push(` isNotification = ${isNotification}`);
    if (pfpLink) updateFields.push(` pfpLink = '${pfpLink}'`);
    if (isSubscriber !== undefined) updateFields.push(` isSubscriber = ${isSubscriber}`);

    if (updateFields.length > 0) {
        query += updateFields.join(', ');
        query += ` WHERE email = '${email}';`; // Add single quotes around email

        // Execute the update query
        con.query(query, (error, results, fields) => {
            if (error) {
                console.error('Error updating profile: ' + error.message);
                res.status(500).json({ error: 'Error updating profile' });
                return;
            }
            res.status(200).json({ message: 'Profile updated successfully' });
        });
    } else {
        res.status(401).json({ message: "Invalid email or password" });
    }
})

// Endpoint to create a new event
app.post('/api/events', (req, res) => {
    const { eventName, eventDate, eventLocation, eventSponsor, startTime, endTime } = req.body;

    // Format eventDate
    const formattedEventDate = new Date(eventDate).toISOString().split('T')[0];

    const sqlGetLastId = 'SELECT MAX(eventID) AS maxId FROM Event';
    con.query(sqlGetLastId, (err, rows) => {
        if (err) {
            console.error('Error retrieving last eventId: ' + err.stack);
            res.status(500).json({ error: 'Error creating event' });
            return;
        }
        const lastId = rows[0].maxId || 0; // If no events exist, start with eventId 1
        const newEventId = lastId + 1;

        // Insert the new event with the incremented eventId
        const sqlInsertEvent = 'INSERT INTO Event (eventId, eventName, eventDate, eventLocation, eventSponsor, startTime, endTime) VALUES (?, ?, ?, ?, ?, ?, ?)';
        con.query(sqlInsertEvent, [newEventId, eventName, formattedEventDate, eventLocation, eventSponsor, startTime, endTime], (err, result) => {
            if (err) {
                console.error('Error creating event: ' + err.stack);
                res.status(500).json({ error: 'Error creating event' });
                return;
            }
            res.status(201).json({ message: 'Event created successfully', eventId: newEventId });
        });
    });
});

// Function to format time as "hours:minutes (am/pm)"
function formatTime(time) {
    if (!time) return "N/A"; // Handle null or undefined time

    const formattedTime = new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return formattedTime;
};



// Endpoint to get events by specific searches
app.post('/api/search-events', (req, res) => {
    const { name, date, location } = req.body;

    let counter = 0;
    const today = new Date().toISOString().split('T')[0];

    let sql = 'SELECT * FROM Event WHERE';
    const params = [];

    if (name || date || location) {
        if (name) {
            if (counter) {sql += ' AND';}
            sql += ' eventName LIKE ?';
            params.push(`%${name}%`); 
            counter++;
        }
        if (date) {
            if (counter) {sql += ' AND';}
            sql += ' eventDate = ?';
            params.push(date);
            counter++;
        }
        if (location) {
            if (counter) {sql += ' AND';}
            sql += ' eventLocation LIKE ?';
            params.push(`%${location}%`); 
            counter++;
        }
    } else {
        sql += ' eventDate >= ?';
        params.push(today)
        counter++;
    }

    con.query(sql, params, (err, results) => {
        console.log(sql)
        if (err) {
            console.error('Error retrieving events: ' + err.stack);
            res.status(500).json({ error: 'Error retrieving events' });
            return;
        }
        const modifiedResults = results.map(event => {
            const modifiedEvent = {};
            for (const [key, value] of Object.entries(event)) {
                modifiedEvent[key] = value || "N/A";
            }
            modifiedEvent.startTime = formatTime(event.startTime);
            modifiedEvent.endTime = formatTime(event.endTime);
            return modifiedEvent;
        });

        res.status(200).json(modifiedResults);
    });
});

// Endpoint to get all event names based off eventDate
app.get('/api/sql/retrieveEventNames/:eventDate', (req, res) => {
    const eventDate = req.params.eventDate;

    let query = 'SELECT eventName FROM Event WHERE eventDate = ?';
    con.query(query, eventDate, (err, results) => {
        if (err) {
            console.error("Error retrieving events: " + err.stack);
            res.status(500).json({ error: 'Error retrieving events' });
            return;
        }
        // Extract event names from results array
        const eventNames = results.map(result => result.eventName);
        // Create JSON object with eventNames array
        const responseObject = { eventNames: eventNames };
        res.status(200).json(responseObject);
    })
});

// Endpoint to register for an event 
app.post('/api/event-participant', (req, res) => {
    const { email, eventID } = req.body;

    // Check if the participant already exists
    let checkSql = "SELECT * FROM EventParticipants WHERE email = ? AND eventID = ?;";
    con.query(checkSql, [email, eventID], (err, results) => {
        if (err) {
            console.error('Error checking participant existence: ' + err.stack);
            res.status(500).json({ error: 'Error checking participant existence' });
            return;
        }

        if (results.length > 0) {
            // Participant already registered for the event
            res.status(400).json({ message: "Participant already registered for the event" });
            return;
        }

        // If not already registered, insert the participant
        let setForeignKeySql = "SET FOREIGN_KEY_CHECKS=0;";
        let insertSql = "INSERT INTO EventParticipants (email, eventID) VALUES (?, ?);";
        
        con.query(setForeignKeySql, (err) => {
            if (err) {
                console.error('Error disabling foreign key checks: ' + err.stack);
                res.status(500).json({ error: 'Error disabling foreign key checks' });
                return;
            }

            con.query(insertSql, [email, eventID], (err, results) => {
                if (err) {
                    console.error('Error inserting event participant: ' + err.stack);
                    res.status(500).json({ error: 'Error inserting event participant' });
                    return;
                }
                res.status(200).json({ message: "Registered for the event" });
            });
        });
    });
});

// Enpoint to get all events for user
app.get('/api/user-events', (req, res) => {
    const { email } = req.body;

    let sql = "SELECT e.* FROM Event e JOIN EventParticipants ep USING (eventID) JOIN User u USING (email) WHERE u.email = ?";

    con.query(sql, email, (err, results) => {
        if (err) {
            console.error('Error retrieving events: ' + err.stack);
            res.status(500).json({error: 'Error retrieving stack'});
            return;
        } 
        res.status(200).json(results);
    })
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'src', 'components', 'Profile', 'Profile.js'));
});


// Combined endpoint for uploading files to SQL and Google Cloud Storage
app.post("/api/uploadFile", multer.fields([
    { name: 'fileInput', maxCount: 1 },
    { name: 'newsletterFileInput', maxCount: 1 },
    { name: 'waiverFileInput', maxCount: 1 }
]), (req, res) => {
    console.log("Made it /uploadAndSQL");
    try {

        // Check if the main file is uploaded
        if (req.files['fileInput']) {
            const mainFile = req.files['fileInput'][0];
            console.log("Main file found, trying to upload to GCS and SQL...");
            const blob = bucket.file(mainFile.originalname);
            const blobStream = blob.createWriteStream();

            blobStream.on("finish", () => {
                console.log("Main file uploaded successfully to GCS");
            
                const fileData = JSON.parse(req.body.fileData); // Parse fileData object
                const { fileId, email, fileName, fileType } = fileData; // Destructure values
        
                console.log("Received data:", fileData);
                console.log(fileId, email, fileName, fileType);
            
                // Check if fileId is null or undefined
                if (!fileId) {
                    console.error("Error: fileId is null or undefined");
                    res.status(500).json({ error: "fileId is null or undefined" });
                    return;
                }
            
                const query = 'INSERT INTO Files (fileId, email, fileName, fileType) VALUES (?, ?, ?, ?)';
                con.query(query, [fileId, email, fileName, fileType], (err, result) => {
                    if (err) {
                        console.error("Error uploading main file to SQL: " + err.stack);
                        res.status(500).json({ error: "Error uploading main file to SQL" });
                        return;
                    }
                    console.log("Main file uploaded successfully to SQL");
                    res.status(200).json({ message: 'Files uploaded successfully to SQL and GCS' });
                });
            });
            blobStream.end(mainFile.buffer);
        }


        else if (req.files['newsletterFileInput']) {
            const newsletterFile = req.files['newsletterFileInput'][0];
            console.log("Newsletter file found, trying to upload to GCS and SQL...");
            const blob = bucket.file(newsletterFile.originalname);
            const blobStream = blob.createWriteStream();

            blobStream.on("finish", () => {
                console.log("Main file uploaded successfully to GCS");
            
                const fileData = JSON.parse(req.body.fileData); // Parse fileData object
                const { fileId, email, fileName, fileType } = fileData; // Destructure values
        
                console.log("Received data:", fileData);
                console.log(fileId, email, fileName, fileType);
            
                // Check if fileId is null or undefined
                if (!fileId) {
                    console.error("Error: fileId is null or undefined");
                    res.status(500).json({ error: "fileId is null or undefined" });
                    return;
                }
            
                const query = 'INSERT INTO Files (fileId, email, fileName, fileType) VALUES (?, ?, ?, ?)';
                con.query(query, [fileId, email, fileName, fileType], (err, result) => {
                    if (err) {
                        console.error("Error uploading main file to SQL: " + err.stack);
                        res.status(500).json({ error: "Error uploading main file to SQL" });
                        return;
                    }
                    console.log("Main file uploaded successfully to SQL");
                    res.status(200).json({ message: 'Files uploaded successfully to SQL and GCS' });
                });
            });
            blobStream.end(newsletterFile.buffer);
        }

        // Check if the waiver file is uploaded
        else if (req.files['waiverFileInput']) {
            const waiverFile = req.files['waiverFileInput'][0];
            console.log("Waiver file found, trying to upload to GCS and SQL...");
            const blob = bucket.file(waiverFile.originalname);
            const blobStream = blob.createWriteStream();

            blobStream.on("finish", () => {
                console.log("Main file uploaded successfully to GCS");
            
                const fileData = JSON.parse(req.body.fileData); // Parse fileData object
                const { fileId, email, fileName, fileType } = fileData; // Destructure values
        
                console.log("Received data:", fileData);
                console.log(fileId, email, fileName, fileType);
            
                // Check if fileId is null or undefined
                if (!fileId) {
                    console.error("Error: fileId is null or undefined");
                    res.status(500).json({ error: "fileId is null or undefined" });
                    return;
                }
            
                const query = 'INSERT INTO Files (fileId, email, fileName, fileType) VALUES (?, ?, ?, ?)';
                con.query(query, [fileId, email, fileName, fileType], (err, result) => {
                    if (err) {
                        console.error("Error uploading main file to SQL: " + err.stack);
                        res.status(500).json({ error: "Error uploading main file to SQL" });
                        return;
                    }
                    console.log("Main file uploaded successfully to SQL");
                    res.status(200).json({ message: 'Files uploaded successfully to SQL and GCS' });
                });
            });
            blobStream.end(waiverFile.buffer);
        }

    } catch (error) {
        console.error("Error uploading files:", error);
        res.status(500).send(error);
    }
});



// // Streams file upload to Google Storage
// app.post("/api/uploadFile", multer.single("fileInput"), (req, res) => {
//     console.log("Made it /upload");
//     try {
//       if (req.file) {
//         console.log("File found, trying to upload...");
//         const blob = bucket.file(req.file.originalname);
//         const blobStream = blob.createWriteStream();
  
//         blobStream.on("finish", () => {
//           res.status(200).send("Success");
//           console.log("Success");
//         });
//         blobStream.end(req.file.buffer);
//       } else throw "error with img";
//     } catch (error) {
//       res.status(500).send(error);
//     }
// });

// // Endpoint for uploading file to sql database
// app.post('/api/sql/fileUpload', (req, res) => {
//     const { fileId, email, fileName, fileType} = req.body;

//     const query = 'INSERT INTO Files (fileId, email, fileName, fileType) VALUES (?, ?, ?, ?)';
//     con.query(query, [fileId, email, fileName, fileType], (err, result) => {
//         if (err){
//             console.error("Error uploading file: " + err.stack);
//             res.status(500).json({ error: "Error uploading file"});
//             return;
//         }
//         res.status(200).json({ message: 'File uploaded successfully to sql'});
//     })
// });

// Combined endpoint for deleting a file from SQL database and Google Cloud Storage
app.post('/api/deleteFile', (req, res) => {
    const fileId = req.body.fileId;

    // Delete from SQL database
    const sqlQuery = 'DELETE FROM Files WHERE fileId = ?';
    con.query(sqlQuery, [fileId], (sqlErr, sqlResult) => {
        if (sqlErr) {
            console.error("Error deleting file from SQL database: " + sqlErr.stack);
            res.status(500).json({ error: "Error deleting file from SQL database" });
            return;
        }

        // Delete from Google Cloud Storage
        storage.bucket("se3350-group24_cloudbuild").file(fileId).delete((gcsErr, gcsResult) => {
            if (gcsErr) {
                console.error("Error deleting file from Google Cloud Storage: " + gcsErr);
                res.status(500).json({ error: "Error deleting file from Google Cloud Storage" });
                return;
            }

            res.status(200).json({ message: 'File deleted successfully from SQL and Google Cloud Storage' });
        });
    });
});

// Endpoint for retrieving fileIds belonging to a user based on their email
app.get('/api/sql/fileIds/:email', (req, res) => {
    console.log(req.params.email);
    const userEmail = req.params.email;

    // SQL query to select fileId values based on user email
    const query = 'SELECT fileId FROM Files WHERE email = ?';

    con.query(query, [userEmail], (err, result) => {
        if (err) {
            console.error("Error retrieving fileIds: " + err.stack);
            res.status(500).json({ error: "Error retrieving fileIds" });
            return;
        }
        
        // Extract fileId values from the SQL result
        const fileIds = result.map(row => row.fileId);

        res.status(200).json({ fileIds: fileIds });
    });
});


// Endpoint for retrieving fileNames belonging to a user based on their email
app.get('/api/sql/fileNames/:email', (req, res) => {
    console.log(req.params.email);
    const userEmail = req.params.email;

    // SQL query to select fileId values based on user email
    const query = 'SELECT fileName FROM Files WHERE email = ?';

    con.query(query, [userEmail], (err, result) => {
        if (err) {
            console.error("Error retrieving fileNames: " + err.stack);
            res.status(500).json({ error: "Error retrieving fileNames" });
            return;
        }
        
        // Extract fileId values from the SQL result
        const fileNames = result.map(row => row.fileName);

        res.status(200).json({ fileNames: fileNames });
    });
});

// Endpoint for retrieving all filenames
app.get('/api/sql/allFiles', (req, res) => {

    // SQL query to select fileId values based on user email
    const query = 'SELECT fileId, fileName FROM Files';

    con.query(query, (err, result) => {
        if (err) {
            console.error("Error retrieving fileNames: " + err.stack);
            res.status(500).json({ error: "Error retrieving fileNames" });
            return;
        }
        
        // Extract fileId values from the SQL result
        const fileNames = result.map(row => row.fileName);
        const fileIds = result.map(row => row.fileId)

        res.status(200).json({ fileNames: fileNames, fileIds: fileIds });
    });
});

// Endpoint for retrieving all filenames
app.get('/api/sql/allNewsletters', (req, res) => {

    // SQL query to select fileId values based on user email
    const query = 'SELECT fileId, fileName FROM Files';

    con.query(query, (err, result) => {
        if (err) {
            console.error("Error retrieving fileNames: " + err.stack);
            res.status(500).json({ error: "Error retrieving fileNames" });
            return;
        }
        
         // Filter file names and IDs based on filenames starting with "newsletter"
         const filteredFileNames = result.filter(row => row.fileName.startsWith("newsletter"));
         const fileNames = filteredFileNames.map(row => row.fileName);
         const fileIds = filteredFileNames.map(row => row.fileId); 

        res.status(200).json({ fileNames: fileNames, fileIds: fileIds });
    });
});

// Endpoint for retrieving fileId given email and fileName
app.get('/api/sql/returnFileId', (req, res) => {
    const { email, fileName } = req.query;
    console.log(email, fileName)

    const query = 'SELECT fileId FROM Files WHERE email = ? AND fileName = ?';
    con.query(query, [email, fileName], (err, result) => {
        if (err) {
            console.error("Error retrieving fileId: " + err.stack);
            res.status(500).json({ error: "Error retrieving fileId" });
            return;
        }
        
        // Extract fileId from the SQL result
        const fileId = result.length > 0 ? result[0].fileId : null;
        res.status(200).json({ fileId: fileId });
    });
});


// Endpoint to clock user in
// INSERT INTO
app.post('/api/clock-in', (req, res) => {
    const { email } = req.body;

    let sql = "INSERT INTO PunchCard (email, startTime) VALUES (?, NOW())";
    con.query(sql, email, (err, result) => {
        if (err) {
            console.error('Error inserting record: ' + err);
            res.status(500).json({ error: 'Error inserting record' });
            return;
        }
        res.status(200).json({ message: 'User clocked in successfully' });
    });
});

// Endpoint to clock user out
// UPDATE TABLE
app.put('/api/clock-out', (req, res) => {
    const { id } = req.body;

    let sql = "UPDATE PunchCard SET endTime = NOW() WHERE punchCardId = ?";
    con.query(sql, id, (err, result) => {
        if (err) {
            console.error('Error updating record: ' + err);
            res.status(500).json({ error: 'Error updating record' });
            return;
        }
        res.status(200).json({ message: 'User clocked out successfully' });
    });
});

// Enpoint get recent punch card
// SELECT MAX() FROM
app.post('/api/clock-id', (req, res) => {
    const { email } = req.body;

    let sql = "SELECT punchCardId, endTime " +
                "FROM PunchCard " +
                "WHERE email = ? " +
                "ORDER BY punchCardId DESC " +
                "LIMIT 1;";

    con.query(sql, email, (err, result) => {
        if (err) {
            console.error('Error retrieving events: ' + err.stack);
            res.status(500).json({ error: 'Error retrieving stack' });
            return;
        }
        res.status(200).json(result);
    });
});

