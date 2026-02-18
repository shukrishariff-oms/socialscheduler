import { useState } from 'react';
import './ConnectAccountModal.css';

export default function ConnectAccountModal({ platform, onClose, onSuccess }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleConnect = async () => {
        // For Threads, use OAuth instead of password
        if (platform === 'threads') {
            window.location.href = '/api/auth/threads/authorize';
            return;
        }

        // For other platforms, use password-based authentication
        if (!username || !password) {
            setError('Please enter both username and password');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`/api/accounts/connect/${platform}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                onSuccess(data.username);
                onClose();
            } else {
                setError(data.error || 'Connection failed. Please check your credentials.');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !loading && username && password) {
            handleConnect();
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Connect {platform.charAt(0).toUpperCase() + platform.slice(1)} Account</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>


                <div className="modal-body">
                    {platform === 'threads' ? (
                        <>
                            <p className="modal-description">
                                Connect your Threads account via Meta's secure OAuth.
                                You'll be redirected to authenticate with Meta.
                            </p>

                            <div className="oauth-info">
                                <span className="info-icon">🔒</span>
                                <span>We use OAuth 2.0 for secure authentication. Your credentials are never stored.</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="modal-description">
                                Enter your {platform} credentials to connect your account.
                                Your password will be encrypted and stored securely.
                            </p>

                            <div className="form-group">
                                <label htmlFor="username">Username</label>
                                <input
                                    id="username"
                                    type="text"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    disabled={loading}
                                    autoFocus
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <input
                                    id="password"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    disabled={loading}
                                />
                            </div>

                            {error && (
                                <div className="error-message">
                                    <span className="error-icon">⚠️</span>
                                    {error}
                                </div>
                            )}

                            <div className="modal-info">
                                <span className="info-icon">ℹ️</span>
                                <span>This will test your login and save your session for future posts.</span>
                            </div>
                        </>
                    )}
                </div>

                <div className="modal-footer">
                    <button
                        className="btn-secondary"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn-primary"
                        onClick={handleConnect}
                        disabled={loading || (platform !== 'threads' && (!username || !password))}
                    >
                        {loading ? (
                            <>
                                <span className="spinner"></span>
                                Connecting...
                            </>
                        ) : (
                            platform === 'threads' ? 'Connect with Meta OAuth' : 'Connect Account'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
