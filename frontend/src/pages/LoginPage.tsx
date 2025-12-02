import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { AppDispatch } from '../store';
import { setAuth } from '../store/slices/authSlice';

const LoginPage: React.FC = () => {
         const dispatch = useDispatch<AppDispatch>();
         const navigate = useNavigate();
         const [email, setEmail] = useState('');
         const [password, setPassword] = useState('');
         const [loading, setLoading] = useState(false);
         const [error, setError] = useState<string | null>(null);

         const handleSubmit = async (e: React.FormEvent) => {
                  e.preventDefault();
                  if (!email || !password) {
                           setError('Email and password are required');
                           return;
                  }

                  setError(null);
                  setLoading(true);

                  try {
                           const response = await api.post('/auth/login', { email, password });
                           const data = response.data as {
                                    id: string;
                                    email: string;
                                    role: 'admin' | 'agent' | 'customer';
                                    token: string;
                           };

                           dispatch(
                                    setAuth({
                                             isAuthenticated: true,
                                             role: data.role,
                                             userId: data.id,
                                             token: data.token,
                                    }),
                           );

                           // After confirming credentials, send user to their main page
                           // For now, all roles share the same dashboard route
                           navigate('/dashboard');
                  } catch (err: any) {
                           const message = err?.response?.data?.message || 'Login failed. Please try again.';
                           setError(message);
                  } finally {
                           setLoading(false);
                  }
         };

         return (
                  <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-900">
                           <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-md">
                                    <h1 className="mb-4 text-xl font-semibold">Sign in</h1>
                                    {error && (
                                             <div className="mb-4 rounded border border-red-500 bg-red-950 px-3 py-2 text-sm text-red-200">
                                                      {error}
                                             </div>
                                    )}
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                             <div className="space-y-1">
                                                      <label htmlFor="email" className="text-sm font-medium">
                                                               Email
                                                      </label>
                                                      <input
                                                               id="email"
                                                               type="email"
                                                               autoComplete="email"
                                                               value={email}
                                                               onChange={(e) => setEmail(e.target.value)}
                                                               className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                                                      />
                                             </div>
                                             <div className="space-y-1">
                                                      <label htmlFor="password" className="text-sm font-medium">
                                                               Password
                                                      </label>
                                                      <input
                                                               id="password"
                                                               type="password"
                                                               autoComplete="current-password"
                                                               value={password}
                                                               onChange={(e) => setPassword(e.target.value)}
                                                               className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                                                      />
                                             </div>
                                             <button
                                                      type="submit"
                                                      disabled={loading}
                                                      className="mt-2 w-full rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                                             >
                                                      {loading ? 'Signing in...' : 'Sign in'}
                                             </button>
                                    </form>
                           </div>
                  </div>
         );
};

export default LoginPage;
