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
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
            <div className="w-full max-w-sm bg-white rounded-xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
                {/* Brand header */}
                <div className="flex items-center justify-center gap-2 mb-5">
                    <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">M</span>
                    <span className="text-lg font-bold text-slate-900 tracking-tight">MiniSocial</span>
                </div>

                {/* Subtitle / Mode tabs */}
                <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-medium mb-5">
                    <button
                        type="button"
                        onClick={() => { setIsLogin(true); setError(''); setZodErrors({}); }}
                        className={`flex-1 py-1.5 rounded-md transition-all ${isLogin ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        onClick={() => { setIsLogin(false); setError(''); setZodErrors({}); }}
                        className={`flex-1 py-1.5 rounded-md transition-all ${!isLogin ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        Register
                    </button>
                </div>

                {error && <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-3.5">
                    {!isLogin && (
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Full Name</label>
                            <input
                                type="text"
                                name="name"
                                placeholder="Jane Doe"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                            />
                            {zodErrors.name && <p className="text-rose-500 text-xs mt-1">{zodErrors.name}</p>}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Email address</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                        />
                        {zodErrors.email && <p className="text-rose-500 text-xs mt-1">{zodErrors.email}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Password</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="At least 6 characters"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                        />
                        {zodErrors.password && <p className="text-rose-500 text-xs mt-1">{zodErrors.password}</p>}
                    </div>

                    {!isLogin && (
                        <>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Bio (optional)</label>
                                <input
                                    type="text"
                                    name="bio"
                                    placeholder="A short intro about you"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Profile Picture URL (optional)</label>
                                <input
                                    type="text"
                                    name="profilePicUrl"
                                    placeholder="https://example.com/avatar.jpg"
                                    value={formData.profilePicUrl}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                                />
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer mt-2"
                    >
                        {isLogin ? 'Sign In' : 'Create Account'}
                    </button>
                </form>

                <p className="mt-5 text-center text-xs text-slate-500">
                    {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                    <button
                        type="button"
                        onClick={() => { setIsLogin(!isLogin); setError(''); setZodErrors({}); }}
                        className="text-blue-600 font-semibold hover:underline cursor-pointer"
                    >
                        {isLogin ? 'Register now' : 'Sign in'}
                    </button>
                </p>
            </div>
        </div>
    );
}
