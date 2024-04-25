import React from 'react';
import "./Donate.css"
import donate1 from '../assets/donate-image.png'

function Donate() {
    
  return (
    <div className='donate-container'>
        <div className='donate-text'>
            <h1 className='donate-header'>
                Donate
            </h1>
            <div className='donate'>
              <div className='text'>
                Your donation to Ongoing Living & Learning Inc. directly contributes 
                to empowering the lives of adults with disabilities. By supporting our 
                programs, you are enabling individuals to access recreational activities, 
                employment assistance, and caregiver support groups that enhance their 
                overall well-being. Donations fuel inclusive opportunities for personal 
                and professional growth. Your support helps fund vocational training, 
                job placement initiatives, and recreational experiences, creating a more 
                inclusive society that values the diverse abilities of every individual.
              </div>
              <div className='img'>
                <img src={donate1} alt='img1'/>
              </div>
        
            </div>
        </div>


        <div className='donate-info'>
            <iframe 
              title="GoFundMe Widget"
              src="https://www.gofundme.com/f/support-ongoing-living-and-learning/widget/large?sharesheet=dashboard"
              width="100%"
              height="600px"
              frameborder="0"
            ></iframe>
        </div>
    </div>
  )
}

export default Donate