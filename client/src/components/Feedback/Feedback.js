import React, { useState } from 'react';
import './Feedback.css';

function Feedback() {
  const [rating, setRating] = useState(0); // State to store the selected rating
  const [feedbackMessage, setFeedbackMessage] = useState(''); // State to store feedback message
  const [feedbackCategory, setFeedbackCategory] = useState(''); // State to store feedback category

  // Function to handle emoji click and set the rating
  const handleEmojiClick = (value) => {
    setRating(value);
  };

  // Function to handle feedback message change
  const handleFeedbackMessageChange = (event) => {
    setFeedbackMessage(event.target.value);
  };

  // Function to handle feedback category selection
  const handleFeedbackCategory = (category) => {
    setFeedbackCategory(category);
  };

  // Function to send feedback 
  const handleSendFeedback = () => {
    // Compose email body with rating and feedback message
    const emailBody = `Rating: ${rating}/5\n\nFeedback: ${feedbackMessage}`;

    // Construct the subject line with feedback category
    const subject = `Feedback - ${feedbackCategory}`;

    const email = 'ihartmancheer@gmail.com';
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoLink;
  };

  return (
    <div className='feedback-container'>
      <div className='feedback-text'>
        <h1 className='feedback-header'>
          Feedback
        </h1>
        <div className='feedback'>
          <div className='text'>
            <p>We'd love your feedback to improve our website.</p>
          </div>
          <div className='feedback-faces'>
            <p>What is your opinion of our page?</p>
          </div>
          <div className='feedback-faces-pictures'>
            <span className={`emoji ${rating === 1 ? 'selected' : ''}`} id='mad' onClick={() => handleEmojiClick(1)}>😠</span>
            <span className={`emoji ${rating === 2 ? 'selected' : ''}`} id='sad' onClick={() => handleEmojiClick(2)}>🙁</span>
            <span className={`emoji ${rating === 3 ? 'selected' : ''}`} id='mid' onClick={() => handleEmojiClick(3)}>😐</span>
            <span className={`emoji ${rating === 4 ? 'selected' : ''}`} id='happy' onClick={() => handleEmojiClick(4)}>🙂</span>
            <span className={`emoji ${rating === 5 ? 'selected' : ''}`} id='love' onClick={() => handleEmojiClick(5)}>😀</span>
          </div>

          <div className='feedback-category'>
            <p>Please select a feedback category:</p>
            <button className={`${feedbackCategory === 'Suggestions' ? 'selected' : ''}`} onClick={() => handleFeedbackCategory('Suggestions')}>Suggestions</button>
            <button className={`${feedbackCategory === 'Complaints' ? 'selected' : ''}`} onClick={() => handleFeedbackCategory('Complaints')}>Complaints</button>
            <button className={`${feedbackCategory === 'Compliments' ? 'selected' : ''}`} onClick={() => handleFeedbackCategory('Compliments')}>Compliments</button>
          </div>

          <div className='feedback-text'>
            <p>Please leave your feedback below.</p>
          </div>
        
          <div className='feedback-body'>
            <textarea className="feedback-message" placeholder="Leave your feedback here..." onChange={handleFeedbackMessageChange}></textarea>
          </div>

          <div className='feedback-submit-button'>
            <button onClick={handleSendFeedback}>Send Feedback</button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Feedback;

