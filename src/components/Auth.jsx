import React, { useState } from 'react';
import { z } from 'zod';
import { registerSchema, loginSchema } from '../utils/validation';
import API from '../api';

export default function Auth({ onLoginSuccess }) {
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ name: '', email: '', password: '', bio: '', profilePicUrl: '' });
    const [zodErrors, setZodErrors] = useState({});

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setZodErrors({});

        try {
            // Validate with Zod
            if (isLogin) {
                loginSchema.parse({ email: formData.email, password: formData.password });
                const { data } = await API.post('/auth/login', { email: formData.email, password: formData.password });
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                onLoginSuccess(data.user);
            } else {
                registerSchema.parse(formData);
                await API.post('/auth/register', formData);
                alert('Registration successful! Please login.');
                setIsLogin(true);
            }
        } catch (err) {
            if (err instanceof z.ZodError) {
                const errorsObj = {};
                err.errors.forEach(e => { errorsObj[e.path[0]] = e.message; });
                setZodErrors(errorsObj);
            } else {
                setError(err.response?.data?.message || 'Something went wrong');
            }
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center mb-6">{isLogin ? 'Login' : 'Register'}</h2>

                {error && <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Name (min 3 chars)</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
                            {zodErrors.name && <p className="text-red-500 text-xs mt-1">{zodErrors.name}</p>}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
                        {zodErrors.email && <p className="text-red-500 text-xs mt-1">{zodErrors.email}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password (min 6 chars)</label>
                        <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
                        {zodErrors.password && <p className="text-red-500 text-xs mt-1">{zodErrors.password}</p>}
                    </div>

                    {!isLogin && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Bio</label>
                                <input type="text" name="bio" value={formData.bio} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Profile Picture URL</label>
                                <input type="text" name="profilePicUrl" value={formData.profilePicUrl} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
                            </div>
                        </>
                    )}

                    <button type="submit" className="w-full py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
                        {isLogin ? 'Login' : 'Register'}
                    </button>
                </form>

                <p className="mt-4 text-center text-sm text-gray-600">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                    <button onClick={() => setIsLogin(!isLogin)} className="text-blue-600 font-medium hover:underline">
                        {isLogin ? 'Register' : 'Login'}
                    </button>
                </p>
            </div>
        </div>
    );
}