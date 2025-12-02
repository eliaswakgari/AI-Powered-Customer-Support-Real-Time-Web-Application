import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type UserRole = 'admin' | 'agent' | 'customer' | null;

interface AuthState {
         isAuthenticated: boolean;
         role: UserRole;
         userId: string | null;
         token: string | null;
         socketToken: string | null; // added socketToken property
}

const loadAuthFromStorage = (): AuthState => {
         try {
                  const raw = typeof window !== 'undefined' ? window.localStorage.getItem('auth') : null;
                  if (!raw) {
                           return { isAuthenticated: false, userId: null, role: null, token: null, socketToken: null };
                  }
                  const parsed = JSON.parse(raw) as Partial<AuthState>;
                  if (!parsed || !parsed.token || !parsed.userId || !parsed.role) {
                           return { isAuthenticated: false, userId: null, role: null, token: null, socketToken: null };
                  }
                  return {
                           isAuthenticated: true,
                           userId: parsed.userId || null,
                           role: parsed.role || null,
                           token: parsed.token || null,
                           socketToken: parsed.socketToken || null,
                  };
         } catch {
                  return { isAuthenticated: false, userId: null, role: null, token: null, socketToken: null };
         }
};

const initialState: AuthState = loadAuthFromStorage();

const authSlice = createSlice({
         name: 'auth',
         initialState,
         reducers: {
                  setAuth(state, action: PayloadAction<{ userId: string; role: UserRole; token: string }>) {
                           state.isAuthenticated = true;
                           state.userId = action.payload.userId;
                           state.role = action.payload.role;
                           state.token = action.payload.token;
                           try {
                                    window.localStorage.setItem(
                                             'auth',
                                             JSON.stringify({
                                                      userId: state.userId,
                                                      role: state.role,
                                                      token: state.token,
                                                      socketToken: state.socketToken,
                                             }),
                                    );
                           } catch {
                                    // ignore storage errors
                           }
                  },
                  logout(state) {
                           state.isAuthenticated = false;
                           state.userId = null;
                           state.role = null;
                           state.token = null;
                           state.socketToken = null;
                           try {
                                    window.localStorage.removeItem('auth');
                           } catch {
                                    // ignore storage errors
                           }
                  },
         },
});

export const { setAuth, logout } = authSlice.actions;
export default authSlice.reducer;
