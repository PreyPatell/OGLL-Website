import React, { useState, useEffect } from 'react';
import './PunchCard.css';

const PunchCard = () => {
    const [clockData, setClockData] = useState(null);
    const [email, setEmail] = useState('');
    const [decodedToken, setDecodedToken] = useState(null);
    const [punchID, setPunchID] = useState(null);
    const [clockedIn, setClockedIn] = useState(null);

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
                console.log("Data: ",data)
                setDecodedToken(data.decodedToken);
                setEmail(data.decodedToken.email);
    
                // Fetch clock data after getting email
                fetchClockData(data.decodedToken.email);
            })
            .catch(error => {
                console.error('Error decoding token:', error.message);
            });
        } else {
            console.error('JWT token not found in local storage');
        }
    }, []);
    
    const fetchClockData = (email) => {
        fetch('http://localhost:3001/api/clock-id', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data && data.length > 0) {
                if (data[0].endTime == null) {
                    setClockData(null);
                    setPunchID(data[0].punchCardId);
                    setClockedIn(true);
                } else {
                    setPunchID(data[0].punchCardId);
                    setClockedIn(false);
                    setClockData(data[0].endTime);
                }
            } else {
                // Handle the case when no data is returned
                console.error('No data returned from the server');
            }
        })
        .catch(error => {
            console.error('There was an error fetching data: ', error);
        });
    };

    const handleClockInOut = () => {
        if (clockedIn) {
            // Clock out
            fetch('http://localhost:3001/api/clock-out', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: punchID }),
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log(data);
                setClockedIn(false);
                fetchClockData(email);
            })
            .catch(error => {
                console.error('There was an error clocking out: ', error);
            });
        } else {
            // Clock in
            fetch('http://localhost:3001/api/clock-in', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log(data);
                setClockedIn(true);
                fetchClockData(email);
            })
            .catch(error => {
                console.error('There was an error clocking in: ', error);
            });
        }
    };

    return (
        <div className="punch-card-container">
            <h2 className="punch-card-header">Punch Card</h2>
            {clockedIn ? (
                <p className="clock-status">Currently Clocked In</p>
            ) : (
                <p className="clock-status">Currently Clocked Out</p>
            )}
            <div className="clock-button-wrapper">
                <button className="clock-button" onClick={handleClockInOut} disabled={!email}>
                    {clockedIn ? 'Clock Out' : 'Clock In'}
                </button>
            </div>
        </div>
    );
};

export default PunchCard;
