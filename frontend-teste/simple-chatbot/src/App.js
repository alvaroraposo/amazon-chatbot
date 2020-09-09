import React, { useState } from 'react';
import CustomChatbot from './components/CustomChatbot';
const uuid = require('uuid');

function App() {
  const [messageGroupId] = useState(uuid.v1().toString());

  return (
    <CustomChatbot id={messageGroupId}/>
  );
}

export default App;
