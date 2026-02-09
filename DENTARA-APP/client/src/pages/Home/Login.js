import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError('');
      setLoading(true);
      const result = await login(email, password);
      
      if (result.success) {
        // Navigate based on role
        if (result.role === 'staff') {
          navigate('/staff-dashboard');
        } else if (result.role === 'doctor') {
          navigate('/doctor-dashboard');
        } else if (result.role === 'manager') {
          navigate('/manager-dashboard');
        }
      } else {
        setError(result.error || 'Failed to log in');
      }
    } catch (err) {
      setError('Failed to log in. Please check your credentials.');
    }
    
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="star-icon">✦</div>
        <h1>Welcome again!</h1>
        <p className="subtitle">Please enter your details</p>
        
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
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
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
            />
            <span className="eye-icon">👁️</span>
          </div>
          
          <div className="form-options">
            <label className="remember-checkbox">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                disabled={loading}
              />
              Remember for 30 days
            </label>
            <a href="#forgot" className="forgot-password">Forgot Password?</a>
          </div>
          
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
          
          <button 
            type="button" 
            className="btn-signup"
            onClick={() => navigate('/signup')}
            disabled={loading}
          >
            New authorized signup
          </button>
        </form>
      </div>
      
      <div className="login-right">
        <div className="dentara-logo">
          <h1>DENTARA</h1>
        </div>
      </div>
    </div>
  );
};

export default Login;
