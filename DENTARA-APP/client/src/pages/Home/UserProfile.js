import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/UserProfile.css';

const UserProfile = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!firstName || !lastName || !phone) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError('');
      setLoading(true);
      
      // Update user document in Firestore with additional info
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        firstName: firstName,
        lastName: lastName,
        phone: phone,
        profileCompleted: true
      });
      
      // Navigate based on role
      if (userRole === 'staff') {
        navigate('/staff-dashboard');
      } else if (userRole === 'doctor') {
        navigate('/doctor-dashboard/home');
      } else if (userRole === 'manager') {
        navigate('/manager-dashboard');
      }
      
    } catch (err) {
      setError('Failed to update profile: ' + err.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="star-icon">✦</div>
        <h1>Complete Your Profile</h1>
        <p className="subtitle">Please provide your information to continue</p>
        
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter your first name"
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter your last name"
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(123) 456-7890"
              disabled={loading}
            />
          </div>
          
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Saving...' : 'Complete Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserProfile;
