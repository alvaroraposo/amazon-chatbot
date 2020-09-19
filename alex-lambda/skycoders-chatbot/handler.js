'use strict';

class Handler {
  constructor(alexa) {
    this.alexaObj = alexa;
  }

  async hello (event) {
    var params = {
      botAlias: 'orderflowers', /* required */
      botName: 'OrderFlowers', /* required */
      userId: '12345678', /* required */
      inputText: 'I would like to buy some flowers'
    };
    const result = await this.alexaObj.postText(params).promise();
    console.log(result.message);
    
    params = {
      botAlias: 'orderflowers', /* required */
      botName: 'OrderFlowers', /* required */
      userId: '12345678', /* required */
      inputText: 'I would like to buy some roses'
    };

    const result2 = await this.alexaObj.postText(params).promise();
    console.log(result2.message);
    
    params = {
      botAlias: 'orderflowers', /* required */
      botName: 'OrderFlowers', /* required */
      userId: '12345678', /* required */
      inputText: 'tomorrow'
    };

    const result3 = await this.alexaObj.postText(params).promise();
    console.log(result3.message);

    params = {
      botAlias: 'orderflowers', /* required */
      botName: 'OrderFlowers', /* required */
      userId: '12345678', /* required */
      inputText: 'noon'
    };

    const result4 = await this.alexaObj.postText(params).promise();
    console.log(result4.message);
    params = {
      botAlias: 'orderflowers', /* required */
      botName: 'OrderFlowers', /* required */
      userId: '12345678', /* required */
      inputText: 'yes'
    };

    const result5 = await this.alexaObj.postText(params).promise();
    console.log(result5.slots);

    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          message: result.message,
          input: event,
        },
        null,
        2
      ),
    }; 
  }
}

const aws = require("aws-sdk");
const alexa = new aws.LexRuntime({apiVersion: '2016-11-28'});
const handler = new Handler(alexa);
module.exports.hello = handler.hello.bind(handler);