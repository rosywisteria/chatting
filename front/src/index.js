// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import './index.css';
// import App from './App';
// import { ChakraProvider } from '@chakra-ui/react';

// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(
//   <ChakraProvider>
//     <App />
//   </ChakraProvider>
// );

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.js'
import { ChakraProvider } from '@chakra-ui/react'
import { system } from "@chakra-ui/react/preset";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* pass system value here */}
    <ChakraProvider value={system}> 
      <App />
    </ChakraProvider>
  </StrictMode>,
)