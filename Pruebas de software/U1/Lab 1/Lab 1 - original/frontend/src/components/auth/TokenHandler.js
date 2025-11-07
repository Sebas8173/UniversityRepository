import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GoogleRegisterDialog from './GoogleRegisterDialog';

export default function TokenHandler() {
  const navigate = useNavigate();
  const [showGoogleRegister, setShowGoogleRegister] = useState(false);
  const [googleUserData, setGoogleUserData] = useState({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const registerGoogleUser = params.get('registerGoogleUser');
    
    if (token) {
      localStorage.setItem('token', token);
      window.history.replaceState({}, document.title, '/');
      navigate('/');
    } else if (registerGoogleUser === 'true') {
      const email = params.get('email');
      const username = params.get('username');
      const message = decodeURIComponent(params.get('message') || '');
      
      setGoogleUserData({ email, username, message });
      setShowGoogleRegister(true);
      
      // Limpiar la URL
      window.history.replaceState({}, document.title, '/');
    }
  }, [navigate]);

  const handleCloseGoogleRegister = () => {
    setShowGoogleRegister(false);
    setGoogleUserData({});
  };

  return (
    <>
      <GoogleRegisterDialog
        open={showGoogleRegister}
        onClose={handleCloseGoogleRegister}
        email={googleUserData.email}
        username={googleUserData.username}
        message={googleUserData.message}
      />
    </>
  );
}
