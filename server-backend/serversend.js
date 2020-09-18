'use strict';
const ServerController = require("./serverController");
const uuid = require('uuid');

class ServerSend extends ServerController{
  constructor(sqsObj){
    super(sqsObj)
    this.RETORNOCOMERRO = {
      statusCode: 500,
      body: JSON.stringify({
        ...this.ERROMENSAGENS
      })
    }
  }

  async send(event) {
    const data = (event && event.body) ? JSON.parse(event.body) : {
      messageGroupId: "fila-de-teste",
      messageDeduplicationId: "0",
      messageBody: "Mensagem de Teste Hardcoded"
    };
    
//    const resultCreateQueue = await this.createQueue(messageGroupId);
    // if(!resultCreateQueue || resultCreateQueue === this.ERROMENSAGENS)
    //   return this.RETORNOCOMERRO;


    const result = await this.postMessage(data);
    if(!result || result === this.ERROMENSAGENS)
      return this.RETORNOCOMERRO;

    console.log("result", result);
    
    return {
      statusCode: 200,
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