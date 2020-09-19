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
          triggerNextStep({trigger: '2'});
        }

        setLoading(!loading);        
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
    const enviarMensagem = async () => {
      console.log("previousValue", props.previousStep.message);
      const headers = {
        'Access-Control-Expose-Headers': 'Access-Control-Allow-Origin',
        'Access-Control-Allow-Credentials': true,
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',            
      }

      const result = await axios.post(`https://ke1lzcm9le.execute-api.us-east-1.amazonaws.com/dev/send`, {
        messageGroupId: props.id,
        messageDeduplicationId: uuid.v1(),
        messageBody: props.previousStep.message,
      });
    }
    
    if(props.previousStep && props.previousStep.message)
      enviarMensagem();
  }, [])

  useEffect(() => {
    console.log("código!", "1061712315074-01");
    const intervalId = setInterval(async () => {
      const resConsultaMensagens = await axios.get(`https://876bvfo0j9.execute-api.us-east-1.amazonaws.com/dev/receive/${props.id}`);
      const consultaMensagensCode = resConsultaMensagens.status;
      
      if(consultaMensagensCode === 200) {
        const resMessagesWaiting = resConsultaMensagens.data.message.messagesWaiting;
        const messageBody = resConsultaMensagens.data.message.messageBody;
        
        console.log(messageBody, resMessagesWaiting);

        if(resMessagesWaiting < 0)
          return;
                
        clearInterval(intervalId);

        if(resMessagesWaiting === (messagesWaiting - 1) || messagesWaiting === -1){             
          setMessagesWaiting(resMessagesWaiting); 
          setMessage(JSON.parse(messageBody));
          setLoading(!loading);

          if(resMessagesWaiting > 0) {                                    
            props.triggerNextStep({trigger: '2'});
            //props.triggerNextStep({trigger: '4'}); // temporario
          }
          else {
            props.triggerNextStep({trigger: '3'});
            //props.triggerNextStep({trigger: '4'});
          }
        }
      }
    }, 2000);
    return () => {
      clearInterval(intervalId);
    }
  }, [])
  

  return (
    <span>{(!loading) ? message : "Um momento, por favor..."}</span>
  );
}

function EnviarMensagens(props) {
    useEffect(() => {    
    const enviarMensagem = async () => {
      console.log("previousValue", props.previousStep.message);
      const headers = {
        'Access-Control-Expose-Headers': 'Access-Control-Allow-Origin',
        'Access-Control-Allow-Credentials': true,
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',            
      }

      const result = await axios.post(`https://ke1lzcm9le.execute-api.us-east-1.amazonaws.com/dev/send`, {
        messageGroupId: props.id,
        messageDeduplicationId: uuid.v1(),
        messageBody: props.previousStep.message,
      });
    }
    
    console.log("message - id", props.previousStep.message, props.id);
    if(props.previousStep && props.previousStep.message)
      enviarMensagem();
  }, [])

  return null;
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
      },
      {
        id: '5',
        component: <EnviarMensagens id={id}/>,
        asMessage: true,
        trigger: '2'
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