import React, { useState } from 'react';
import '../Login.css';
import { useNavigate } from 'react-router-dom';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('http://localhost/schizotactical/backend/login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            setMessage(data.message);

            if (data.success) {
                // Guardar en localStorage o contexto de autenticación
                localStorage.setItem('isAdminLoggedIn', 'true');
                
                // Redirigir usando react-router
                if (data.redirect) {
                    // Extraer la ruta de la URL completa
                    const redirectPath = new URL(data.redirect).pathname;
                    navigate(redirectPath);
                } else {
                    navigate('/productos');
                }
            }
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            setMessage('Error al conectar con el servidor');
        }
    };

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleSubmit}>
                <h2>Iniciar Sesión</h2>
                <input
                    type="text"
                    placeholder="Nombre de usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Ingresar</button>
                {message && <p className="message">{message}</p>}
            </form>
        </div>
    );
}

export default Login;