import React, { useState, useEffect } from 'react';

import './Gallery.css';
import loadingIcon from '../assets/loading.gif';


function Gallery() {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const getAlbumIds = async () => {
            try {
                const response = await fetch("http://localhost:3001/api/albums");
                if (response.status === 401) {
                    // Handle expired token
                    console.error("Session expired. Please re-authenticate.");
                    // Redirect to login page or show a message to re-authenticate
                    return [];
                }
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
                if (response.status === 401) {
                    // Handle expired token
                    console.error("Session expired. Please re-authenticate.");
                    // Redirect to login page or show a message to re-authenticate
                    return [];
                }
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
                const firstAlbumId = albumIds[0];
                const images = await getImagesFromAlbum(firstAlbumId);
                setImages(images);
                setLoading(false); // Set loading to false when images are fetched

            }
        };

        getImages();
    }, []);

    return (
        <div className="gallery">
            <h1>Gallery</h1>
            {loading ? (
                <img src={loadingIcon} alt="Loading..." className="loading-icon" />
            ) : (
            <div className="gallery-image-container">
                {images.map((image, index) => (
                    <img key={index} src={image} alt={`Image ${index + 1}`} className='galImage' />
                ))}
            </div>
            )}
        </div>
    );
}

export default Gallery;
