import React, { useState } from 'react';
import { AuthService, getAuthErrorMessage } from './authService';
import './Login.css';

const Login = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await AuthService.signIn(formData.email, formData.password);
      console.log('Admin logged in:', user.email);
      onLoginSuccess(user);
    } catch (error) {
      console.error('Login error:', error);
      setError(getAuthErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await AuthService.createUser(formData.email, formData.password);
      console.log('Admin account created:', user.email);
      onLoginSuccess(user);
    } catch (error) {
      console.error('Create admin error:', error);
      setError(getAuthErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-content">
        <div className="login-header">
          <h1>Admin Access</h1>
          <p>{showCreateAdmin ? 'Create Admin Account' : 'Sign in to access the admin panel'}</p>
        </div>

        <form onSubmit={showCreateAdmin ? handleCreateAdmin : handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={loading}
              placeholder="admin@example.com"
              className={error ? 'error' : ''}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              disabled={loading}
              placeholder="Enter your password"
              className={error ? 'error' : ''}
              minLength="6"
            />
          </div>

          {error && (
            <div className="error-message">
              <span>⚠️ {error}</span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary login-btn"
          >
            {loading ? 
              (showCreateAdmin ? 'Creating Account...' : 'Signing In...') : 
              (showCreateAdmin ? 'Create Admin Account' : 'Sign In')
            }
          </button>
        </form>

        <div className="login-footer">
          <button
            type="button"
            onClick={() => {
              setShowCreateAdmin(!showCreateAdmin);
              setError('');
              setFormData({ email: '', password: '' });
            }}
            className="toggle-mode-btn"
            disabled={loading}
          >
            {showCreateAdmin ? 
              'Already have an admin account? Sign In' : 
              'Need to create an admin account? Create Account'
            }
          </button>
        </div>

        <div className="login-info">
          <h3>Admin Access Information:</h3>
          <ul>
            <li>Only administrators can access this panel</li>
            <li>All authenticated users have admin privileges</li>
            <li>Use the "Create Account" option for initial setup</li>
            <li>Keep your admin credentials secure</li>
          </ul>
        </div>

        <div className="back-to-exam">
          <a href="/">← Back to Exam Portal</a>
        </div>
      </div>
    </div>
  );
};

export default Login;