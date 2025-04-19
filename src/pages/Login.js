import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Login.css';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        try {
            const response = await fetch('http://localhost/schizotactical/backend/login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ username, password }),
            });

            // Verificar estado de la respuesta
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            setMessage(data.message);

            if (data.success) {
                // Guardar estado de autenticación
                localStorage.setItem('isAdminLoggedIn', 'true');
                
                // Redirigir a la ruta especificada o por defecto
                navigate(data.redirect || '/admin/productos');
            }
        } catch (error) {
            console.error('Error en el login:', error);
            setMessage(error.message || 'Error al conectar con el servidor');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleSubmit}>
                <h2>Panel de Administración</h2>
                <div className="form-group">
                    <label>Usuario:</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        autoFocus
                    />
                </div>
                <div className="form-group">
                    <label>Contraseña:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Cargando...' : 'Ingresar'}
                </button>
                {message && (
                    <div className={`message ${message.includes('éxito') ? 'success' : 'error'}`}>
                        {message}
                    </div>
                )}
            </form>
        </div>
    );
}

export default Login;