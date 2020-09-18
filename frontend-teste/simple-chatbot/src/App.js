import React, { useState } from 'react';
import CustomChatbot from './components/CustomChatbot';

function App() {
  const [messageGroupId, setMessageGroupId] = useState("");

//  (<><input id="idInput" type="text" placeholder="Digite seu login VTex"/>
  return (
    messageGroupId !== "" ? <CustomChatbot id={messageGroupId}/> : 

    (<><input id="idInput" type="text" placeholder="Digite seu login VTex"/>
    <button onClick={() => {setMessageGroupId(document.getElementById("idInput").value)}}>Enviar</button></>)
  );
}

export default App;
