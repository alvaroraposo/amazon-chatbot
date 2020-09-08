'use strict';
const ServerController = require('./serverController');

class Server extends ServerController {
  constructor(sqs) {
    super(sqs);

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
    const id = (event && event.pathParameters) ? event.pathParameters.id : "a7d9d500-f175-11ea-9031-97bc4517d94a";   
    if(event.pathParameters)
      console.log("event.pathParameters.id", event.pathParameters.id);
      
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
const handler = new Server(sqs);
module.exports.receive = handler.receive.bind(handler);