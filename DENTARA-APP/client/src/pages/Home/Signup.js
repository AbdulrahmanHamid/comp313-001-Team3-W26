import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebaseConfig';
import '../../styles/Signup.css';

const Signup = () => {
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!role || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setError('');
      setLoading(true);

      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save user role in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: email,
        role: role,
        createdAt: new Date().toISOString(),
        profileCompleted: false
      });

      // Navigate to profile completion
      navigate('/complete-profile');


    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else {
        setError('Failed to create account: ' + err.message);
      }
    }

    setLoading(false);
  };

  return (
    <div className="signup-container">
      <div className="signup-left">
        <div className="dentara-logo">
          <h1>DENTARA</h1>
        </div>
      </div>

      <div className="signup-right">
        <div className="star-icon">✦</div>
        <h1>Welcome!</h1>
        <p className="subtitle">Please enter your details</p>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={loading}
              className="role-select"
            >
              <option value="">Select Role</option>
              <option value="staff">Staff</option>
              <option value="doctor">Doctor</option>
              <option value="manager">Manager</option>
            </select>
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                disabled={loading}
              />
              <span className="eye-icon">👁️</span>
            </div>

            <div className="form-group half">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                disabled={loading}
              />
              <span className="eye-icon">👁️</span>
            </div>
          </div>

          <button type="submit" className="btn-create" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <button
            type="button"
            className="btn-login"
            onClick={() => navigate('/login')}
            disabled={loading}
          >
            Log in
          </button>
        </form>
      </div>
    </div>
  );
};

export default Signup;
