import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Importa Link
import '../Login.css'; // Asegúrate que la ruta sea correcta

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
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
                // Intentar obtener mensaje de error del backend si es posible
                let errorMsg = `Error HTTP: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorMsg;
                } catch (jsonError) {
                    // No se pudo parsear JSON, usar mensaje HTTP
                }
                if (response.status === 403) {
                    setIsBlocked(true);
                }
                throw new Error(errorMsg);
            }

            const data = await response.json();

            if (data.success) {
                setMessage(data.message); // Mostrar mensaje de éxito brevemente
                localStorage.setItem('isAdminLoggedIn', 'true');
                // Pequeña pausa antes de redirigir para ver el mensaje
                setTimeout(() => {
                    navigate(data.redirect || '/admin/productos');
                }, 500); // 0.5 segundos
            } else {
                // Si success es false, lanzar error con el mensaje del backend
                throw new Error(data.message || 'Credenciales incorrectas');
            }
        } catch (error) {
            console.error('Error en el login:', error);
            // Mostrar mensaje de error específico capturado
            setMessage(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box"> {/* Contenedor extra para centrar y estilizar */}
                <form className="login-form" onSubmit={handleSubmit}>
                    <h2>Acceso Administrador</h2> {/* Título más específico */}
                    <div className="form-group">
                        {/* <label htmlFor="username">Usuario:</label> */} {/* Opcional si usas placeholder */}
                        <input
                            id="username" // Añadir id para el label (si se usa)
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Nombre de usuario" // Placeholder como alternativa a label
                            required
                            disabled={isBlocked}
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        {/* <label htmlFor="password">Contraseña:</label> */} {/* Opcional */}
                        <input
                            id="password" // Añadir id
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Contraseña" // Placeholder
                            required
                            disabled={isBlocked}
                        />
                    </div>
                    {/* Mensaje de error/éxito */}
                    {message && (
                        // Determinar clase basado en si el mensaje contiene 'éxito' o no
                        <div className={`message ${message.toLowerCase().includes('éxito') ? 'success' : 'error'}`}>
                            {message}
                        </div>
                    )}
                    <button type="submit" className="btn-login" disabled={isLoading || isBlocked}>
                        {isBlocked ? 'Acceso denegado' : (isLoading ? 'Verificando...' : 'Ingresar')}
                    </button>

                    {/* Botón para volver a la tienda */}
                    <Link to="/" className="btn-back-store">
                        Volver a la Tienda
                    </Link>
                </form>
            </div>
        </div>
    );
}

export default Login;
