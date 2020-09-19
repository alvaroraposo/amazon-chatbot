const uuid = require('uuid');
//https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html
//https://medium.com/@drwtech/a-node-js-introduction-to-amazon-simple-queue-service-sqs-9c0edf866eca

class ServerController {
    constructor(sqsObj, alexa) {
        this.sqsObj = sqsObj;
        this.alexaObj = alexa;

        this.FILAVAZIAOBJECT = {
            messageBody: "Fila Vazia",
            messagesWaiting: -1
        }
        
        this.ERROMENSAGENS = {
            messageBody: "Erro ao acessar a fila de mensagens",
            messagesWaiting: -1
        }
    }

    async getQueueUrlByQueueName(name) {
        console.log("queue name", name);
        const queueUrl = await this.sqsObj.getQueueUrl({"QueueName": `${name}.fifo`}).promise();
        return queueUrl;
    }

    async receiveMessage(receiveParams) {
        let data = null;

        data = await this.sqsObj.receiveMessage(receiveParams).promise();       

        return data;
    }

    async getNextMessage(id) {

        const queueObj = await this.getQueueUrlByQueueName(`${id}-server`);
        const QueueUrl = (queueObj) ? queueObj.QueueUrl.toString() : null;

        if(!QueueUrl) {
            return this.FILAVAZIAOBJECT;
        }
        
        const receiveParams = {
            AttributeNames: [
                "All"
            ],
            MaxNumberOfMessages: 10,
            VisibilityTimeout: 20,
            MessageAttributeNames: ["All"],
            QueueUrl,
        };

        let data = await this.receiveMessage(receiveParams);
        

        if(!data || !data.Messages) {
            return this.FILAVAZIAOBJECT;
        }
        
        const {Body, ReceiptHandle} = data.Messages[0];
        
        const deleteParams = {
            QueueUrl,
            ReceiptHandle: ReceiptHandle
        };

        await this.sqsObj.deleteMessage(deleteParams).promise();

        const attributes = await this.sqsObj.getQueueAttributes({QueueUrl, AttributeNames: ["ApproximateNumberOfMessagesNotVisible"]}).promise();
        const number = attributes.Attributes.ApproximateNumberOfMessagesNotVisible

        const message = {
            messageGroupId: id,
            messageBody: Body,
            messagesWaiting: number
        }

        return message;
    }

    async getMessagesOnServerQueue(QueueUrl) {
        const params = {
            AttributeNames: [
                "ApproximateNumberOfMessages"
            ],
            QueueUrl
        };
        const num = await this.sqsObj.getQueueAttributes(params);
        return num;
    }

    async postMessage(messageData) {
        console.log(messageData);
        const queueObj = await this.getQueueUrlByQueueName(`${messageData.messageGroupId}-server`);
        console.log(`${messageData.messageGroupId}-server`, queueObj);
        
        if(!queueObj)
            return this.ERROMENSAGENS;

        const QueueUrl = (queueObj) ? queueObj.QueueUrl.toString() : null;

        if(!QueueUrl)
            return this.ERROMENSAGENS;

        const result = await this.sqsObj.sendMessage({
            MessageGroupId: messageData.messageGroupId,
            MessageBody: JSON.stringify(messageData.messageBody),
            MessageDeduplicationId: messageData.messageDeduplicationId,
            QueueUrl
        }).promise();

        return result
    }
}

module.exports = ServerController;