import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from 'react-query';
import { store } from './store';
import { App } from './App';
import './styles.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
         <React.StrictMode>
                  <Provider store={store}>
                           <QueryClientProvider client={queryClient}>
                                    <BrowserRouter>
                                             <App />
                                    </BrowserRouter>
                           </QueryClientProvider>
                  </Provider>
         </React.StrictMode>,
);
