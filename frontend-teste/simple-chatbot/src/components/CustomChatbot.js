import React, {useState, useEffect} from 'react';
import ChatBot from 'react-simple-chatbot';
import axios from 'axios';
const uuid = require('uuid');

function CustomSearch ({previousStep, id}) { 
  const [connectionParams, setConnectionParams] = useState({
    messageDeduplicationId: uuid.v1().toString(),
    messageBody: ""
  });

  const [skipLoop] = useState(0);
  const [loading, setLoading] = useState(true);
  console.log("id", id);

  useEffect(() => {
    const postMessage = async () => {
      const {message} = previousStep;

      const postParams = {
        messageGroupId: id,
        ...connectionParams,
        messageBody: message
      }

      setLoading(true);
      const resPost = await axios.post('https://skycoders-backend.herokuapp.com/messages', postParams);
      const statusCodePost = resPost.data.statusCode;

      if(statusCodePost === 200) {
        const messageGroupId = resPost.data.body.messageGroupId;
        const resGet = await axios.get(`https://skycoders-backend.herokuapp.com/messages/${messageGroupId}`, postParams);
        const statusCodeGet = resGet.data.statusCode;

        if(statusCodeGet === 200) {
          console.log("recebidos:", resGet.data.body.message);
          const receivedObject = JSON.parse(resGet.data.body.message);
          
          const messageBody = (receivedObject && !receivedObject.message && receivedObject.slots) ? "Thank you for shopping with us!" : (receivedObject) ? receivedObject.message : "Internal Server Error, could you repeat your order, please?"; 

          setConnectionParams({
            messageBody: messageBody
          });          

          setLoading(false);
        }
      }
    }

    postMessage();       
  }, [skipLoop]);

  return (
    <span>{(!loading) ? connectionParams.messageBody : "Just a minute, please..."}</span>
  );
}

function CustomChatbot ({id}) {
  
  const [conversation] = useState(
    [
      {
        id: '1',
        message: 'Hi! May I help you?',
        trigger: '2',
      },
      {
        id: '2',
        user: true,
        trigger: '3'
      },
      {
        id: '3',
        component: <CustomSearch id={id}/>,
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