'use strict';
const ClientController = require("./clientController");
const {validateEmail} = require("./validations");
const {getNameByEmail} = require("./vtexController");

class ClientReceive extends ClientController {
    constructor(sqs, alexa) {
        super(sqs, alexa);

        this.headers = {
          'Access-Control-Expose-Headers': 'Access-Control-Allow-Origin',
          'Access-Control-Allow-Credentials': true,
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',            
        }
    
        this.RETORNOFILAVAZIA = {
          statusCode: 204,
          headers: this.headers,
          body: JSON.stringify({
            ...this.FILAVAZIAOBJECT
          })
        }
    
        this.RETORNOERROMENSAGENS = {
          statusCode: 500,
          headers: this.headers,
          body: JSON.stringify({
            ...this.ERROMENSAGENS
          })
        }
      }

    async receive (event) {
        const email = (event && event.pathParameters) ? event.pathParameters.id : "alvaroraposo@gmail.com";   
        if(!email || !validateEmail(email))
          return this.RETORNOERROMENSAGENS;
          
        const id = email.replace("@", "-").replace(".", "-").replace(".","-").replace(".","-");

        const resultQueue = await this.createQueue(id);
        console.log(id, resultQueue);
        if(!resultQueue || resultQueue === this.ERROMENSAGENS)
          return this.RETORNOERROMENSAGENS;

        const name = await getNameByEmail(email); 
        
        let result = null;
        let resultGreetings = null;

        if(name && name.length > 0) {
          result = email;
          resultGreetings = await this.postGeetings(id, name);
        }
        else {
          result = "O usuário deve estar logado para fazer uso de nossos serviços.";
        }        
        
        return (resultGreetings === this.ERROMENSAGENS) ? this.RETORNOERROMENSAGENS : {
          statusCode: 200,
          headers: this.headers,
          body: JSON.stringify({
            message: result
          })
      }
    }
}

const aws = require("aws-sdk");
const sqs = new aws.SQS();
const alexa = new aws.LexRuntime({apiVersion: '2016-11-28'});
const handler = new ClientReceive(sqs, alexa);
module.exports.receive = handler.receive.bind(handler);