<?php
/**
 * Enhanced session configuration for Wolf Tactical
 * Implements secure session handling
 */

// Prevent session fixation
if (session_status() === PHP_SESSION_NONE) {
    // Secure session configuration
    ini_set('session.cookie_httponly', 1);
    ini_set('session.use_only_cookies', 1);
    ini_set('session.cookie_samesite', 'Strict');
    
    // Use strict session ID
    ini_set('session.use_strict_mode', 1);
    
    // Regenerate session ID periodically
    ini_set('session.gc_maxlifetime', 3600); // 1 hour
    
    // Session name (change from default PHPSESSID)
    session_name('WOLFTACTICAL_SESSION');
    
    // Start session
    session_start();
    
    // Regenerate session ID on login (implement in login logic)
    if (!isset($_SESSION['initiated'])) {
        session_regenerate_id(true);
        $_SESSION['initiated'] = true;
        $_SESSION['created'] = time();
    }
    
    // Check session timeout (30 minutes of inactivity)
    if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity'] > 1800)) {
        session_unset();
        session_destroy();
        session_start();
    }
    $_SESSION['last_activity'] = time();
    
    // Regenerate session ID every 30 minutes
    if (isset($_SESSION['created']) && (time() - $_SESSION['created'] > 1800)) {
        session_regenerate_id(true);
        $_SESSION['created'] = time();
    }
}
?>
