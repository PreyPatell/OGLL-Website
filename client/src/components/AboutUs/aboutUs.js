import React from 'react';
import aboutUsImage from '../assets/aboutUs.png'; // Change the import name
import connections from '../assets/cheer-connections.png';
import group from '../assets/cheer-group.png';
import works from '../assets/cheer-works.png';

import './aboutUs.css';

function AboutUs() { // Change the function name to start with an uppercase letter
  return (
    <div id='about-us'>
      <h1>About Us</h1>
      <div id='paragraph'>
      <p>Ongoing Living & Learning Inc. is a pioneering organization committed to empowering adults with disabilities through comprehensive support services. Despite being in the early stages, the organization acknowledges the urgent need for a robust online presence to ensure inclusivity and accessibility. The absence of a website has led to challenges, including limited information dissemination, communication gaps, and constraints in caregiver support. The current project focuses on creating a fully accessible website to address these challenges, aiming to bridge communication gaps, enhance support systems, and foster community involvement. This initiative is crucial for realizing the organization's mission and promoting a more inclusive and accessible future for all.</p>
      <img src={aboutUsImage} alt="about us family " className="family-image"/> {/* Use the updated variable name */}
      </div>
      <div id='partners'>
        <h2> Our Partners</h2>
        <div className="partner-section">
          <img src={connections} alt="connect logo" className="partner-image-connect"/>
          <p>Established in February 2021, Cheer Connections is a caregiver support group comprising parents and caregivers, including those with adult children in the CHEER group. Monthly meetings offer mutual support and knowledge sharing, addressing concerns such as ODSP, housing, employment, and social opportunities. Funded by the Ontario Caregivers Association, the group hosts workshops, fostering discussion and learning. Family involvement in Cheer Connections is mandatory for CHEER Group members, promoting a sense of community and reducing caregiver isolation. Supported by various entities, including the Ontario Caregivers Association and Algarva 168, the group engages in fundraising efforts and accepts online donations through Canada Helps. In addition to providing respite care, Cheer Connections ensures a social and supportive environment for caregivers seeking both information and recreational activities.</p>
        </div>
        <div className="partner-section">
          <img src={group} alt="connect logo" className="partner-image" />
          <p>CHEER Group is a community of families caring for adults with higher functioning intellectual disabilities. By pooling resources, they share support workers on a cost-effective 4:1 ratio, reducing expenses compared to the typical 1:1 ratio. The program, paid through Passport funding, features energetic full-time and part-time staff along with volunteer grade 12 students. Attendees enjoy spending time with friends in their community through a preset calendar of events, paying only for the activities they use. The club is based at Rock Glen Family Resort, offering access to various facilities. The group focuses on building life, social, and leisure skills while promoting community inclusion. Attendees must be self-sufficient in self-care, and caregivers actively contribute to the success of the group. Family get-togethers and volunteering are integral parts of the group, aligning with the name CHEER, symbolizing joy, praise, comfort, and support.</p>
        </div>
        <div className="partner-section">
          <img src={works} alt="connect logo" className="partner-image" />
          <p>In June, 2023, we opened an ice cream/variety store called Cheer Canteen and Roxy’s Putter Golf course at Rock Glen Resort, in Arkona, open street side to the public as well as the camp, so please come by and support us if you are in the area. CHEER Works employs members of the CHEER Group who have been developing their job skills. This is a safe and assisted working environment providing paid employment</p>
        </div>
      </div>
    </div>
  );
}

export default AboutUs; // Change the export name to start with an uppercase letter
