// import logo from './logo.svg';
import './App.css';

// import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// import { Button, Input, Stack } from "@chakra-ui/react";
// import { Field } from "@/components/ui/field";
// import { PasswordInput } from "@/components/ui/password-input";
// import { useForm, SubmitHandler } from "react-hook-form";

import Login from './login';
import BigChat from './chatting';
function App() {
  return (
    <BrowserRouter>
      <Routes>
          <Route index element={<Login />} />
          <Route path="messagepage" element={<BigChat />} />
      </Routes>
    </BrowserRouter>

  );
}

export default App;
