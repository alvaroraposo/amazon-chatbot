const uuid = require('uuid');
//https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html
//https://medium.com/@drwtech/a-node-js-introduction-to-amazon-simple-queue-service-sqs-9c0edf866eca

class ServerController {
    constructor(sqsObj, alexia) {
        this.sqsObj = sqsObj;
        this.alexiaObj = alexia;

        this.FILAVAZIAOBJECT = {
            mensagem: "Fila Vazia",
            receiptHandle: 0
        }
        
        this.ERROMENSAGENS = {
            mensagem: "Erro ao acessar a fila de mensagens",
            receiptHandle: -1
        }
    }

    async getQueueUrlByQueueName(name) {
        const queueUrl = await this.sqsObj.getQueueUrl({"QueueName": `${name}.fifo`}).promise();
        return queueUrl;
    }

    async getNextMessage(id) {

        const queueObj = await this.getQueueUrlByQueueName(`${id}-client`);
        const QueueUrl = (queueObj) ? queueObj.QueueUrl.toString() : null;

        if(!QueueUrl) {
            return this.FILAVAZIAOBJECT;
        }
        
        const receiveParams = {
            AttributeNames: [
                "SentTimestamp"
            ],
            MaxNumberOfMessages: 10,
            VisibilityTimeout: 20,
            MessageAttributeNames: ["All"],
            QueueUrl,
            WaitTimeSeconds: 0
        };
               
        const data = await this.sqsObj.receiveMessage(receiveParams).promise();
        if(!data || !data.Messages) {
            return this.FILAVAZIAOBJECT;
        }

        const resultPost = await this.postMessage(id, data.Messages[0]);
        if(!resultPost) {
            return this.ERROMENSAGENS;
        }
        
        const {Body, MessageGroupId, MessageDeduplicationId, ReceiptHandle} = data.Messages[0];
        
        const deleteParams = {
            QueueUrl,
            ReceiptHandle: ReceiptHandle
        };

        await this.sqsObj.deleteMessage(deleteParams).promise();

        const message = {
            messageGroupId: MessageGroupId,
            messageDeduplicationId: MessageDeduplicationId,
            messageBody: "Mensagem recebida e resposta enviada com sucesso",
        }

        return message;
    }

    async postMessage(id, messageData) {
        const {MessageId} = messageData;
        const queueObj = await this.getQueueUrlByQueueName(`${id}-server`);
        const QueueUrl = (queueObj) ? queueObj.QueueUrl.toString() : null;

        if(!QueueUrl)
            return this.ERROMENSAGENS;

        const mensagem = await this.askAlexia(messageData);

        const result = await this.sqsObj.sendMessage({
            MessageGroupId: id,
            MessageBody: JSON.stringify(mensagem),
            MessageDeduplicationId: MessageId,
            QueueUrl
        }).promise();

        return result
    }

    async askAlexia (messageData) {
        console.log("messageData", messageData.Body);

        const params = {
            botAlias: 'orderflowers', /* required */
            botName: 'OrderFlowers', /* required */
            userId: '12345678', /* required */
            inputText: messageData.Body
        };

        const result = await this.alexiaObj.postText(params).promise();
        console.log(result);

        return result;
    }
}

module.exports = ServerController;