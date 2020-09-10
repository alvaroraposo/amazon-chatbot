'use strict';

class Handler {
  constructor(alexia) {
    this.alexiaObj = alexia;
  }

  async hello (event) {
    var params = {
      botAlias: 'orderflowers', /* required */
      botName: 'OrderFlowers', /* required */
      userId: '12345678', /* required */
      inputText: 'I would like to buy some flowers'
    };
    const result = await this.alexiaObj.postText(params).promise();
    console.log(result.message);
    
    params = {
      botAlias: 'orderflowers', /* required */
      botName: 'OrderFlowers', /* required */
      userId: '12345678', /* required */
      inputText: 'I would like to buy some roses'
    };

    const result2 = await this.alexiaObj.postText(params).promise();
    console.log(result2.message);
    
    params = {
      botAlias: 'orderflowers', /* required */
      botName: 'OrderFlowers', /* required */
      userId: '12345678', /* required */
      inputText: 'tomorrow'
    };

    const result3 = await this.alexiaObj.postText(params).promise();
    console.log(result3.message);

    params = {
      botAlias: 'orderflowers', /* required */
      botName: 'OrderFlowers', /* required */
      userId: '12345678', /* required */
      inputText: 'noon'
    };

    const result4 = await this.alexiaObj.postText(params).promise();
    console.log(result4.message);
    params = {
      botAlias: 'orderflowers', /* required */
      botName: 'OrderFlowers', /* required */
      userId: '12345678', /* required */
      inputText: 'yes'
    };

    const result5 = await this.alexiaObj.postText(params).promise();
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
const alexia = new aws.LexRuntime({apiVersion: '2016-11-28'});
const handler = new Handler(alexia);
module.exports.hello = handler.hello.bind(handler);