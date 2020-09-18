'use strict';
const ServerController = require('./serverController');
const {validateEmail} = require("./validations");

class Server extends ServerController {
  constructor(sqs) {
    super(sqs, alexia);

    this.headers = {
      'Access-Control-Expose-Headers': 'Access-Control-Allow-Origin',
      'Access-Control-Allow-Credentials': true,
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',            
    }

    this.RETORNOFILAVAZIA = {
      statusCode: 200,
      headers: this.headers,
      body: JSON.stringify({
        message: {
          messageBody: "Fila Vazia",
          messagesWaiting: -1
        }
      })
    }

    this.RETORNOERROMENSAGENS = {
      statusCode: 500,
      headers: this.headers,
      body: JSON.stringify({
        message: {
          messageBody: "Erro ao acessar a fila de mensagens",
          messagesWaiting: -1
        }
      })
    }
  }

  async receive (event, context, callback) {
    const email = (event && event.pathParameters) ? event.pathParameters.id : "alvaroraposo@gmail.com";   
        if(!email || !validateEmail(email))
          return this.RETORNOERROMENSAGENS;
          
    const id = email.replace("@", "-").replace(".", "-").replace(".","-"); 

    console.log("id", id);

    if(!id) {
      return this.RETORNOERROMENSAGENS
    }      
    
    const message = await this.getNextMessage(id);
    

    const retorno = (message === this.FILAVAZIAOBJECT) ? this.RETORNOFILAVAZIA : (message === this.ERROMENSAGENS) ? this.RETORNOERROMENSAGENS : {
      statusCode: 200,
      headers: this.headers,
      body: JSON.stringify({
        message: message
      })
    }; 
    
    callback(null, retorno);
  }
}

const aws = require("aws-sdk");
const sqs = new aws.SQS();
const alexia = new aws.LexRuntime({apiVersion: '2016-11-28'});
const handler = new Server(sqs, alexia);
module.exports.receive = handler.receive.bind(handler);