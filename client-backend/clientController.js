//https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html
//https://medium.com/@drwtech/a-node-js-introduction-to-amazon-simple-queue-service-sqs-9c0edf866eca

class ClientController {
    constructor(sqsObj) {
        this.sqsObj = sqsObj;
        this.FILAVAZIAOBJECT = {
            mensagem: "Fila Vazia",
            receiptHandle: 0
        }
        
        this.ERROMENSAGENS = {
            mensagem: "Erro ao acessar a fila de mensagens",
            receiptHandle: -1
        }
    }

    async createQueue(messageGroupId) {                
        const queueNameClient = messageGroupId + "-client.fifo";
        const queueNameServer = messageGroupId + "-server.fifo";

        const paramsClient = {
            QueueName: queueNameClient,
            Attributes: {
                'FifoQueue': 'true',
            }
        }

        const paramsServer = {
            QueueName: queueNameServer,
            Attributes: {
                'FifoQueue': 'true',
            }
        }

        try {
            await this.getQueueUrlByQueueName(queueNameClient);
            await this.getQueueUrlByQueueName(queueNameServer);
        }
        catch(error) {
            const resultClient = await this.sqsObj.createQueue(paramsClient).promise();
            const resultServer = await this.sqsObj.createQueue(paramsServer).promise();

            if(!resultClient || !resultServer)
                return this.ERROMENSAGENS;
        }
        
        return queueNameClient;
    }

    async getQueueUrlByQueueName(name) {
        const queueUrl = await this.sqsObj.getQueueUrl({"QueueName": `${name}.fifo`}).promise();
        return queueUrl;
    }

    async postMessage(messageGroupId, data) {        
        const {messageBody, messageDeduplicationId} = data;
        const queueObj = await this.getQueueUrlByQueueName(`${messageGroupId}-client`);       
        const QueueUrl = (queueObj) ? queueObj.QueueUrl.toString() : null;
        console.log("messageDeduplicationId", messageDeduplicationId);

        if(!QueueUrl) {
            return this.ERROMENSAGENS;
        }

        const result = await this.sqsObj.sendMessage({
            MessageGroupId: messageGroupId,
            MessageBody: messageBody,
            MessageDeduplicationId: messageDeduplicationId,            
            QueueUrl
        }).promise();

        if(!result)
            return this.ERROMENSAGENS;

        return messageGroupId;
    }

    async getNextMessage(id) {

        const queueObj = await this.getQueueUrlByQueueName(`${id}-server`);
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
        
        const {Body, MessageGroupId, MessageDeduplicationId, ReceiptHandle} = data.Messages[0];
        
        const deleteParams = {
            QueueUrl,
            ReceiptHandle: ReceiptHandle
        };

        await this.sqsObj.deleteMessage(deleteParams).promise();

        const message = {
            messageGroupId: MessageGroupId,
            messageDeduplicationId: MessageDeduplicationId,
            messageBody: Body,
        }

        return message;
    }

    // async getNextMessage(id) {

    //     if(!this.queueUrl) {
    //         const {QueueUrl} = await this.getQueueUrlBy(id);
    //         console.log(QueueUrl);

    //         if(!QueueUrl) {
    //             return this.FILAVAZIAOBJECT;
    //         }
            
    //         this.queueUrl = QueueUrl;
    //         this.receiveParams = {
    //             AttributeNames: [
    //                 "SentTimestamp"
    //             ],
    //             MaxNumberOfMessages: 10,
    //             VisibilityTimeout: 20,
    //             MessageAttributeNames: ["All"],
    //             QueueUrl,
    //             WaitTimeSeconds: 0
    //         };

    //         this.deleteParams = {
    //             QueueUrl
    //         }
    //     }
        
    //     const data = await this.sqsObj.receiveMessage(this.receiveParams).promise();
    //     if(!data) {
    //         return this.FILAVAZIAOBJECT;
    //     }
        
    //     if(!data.Messages) {
    //         return this.FILAVAZIAOBJECT;
    //     }

    //     console.log(data.Messages[0]);
    //     const {Body, MessageGroupId, MessageDeduplicationId, ReceiptHandle} = data.Messages[0];
    //     this.deleteParams = {
    //         ...this.deleteParams,
    //         ReceiptHandle: ReceiptHandle
    //     };

    //     await this.sqsObj.deleteMessage(this.deleteParams).promise();

    //     const message = {
    //         messageGroupId: MessageGroupId,
    //         messageDeduplicationId: MessageDeduplicationId,
    //         messageBody: Body,
    //         receiptHandle: ReceiptHandle
    //     }

    //     return message;
    // }
}

module.exports = ClientController;