'use strict';
const ClientController = require("./clientController");
const uuid = require('uuid');

class ClientSend extends ClientController{
  constructor(sqsObj, alexiaObj){
    super(sqsObj, alexiaObj)
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

    const result = await this.postMessage(data);

    if(!result || result === this.ERROMENSAGENS)
      return this.RETORNOCOMERRO;
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: result,
        messageGroupId: data.messageGroupId
      })
    }
  }
}

const aws = require("aws-sdk");
const sqs = new aws.SQS();
const alexia = new aws.LexRuntime({apiVersion: '2016-11-28'});
const handler = new ClientSend(sqs, alexia);
module.exports.send = handler.send.bind(handler);