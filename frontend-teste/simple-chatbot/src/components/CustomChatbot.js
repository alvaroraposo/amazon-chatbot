import React, {useState, useEffect} from 'react';
import ChatBot from 'react-simple-chatbot';
import axios from 'axios';
const uuid = require('uuid');

function ValidaMail ({id, triggerNextStep}) {
  const [connectionParams, setConnectionParams] = useState({
    messageDeduplicationId: uuid.v1().toString(),
    messageBody: ""
  });

  const [skipLoop] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validaEmail = async () => {
      const resValidaEmail = await axios.get(`https://ke1lzcm9le.execute-api.us-east-1.amazonaws.com/dev/receive/${id}`);
      const validaEmailCodePost = resValidaEmail.status;      

      if(validaEmailCodePost === 200) {
        const message = resValidaEmail.data.message;
        let messageBody = "Olá, eu me chamo Sky!"

        if(id !== message) {
          messageBody = message;
          triggerNextStep({trigger: '4'});
        }
        else {
          console.log("else");
          triggerNextStep({trigger: '2'});
        }

        setLoading(!loading);        
        console.log("message body", messageBody);
        setConnectionParams({
          messageBody
        });                  
      }
    }

    validaEmail();       
  }, []);  

  return (
    <span>{(!loading) ? connectionParams.messageBody : "Um momento, por favor..."}</span>
  );
}

function BuscaMensagens (props) {
  const [messagesWaiting, setMessagesWaiting] = useState(-1);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const intervalId = setInterval(async () => {
      const resConsultaMensagens = await axios.get(`https://876bvfo0j9.execute-api.us-east-1.amazonaws.com/dev/receive/${props.id}`);
      const consultaMensagensCode = resConsultaMensagens.status;
      
      if(consultaMensagensCode === 200) {
        const resMessagesWaiting = resConsultaMensagens.data.message.messagesWaiting;
        const messageBody = resConsultaMensagens.data.message.messageBody;

        if(resMessagesWaiting < 0)
          return;
        
        clearInterval(intervalId);

        if(resMessagesWaiting === (messagesWaiting - 1) || messagesWaiting === -1){             
          setMessagesWaiting(resMessagesWaiting); 
          setMessage(JSON.parse(messageBody).replaceAll("\"", ""));
          setLoading(!loading);

          if(resMessagesWaiting > 0) {                                    
            props.triggerNextStep({trigger: '2'});
          }
          else {
            props.triggerNextStep({trigger: '3'});
          }
        }
      }
    }, 4000);
    return () => {
      clearInterval(intervalId);
    }
  }, [])
  

  return (
    <span>{(!loading) ? message : "Um momento, por favor..."}</span>
  );
}

function CustomChatbot ({id}) {
  
  const [conversation] = useState(
    [
      {
        id: '1',
        component: <ValidaMail id={id}/>,
        asMessage: true,
        waitAction: true,
      },
      {
        id: '2',
        component: <BuscaMensagens id={id}/>,
        asMessage: true,
        waitAction: true,
      },
      {
        id: '3',
        user: true,
        trigger: '2'
      },
      {
        id: '4',
        message: 'Volte sempre!',
        end: true
      }
    ]
  )

  return (
    <ChatBot
      steps={conversation} customDelay={10000}      
    />
  );
}

export default CustomChatbot;