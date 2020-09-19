'use strict';
const ClientController = require("./clientController");
const uuid = require('uuid');

class ClientSend extends ClientController{
  constructor(sqsObj, alexaObj){
    super(sqsObj, alexaObj)

    this.headers = {
      'Access-Control-Expose-Headers': 'Access-Control-Allow-Origin',
      'Access-Control-Allow-Credentials': true,
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',            
    }

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
      messageBody: "Consultar pedido"
    };  
    
    data.messageGroupId = data.messageGroupId.replace("@","-").replace(".", "-").replace(".", "-");    

    const result = await this.postMessage(data);

    if(!result || result === this.ERROMENSAGENS)
      return this.RETORNOCOMERRO;
    
    return {
      statusCode: 200,
      headers: this.headers,
      body: JSON.stringify({
        message: result,
        messageGroupId: data.messageGroupId
      })
    }

//     // PARTE DE TESTE DIRETO NO AMAZON LEX
    // const id = 'alvaroraposo-gmail-com';
    // try {
    //   const deleteSessionParams = {
    //     botAlias: 'skyBot', /* required */
    //     botName: 'skybot', /* required */
    //     userId: id, /* required */
    //   };
  
    //   await this.alexaObj.deleteSession(deleteSessionParams).promise();
    // }
    // catch(error) {
    //   // nada
    // }

    // let mensagem = await this.testWithAlexa(id, 'consultar pedido');
    // mensagem = await this.testWithAlexa(id, '1061712315074-01');
    // mensagem = await this.testWithAlexa(id, 'sim'); // informações sobre o mesmo pedido
    // mensagem = await this.testWithAlexa(id, 'valor pago'); // endereço
    // mensagem = await this.testWithAlexa(id, 'não'); //mesmo pedido
    // mensagem = await this.testWithAlexa(id, 'não'); // outro pedido
    // mensagem = await this.testWithAlexa(id, 'sim'); // ajudar

    
    return {
      statusCode: 200,
      headers: this.headers,
      body: JSON.stringify({
        message: mensagem,
        messageGroupId: id
      })
    }
  }

  async testWithAlexa(id, mensagem) {
    const messageData = {
      messageGroupId: id,
      messageBody: mensagem
    }

    const resposta = await this.askAlexa(messageData);
//    console.log("mensagem:", resposta);

    return resposta;
   }
}

const aws = require("aws-sdk");
const sqs = new aws.SQS();
const alexa = new aws.LexRuntime({apiVersion: '2016-11-28'});
const handler = new ClientSend(sqs, alexa);
module.exports.send = handler.send.bind(handler);