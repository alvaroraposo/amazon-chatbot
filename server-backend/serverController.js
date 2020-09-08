const uuid = require('uuid');
//https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html
//https://medium.com/@drwtech/a-node-js-introduction-to-amazon-simple-queue-service-sqs-9c0edf866eca

class ServerController {
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

    async getQueueUrlByQueueName(name) {
        const queueUrl = await this.sqsObj.getQueueUrl({"QueueName": `${name}.fifo`}).promise();
        return queueUrl;
    }

    async getNextMessage(id) {

        const queueObj = await this.getQueueUrlByQueueName(`${id}-client`);
        const QueueUrl = (queueObj) ? queueObj.QueueUrl.toString() : null;
        console.log(QueueUrl);

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

        const result = await this.sqsObj.sendMessage({
            MessageGroupId: id,
            MessageBody: "O Cliente tem sempre razão!",
            MessageDeduplicationId: MessageId,
            QueueUrl
        }).promise();

        return result
    }

    // async createQueue(data) {
    //     const isMessageGroupIdValid = (data && data.messageGroupId && data.messageGroupId.length > 5);
    //     const messageGroupId = isMessageGroupIdValid ? data.messageGroupId : uuid.v1().toString();
    //     this.messageGroupId = messageGroupId;
    //     const queueName = messageGroupId + ".fifo";        

    //     const params = {
    //         QueueName: queueName,
    //         Attributes: {
    //             'FifoQueue': 'true',
    //         }
    //     }

    //     const result = await this.sqsObj.createQueue(params).promise();
    //     if(!result)
    //         return this.ERROMENSAGENS;

    //     const queueResult = await this.sqsObj.getQueueUrl({"QueueName": `${queueName}`}).promise();
    //     this.queueUrl = queueResult.QueueUrl;

    //     return this.queueUrl;
    // }


    // async postMessage(data) {
    //     if(!this.queueUrl) {
    //         return this.ERROMENSAGENS;
    //     }

    //     const {messageBody, messageDeduplicationId} = data;

    //     const result = await this.sqsObj.sendMessage({
    //         MessageGroupId: this.messageGroupId,
    //         MessageBody: messageBody,
    //         MessageDeduplicationId: messageDeduplicationId,
    //         QueueUrl: this.queueUrl
    //     }).promise();

    //     if(!result)
    //         return this.ERROMENSAGENS;

    //     return this.messageGroupId;
    // }

    // async getQueueUrlBy(id) {
    //     if(!id) {
    //         const queueList = await this.sqsObj.listQueues({}).promise();
    //         if(queueList.QueueUrls.length > 0) {
    //             let queueIndex = 0;

    //             while(queueIndex < queueList.QueueUrls.length) {
    //                 const params = {
    //                     QueueUrl: queueList.QueueUrls[queueIndex],
    //                     AttributeNames:["ApproximateNumberOfMessages"]
    //                 }
    //                 const {Attributes} = await this.sqsObj.getQueueAttributes(params).promise();
    //                 const numberOfMessages = parseInt(Attributes.ApproximateNumberOfMessages);
    //                 if(numberOfMessages > 0){
    //                     const q = queueList.QueueUrls[queueIndex];
    //                     return {QueueUrl: q};
    //                 }                        
                    
    //                 queueIndex++;
    //             }
                
    //         }

    //         return {QueueUrl: null};
    //     }

    //     const queueUrl = await this.sqsObj.getQueueUrl({"QueueName": `${id}-client.fifo`}).promise();

    //     return queueUrl;
    // }
}

module.exports = ServerController;