import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

function Login() {
    const navigate = useNavigate();
    const { login, isLoading, error } = useAuthStore();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [localError, setLocalError] = useState(null);

    // Update local error when auth error changes
    useEffect(() => {
        if (error) {
            setLocalError(error);
        }
    }, [error]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError(null); // Clear previous error
        const result = await login(formData.email, formData.password);

        if (result.success) {
            navigate('/');
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Property Management System</h1>
                    <p className="text-gray-600 mt-2">Sign in to your account</p>
                </div>

                {localError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex justify-between items-center">
                        <span>{localError}</span>
                        <button
                            onClick={() => setLocalError(null)}
                            className="text-red-700 hover:text-red-900 font-bold text-xl leading-none"
                        >
                            ×
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="label">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="input"
                            placeholder="admin@pms.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="label">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="input"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn btn-primary w-full"
                    >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                            Register
                        </Link>
                    </p>
                </div>

                {/* Demo Credentials */}
                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Demo Accounts:</p>
                    <div className="text-xs text-gray-600 space-y-1">
                        <p><strong>Admin:</strong> admin@pms.com / Admin123!</p>
                        <p><strong>Staff:</strong> staff@pms.com / Staff123!</p>
                        <p><strong>Technician:</strong> tech@pms.com / Tech123!</p>
                        <p><strong>Tenant:</strong> tenant1@email.com / Tenant123!</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
