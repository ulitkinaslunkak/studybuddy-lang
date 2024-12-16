import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(''); 
  const navigate = useNavigate(); 

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('/login', { email, password });
      const { token } = response.data;

      localStorage.setItem('token', token);

      setSuccessMessage('Ура, вы успешно вошли!');

      setTimeout(() => {
        navigate('/profile'); 
      }, 2000);
    } catch (err) {
      setError('Неверный логин или пароль');
    }
  };

  return (
    <div>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Войти</button>
      </form>

      {successMessage && <p>{successMessage}</p>}  {/*показ сообщения о входе*/}
      {error && <p>{error}</p>}
    </div>
  );
}

export default Login;
