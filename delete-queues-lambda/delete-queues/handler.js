'use strict';

class Handler {
  constructor(sqs){
    this.sqsObj = sqs;
    this.RETORNOSUCESSO = {
      statusCode: 200,
      body: JSON.stringify(
        {
          message: 'All Queues Removed Successfully!',
        },
        null,
        2
      ),
    };

    this.RETORNOERRRO = {
      statusCode: 500,
      body: JSON.stringify(
        {
          message: 'Internal Server Error',
        },
        null,
        2
      ),
    }
  }

  async delete(event) {
    const queueList = await this.sqsObj.listQueues({}).promise();
    if(!queueList || queueList.QueueUrls) {
      this.RETORNOERRRO;
    }

    const queueDeleteList = queueList.QueueUrls.filter(async (queue) => {
      const params = {
        QueueUrl: queue,
        AttributeNames:["LastModifiedTimestamp"]
      }

      const {Attributes} = await this.sqsObj.getQueueAttributes(params).promise();
      const now = Math.round(new Date().getTime() / 1000)
      const queueTimestamp = Attributes.LastModifiedTimestamp;
      const diffTimestamp = now - (6 * 3600);

      return (diffTimestamp > queueTimestamp);
    }); 

    queueDeleteList.forEach(async (queue) => {
      await this.sqsObj.deleteQueue({QueueUrl: queue}).promise();
    })

    return this.RETORNOSUCESSO;
  }
}

const aws = require("aws-sdk");
const sqs = new aws.SQS();
const handler = new Handler(sqs);
module.exports.delete = handler.delete.bind(handler);
