import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import './Layout.css';
import { RootState, AppDispatch } from '../store';
import { api } from '../api';
import { logout } from '../store/slices/authSlice';

interface LayoutProps {
         children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
         const dispatch = useDispatch<AppDispatch>();
         const navigate = useNavigate();
         const auth = useSelector((state: RootState) => state.auth);

         const handleLogout = async () => {
                  try {
                           await api.post('/auth/logout');
                  } catch {
                           // ignore API errors on logout; we still clear local state
                  } finally {
                           dispatch(logout());
                           navigate('/');
                  }
         };

         return (
                  <div className="app-root">
                           <header className="app-header">
                                    <div className="app-header-inner">
                                             <div className="app-header-left">
                                                      <Link to="/" className="app-logo-link">
                                                               <span className="app-logo-mark">AI</span>
                                                               <span className="app-logo-text">Support Chat</span>
                                                      </Link>
                                             </div>
                                             <div className="app-header-right">
                                                      {auth.isAuthenticated ? (
                                                               <button type="button" onClick={handleLogout} className="app-header-button">
                                                                        Logout
                                                               </button>
                                                      ) : (
                                                               <>
                                                                        <Link to="/login" className="app-header-link">
                                                                                 Login
                                                                        </Link>
                                                                        <Link to="/register" className="app-header-link">
                                                                                 Get started
                                                                        </Link>
                                                               </>
                                                      )}
                                             </div>
                                    </div>
                           </header>
                           <main className="app-main">{children}</main>
                  </div>
         );
};
