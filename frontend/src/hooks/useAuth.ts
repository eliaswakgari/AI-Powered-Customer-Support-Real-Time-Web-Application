import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery } from 'react-query';
import { api } from '../api';
import { RootState, AppDispatch } from '../store';
import { setAuth, logout } from '../store/slices/authSlice';

export const useAuthInit = () => {
         const dispatch = useDispatch<AppDispatch>();
         const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

         useQuery(
                  'me',
                  async () => {
                           const res = await api.get('/auth/me');
                           return res.data;
                  },
                  {
                           enabled: !isAuthenticated,
                           retry: false,
                           onSuccess: (data) => {
                                    dispatch(
                                             setAuth({
                                                      isAuthenticated: true,
                                                      role: data.role,
                                                      userId: data._id,
                                                      token: null,
                                             }) as any,
                                    );
                           },
                           onError: () => {
                                    dispatch(logout());
                           },
                  },
         );
};
