'use strict';
const ServerController = require("./serverController");
const uuid = require('uuid');

class ServerSend extends ServerController{
  constructor(sqsObj){
    super(sqsObj);
    this.headers = {
      'Access-Control-Expose-Headers': 'Access-Control-Allow-Origin',
      'Access-Control-Allow-Credentials': true,
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',            
    };
    this.RETORNOCOMERRO = {
      statusCode: 500,
      headers: this.headers,
      body: JSON.stringify({
        ...this.ERROMENSAGENS
      })
    }
  }

  async send(event) {
    const data = (event && event.body) ? JSON.parse(event.body) : {
      messageGroupId: "alvaroraposo-gmail-com",
      messageDeduplicationId: "0",
      messageBody: "Vamos consultar seu pedido"
    };
    
//    const resultCreateQueue = await this.createQueue(messageGroupId);
    // if(!resultCreateQueue || resultCreateQueue === this.ERROMENSAGENS)
    //   return this.RETORNOCOMERRO;


    const result = await this.postMessage(data);
    if(!result || result === this.ERROMENSAGENS)
      return this.RETORNOCOMERRO;

    
    return {
      statusCode: 200,
      headers: this.headers,
      body: JSON.stringify({
        message: "Mensagem enviada",
        messageGroupId: result
      })
    }
  }
}

const aws = require("aws-sdk");
const sqs = new aws.SQS();
const handler = new ServerSend(sqs);
module.exports.send = handler.send.bind(handler);