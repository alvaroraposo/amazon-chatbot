'use strict';
const ClientController = require("./clientController");
const uuid = require('uuid');

class ClientSend extends ClientController{
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

    const messageGroupId = data.messageGroupId;
    
    const resultCreateQueue = await this.createQueue(messageGroupId);
    if(!resultCreateQueue || resultCreateQueue === this.ERROMENSAGENS)
      return this.RETORNOCOMERRO;


    const result = await this.postMessage(messageGroupId, data);
    if(!result || result === this.ERROMENSAGENS)
      return this.RETORNOCOMERRO;
    
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
const handler = new ClientSend(sqs);
module.exports.send = handler.send.bind(handler);