import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(true);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Temporary bypass to dashboard for test
    localStorage.setItem('user', JSON.stringify({ fullName, phone }));
    navigate({ to: '/dashboard' });
  };

  return (
    <div style={{ padding: '20px', color: '#fff', background: '#0a111e', minHeight: '100vh' }}>
      <h2>{isSignUp ? 'Create Account' : 'Sign In'}</h2>
      <form onSubmit={handleSubmit}>
        {isSignUp && (
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            style={{ display: 'block', margin: '10px 0', padding: '10px', width: '100%' }}
          />
        )}
        <input
          type="text"
          placeholder="Mobile Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          style={{ display: 'block', margin: '10px 0', padding: '10px', width: '100%' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ display: 'block', margin: '10px 0', padding: '10px', width: '100%' }}
        />
        <button type="submit" style={{ padding: '10px 20px', background: '#22c55e', color: '#fff', border: 'none' }}>
          {isSignUp ? 'Register Now' : 'Sign In'}
        </button>
      </form>
      <p onClick={() => setIsSignUp(!isSignUp)} style={{ color: '#22c55e', cursor: 'pointer', marginTop: '15px' }}>
        {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Register"}
      </p>
    </div>
  );
}
