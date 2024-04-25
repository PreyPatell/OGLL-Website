import { React, useState, useEffect, Component } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Map, Marker, GoogleApiWrapper } from 'google-maps-react';
import waiverPDF from '../assets/Ongoing_Living_and_Learning_Event_Waiver.pdf';

import './Events.css';

import event1 from '../assets/event1-events.png';
import loadingIcon from '../assets/loading.gif';

function ImageModal({ imageUrl, onClose }) {
  return (
    <div className="image-modal-overlay" onClick={onClose}>
      <div className="image-modal">
        <img src={imageUrl} alt="Selected Image" />
      </div>
    </div>
  );
}

function Events() {
  const [value, onChange] = useState(new Date());
  const [email, setEmail] = useState(null)
  const [decodedToken, setDecodedToken] = useState(null)
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

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
          console.log("Data: ", data)
          setDecodedToken(data.decodedToken);
          setEmail(data.decodedToken.email);
        })
        .catch(error => {
          console.error('Error decoding token:', error.message);
        });
    } else {
      console.error('JWT token not found in local storage');
    }
    const getAlbumIds = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/albums");
        const data = await response.json();
        return data.albums.map(album => album.id);
      } catch (error) {
        console.error("Error fetching album IDs: ", error);
        return [];
      }
    };

    const getImagesFromAlbum = async (albumId) => {
      try {
        const response = await fetch(`http://localhost:3001/api/media-from-album?albumId=${albumId}`);
        const data = await response.json();
        return data.pics;
      } catch (error) {
        console.error(`Error fetching images from album ${albumId}: `, error);
        return [];
      }
    };

    const getImages = async () => {
      const albumIds = await getAlbumIds();
      if (albumIds.length > 0) {
        const eventAlbumId = albumIds[1];
        const images = await getImagesFromAlbum(eventAlbumId);
        setImages(images);
        setLoading(false); // Set loading to false when images are fetched
      }
    };

    getImages();
  }, []);

  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  const [date, setDate] = useState(new Date());
  const [eventNames, setEventNames] = useState([]);

  const handleDateChange = async (date) => {
    // Extract year, month, and day from the selected date
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // Months are zero-based, so add 1
    const day = date.getDate();

    // Format the date as year-month-day
    const formattedDate = `${year}-${month}-${day}`;

    // Update the state with the selected date
    setDate(date);

    // Retrieve events for the selected date
    await retrieveEventNames(formattedDate);
  };

  const handleRegister = () => {
    const registrationData = {
      email: email,
      eventID: eventID
    };

    fetch('http://localhost:3001/api/event-participant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(registrationData)
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to register for the event');
        }
        return response.json();
      })
      .then(data => {
        // Handle successful registration
        console.log('Successfully registered for the event:', data.message);
        // Put message sent back in setRegister
        setRegister(data.message);
      })
      .catch(error => {
        console.error('Error registering for the event:', error.message);
        setRegister("Already Registered to event");
      });
  };

  // Function to retrieve all events on a given day
  const retrieveEventNames = async (formattedDate) => {
    try {
      // Ensure that formattedDate is a string
      const dateString = formattedDate.toString();
      console.log(dateString)
      const response = await fetch(`http://localhost:3001/api/sql/retrieveEventNames/${dateString}`);
      const data = await response.json();
      console.log('Events for selected date:', data.eventNames);
      setEventNames(data.eventNames);
    } catch (error) {
      console.error(`Error fetching events from date ${formattedDate}: `, error);
      setEventNames([]);
    }
  };

  // Function to download the waiver for an event 
  const handleWaiverDownload = () => {
    // Create a temporary anchor element
    const anchorElement = document.createElement('a');
    anchorElement.href = waiverPDF;
    anchorElement.download = 'newsletter_2024-03-29.pdf'; // Specify the filename to be downloaded

    // Append the anchor to the body and click it programmatically
    document.body.appendChild(anchorElement);
    anchorElement.click();

    // Clean up by removing the anchor from the body
    document.body.removeChild(anchorElement);
  };

  const [eventStartTime, setEventStartTime] = useState("");
  const [eventEndTime, setEventEndTime] = useState("");
  const [eventSponsor, setEventSponsor] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventInfo, setEventInfo] = useState("");
  const [eventID, setEventID] = useState("")
  const [eventName, setEventName] = useState("");
  const [showSelectedEvent, setShowSelectedEvent] = useState(false);
  const [register, setRegister] = useState("")

  const handleSelectEvent = () => {
    setShowSelectedEvent(false);
    const eventName = document.getElementById("current-event-name").value;
    setRegister("")
    // Extract year, month, and day from the selected date
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // Months are zero-based, so add 1
    const day = date.getDate();

    // Format the date as year-month-day
    const formattedDate = `${year}-${month}-${day}`;
    const searchData = {
      name: eventName, // Enter the name of the event to search for
      date: formattedDate, // Enter the date of the event to search for (optional)
      location: '' // Enter the location of the event to search for (optional)
    };

    fetch('http://localhost:3001/api/search-events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchData)
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to retrieve events');
        }
        return response.json();
      })
      .then(data => {
        // Update state variables with the retrieved event data
        const eventData = data[0]; // Assuming only one event is returned
        setEventStartTime(eventData.startTime);
        setEventEndTime(eventData.endTime);
        setEventID(eventData.eventID)
        setEventSponsor(eventData.eventSponsor);
        setEventLocation(eventData.eventLocation);
        setEventInfo(eventData.eventInfo);
        setEventName(eventData.eventName);
        setShowSelectedEvent(true);
      })
      .catch(error => {
        console.error('Error retrieving events:', error.message);
      });
  };

  return (
    <div className='body'>
      <div className='events-container'>
        <div className='col-text'>
          <h1 className='events-header'>
            Past Events
          </h1>
          <div className='events'>
            <div className='events1'>
              <div className='text'>
              So when its cold and snowy ... bake! Perfecting our muffin technique with the master. Much thanks to Karen H for your sharing time and talent with us.
              </div>
              <div className='img'>
                <img src={event1} alt='img1' />
              </div>
            </div>

            <div className='events1'>
              <div className='img'>
                <img src={event1} alt='img1' />
              </div>
              <div className='text'>
              Today is our last day open for the season. We have Pumkpin Spice Fancy Coffee, Regular Coffee, fresh muffins and BUTTER TARTS! Pop, chocolate bars, chips, ice cream treats are all 50% off today until 4:00 pm. Help support our CHEER Group today!🥰
              </div>
            </div>
          </div>
        </div>

        <div className='col-cal'>
          <h1 className='events-header'>Event Calendar</h1>
          <div className='cal-info'>
            <div className='calendar-div'>
              <Calendar className='calendar' onChange={handleDateChange} value={date} />
            </div>

            <div className='event-names'>
              <div className='event-name'>
                <p className='events-p'>Events</p>
                <select className="events-select" id='current-event-name'>
                  {eventNames.length > 0 ? (
                    eventNames.map((eventName, index) => (
                      <option key={index} value={eventName}>{eventName}</option>
                    ))
                  ) : (
                    <option value="">No events</option>
                  )}
                </select>
              </div>

              <div className='button'>
                <button className='submit-btn' onClick={handleSelectEvent}>Select</button>
              </div>

            </div>
          </div>
        </div>
      </div>

      {showSelectedEvent && (
        <div className='hidden-selected-event-div'>
          <h1 className='events-header' id='selected-event-header'>{eventName}</h1>
          <div className='selected-event-div'>
            <div className='selected-event-info'>
              <div className='selected-event-more-info'>
                <div className='event-info-item'>
                  <span>Event Start Time:</span>
                  <p className='event-start-time'>{eventStartTime}</p>
                </div>
                <div className='event-info-item'>
                  <span>Event End Time:</span>
                  <p className='event-end-time'>{eventEndTime}</p>
                </div>
                <div className='event-info-item'>
                  <span>Event Location:</span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(eventLocation)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className='event-location-link'
                  >
                    <p className='event-location'>{eventLocation}</p>
                  </a>
                </div>
                <div className='event-info-item'>
                  <span>Event Sponsor(s):</span>
                  <p className='event-sponsor'>{eventSponsor}</p>
                </div>
                <div className='event-info-item'>
                  <p className='event-waiver' onClick={handleWaiverDownload}>Download Waiver Here</p>
                </div>
                <div className='register-button'>
                  <button className='register-btn' onClick={handleRegister}>Register</button>
                </div>
                <p>{register}</p>
              </div>

              <div className='selected-event-desc'>
                <p className='event-info'>{eventInfo}</p>
              </div>
            </div>

            <div className='selected-event-img'>
              <img></img>
            </div>
          </div>
        </div>
      )}

      <div className="event-gallery">
        <h1>Event Gallery</h1>
        {loading ? (
          <img src={loadingIcon} alt="Loading..." className="loading-icon" />
        ) : (
          <div className="event-gallery-image-container">
            {images.map((image, index) => (
              <img
              
                key={index}
                src={image}
                alt={`Image ${index + 1}`}
                className='eventImg'
                onClick={() => openImageModal(image)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedImage && (
        <ImageModal imageUrl={selectedImage} onClose={closeImageModal} />
      )}
    </div>
  );
}

export default Events;

