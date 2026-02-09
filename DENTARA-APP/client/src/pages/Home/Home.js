import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Home.css';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="home-left">
        <div className="star-icon">✦</div>
        <h1>Welcome to Dentara!</h1>
        <p className="subtitle">Your complete dental practice management solution</p>
        
        <div className="home-buttons">
          <button className="btn-login" onClick={() => navigate('/login')}>
            Log In
          </button>
          <button className="btn-signup" onClick={() => navigate('/signup')}>
            New Authorized Signup
          </button>
        </div>
      </div>
      
      <div className="home-right">
        <div className="dentara-logo">
          <h1>DENTARA</h1>
        </div>
      </div>
    </div>
  );
};

export default Home;
