const axios = require('axios');
const uuid = require('uuid');

class ClientController {
    constructor(sqsObj, alexiaObj) {
        this.sqsObj = sqsObj;
        this.alexiaObj = alexiaObj;
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
        const queueNameServer = messageGroupId + "-server.fifo";

        const paramsServer = {
            QueueName: queueNameServer,
            Attributes: {
                FifoQueue: 'true',
            }
        }
        let queueUrl = null;
        try {
            queueUrl = await this.getQueueUrlByQueueName(queueNameServer);
        }
        catch(error) {
            const resultServer = await this.sqsObj.createQueue(paramsServer).promise();
            if(!resultServer)
                return this.ERROMENSAGENS;
            
            queueUrl = resultServer.QueueUrl;
        }
        
        return queueUrl;
    }

    async getQueueUrlByQueueName(name) {
        const queueUrl = await this.sqsObj.getQueueUrl({"QueueName": `${name}`}).promise();
        return queueUrl;
    }

    async postMessage(data) {          
        if(!data)
            return this.ERROMENSAGENS;

        const result = await this.askAlexia(data);

        if(!result)
            return this.ERROMENSAGENS;

        return result;
    }

    async postGeetings(id, name) {

        const message = `Olá, ${name[0].firstName}. Em que posso ajudar?`;


        const result = await axios.post("https://876bvfo0j9.execute-api.us-east-1.amazonaws.com/dev/send", {
            messageGroupId: id,
            messageDeduplicationId: uuid.v1(),
            messageBody: JSON.stringify(message)
        })

        console.log("message", message, result.status);

        if(!result || result.status !== 200)
            return this.ERROMENSAGENS;

        return result;
    }

    async askAlexia (messageData) {

        const params = {
            botAlias: 'skyBot', /* required */
            botName: 'skybot', /* required */
            userId: messageData.messageGroupId, /* required */
            inputText: messageData.messageBody
        };

        console.log("params", params);

        const result = await this.alexiaObj.postText(params).promise();

        return result;
    }

    // async getNextMessage(id) {

    //     const queueObj = await this.getQueueUrlByQueueName(`${id}-server`);
    //     const QueueUrl = (queueObj) ? queueObj.QueueUrl.toString() : null;

    //     if(!QueueUrl) {
    //         return this.FILAVAZIAOBJECT;
    //     }
        
    //     const receiveParams = {
    //         AttributeNames: [
    //             "SentTimestamp"
    //         ],
    //         MaxNumberOfMessages: 10,
    //         VisibilityTimeout: 20,
    //         MessageAttributeNames: ["All"],
    //         QueueUrl,
    //         WaitTimeSeconds: 0
    //     };
               
    //     const data = await this.sqsObj.receiveMessage(receiveParams).promise();
    //     if(!data || !data.Messages) {
    //         return this.FILAVAZIAOBJECT;
    //     }
        
    //     const {Body, MessageGroupId, MessageDeduplicationId, ReceiptHandle} = data.Messages[0];
        
    //     const deleteParams = {
    //         QueueUrl,
    //         ReceiptHandle: ReceiptHandle
    //     };

    //     await this.sqsObj.deleteMessage(deleteParams).promise();

    //     const message = {
    //         messageGroupId: MessageGroupId,
    //         messageDeduplicationId: MessageDeduplicationId,
    //         messageBody: Body,
    //     }

    //     return message;
    // }

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