'use strict';
const ServerController = require('./serverController');

class Server extends ServerController {
  constructor(sqs) {
    super(sqs, alexia);

    this.RETORNOFILAVAZIA = {
      statusCode: 204,
      body: JSON.stringify({
        ...this.FILAVAZIAOBJECT
      })
    }

    this.RETORNOERROMENSAGENS = {
      statusCode: 500,
      body: JSON.stringify({
        ...this.ERROMENSAGENS
      })
    }
  }

  async receive (event) {
    const id = (event && event.pathParameters) ? event.pathParameters.id : "TestQueue";   

    if(!id) {
      return this.RETORNOERROMENSAGENS
    }
      
      
    const message = await this.getNextMessage(id);
    
    return (message === this.FILAVAZIAOBJECT) ? this.RETORNOFILAVAZIA : (message === this.ERROMENSAGENS) ? this.RETORNOERROMENSAGENS : {
      statusCode: 200,
      body: JSON.stringify({
        ...message
      })
    }
  }
}

const aws = require("aws-sdk");
const sqs = new aws.SQS();
const alexia = new aws.LexRuntime({apiVersion: '2016-11-28'});
const handler = new Server(sqs, alexia);
module.exports.receive = handler.receive.bind(handler);