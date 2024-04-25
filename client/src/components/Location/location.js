import React, { Component } from 'react';
import './location.css';
import { Map, Marker, GoogleApiWrapper } from 'google-maps-react';

export class Location extends Component {
  redirectToGoogleMaps = () => {
    window.open('https://www.google.com/maps/place/Rock+Glen+Rd,+Lambton+Shores,+ON+N0M+1B0/@43.082458,-81.8364618,15.36z/data=!4m6!3m5!1s0x882f1301be5c8d8d:0xdbc6487e5ed86c1b!8m2!3d43.0822294!4d-81.8265489!16s%2Fg%2F1tl_mc1r?entry=ttu', '_blank');
  };

  render() {
    // Manually set the coordinates for Rockglen Road, Arkona, ON, Canada N0M 1B0
    const locationCoords = { lat: 43.0827150269142, lng: -81.82613838361804 };
    
    const containerStyle = {
      position: 'relative',
      width: '90%',
      height: '80%',
      margin: '50px auto', 
      border: '4px solid #D8AA9F8A',
      borderRadius: '20px', 
    };

    return (
      <div >
        <div className='header'>
        <header>
          <h1>Find Us!</h1>
          <button onClick={this.redirectToGoogleMaps} className='directions'>Get Directions</button>
        </header>
        </div>
        <div className='map'>
          <Map google={this.props.google} zoom={14} initialCenter={locationCoords} style={containerStyle}>
            <Marker
              name={'Rockglen Road, Arkona, ON, Canada N0M 1B0'}
              position={locationCoords}
            />
          </Map>
        </div>
      </div>
    );
  }
}

export default GoogleApiWrapper({
})(Location);
