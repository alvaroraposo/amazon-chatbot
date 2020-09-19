const uuid = require('uuid');
const {getOrderDetailsByOrderId} = require("./vtexController");
const {validateOrderId} = require("./validations");
const {pedidoInvalidoSession, mesmoPedidoSession} = require("./lexSessions");

class ClientController {
    constructor(sqsObj, alexaObj) {
        this.sqsObj = sqsObj;
        this.alexaObj = alexaObj;
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
            const esvaziar = await this.sqsObj.purgeQueue({QueueUrl: queueUrl.QueueUrl}).promise();
            await this.alexaObj.putSession(pedidoInvalidoSession(messageGroupId));
        }
        catch(error) {
            const resultServer = await this.sqsObj.createQueue(paramsServer).promise();
            if(!resultServer)
                return this.ERROMENSAGENS;
            
            queueUrl = resultServer.QueueUrl;
        }

        const deleteSessionParams = {
            botAlias: 'skyBot', /* required */
            botName: 'skybot', /* required */
            userId: messageGroupId, /* required */
          };
        try{
            await this.alexaObj.deleteSession(deleteSessionParams).promise();            
        }
        catch(error){
            console.log("Sessão não existe");
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

        const result = await this.askAlexa(data);

        if(!result)
            return this.ERROMENSAGENS;

        return result;
    }

    async postGeetings(id, name) {

        const message = `Olá, ${name[0].firstName}. Em que posso ajudar?`;
        const result = await this.sendMessageToQueue(id, message);

        if(!result)
            return this.ERROMENSAGENS;

        return result;
    }

    async askAlexa (messageData) {

        const params = {
            botAlias: 'skyBot', /* required */
            botName: 'skybot', /* required */
            userId: messageData.messageGroupId, /* required */
            inputText: messageData.messageBody
        };

        const result = await this.alexaObj.postText(params).promise();
        const message = await this.processAlexaResult(result, messageData.messageGroupId);
        const resultProcess = await this.sendMessageToQueue(messageData.messageGroupId, message);

        return resultProcess;
//        return message // temporario
    }

    async processAlexaResult(result, id){
        if(!result)
            return result;

        const {message, slots, intentName} = result;
        let finalMessage = message;
        
        if(intentName === "consultapedido") {
            if(slots.pedido && slots.pedido.length > 0) {
                if(!slots.mesmopedido) {
                    if(!validateOrderId(slots.pedido)) {                    
                        finalMessage =  pedidoInvalido(id, "Código do pedido inválido.");
                    }
                    else {                    
                        const resultPedido = await getOrderDetailsByOrderId(slots.pedido);
    
                        if(resultPedido.status != 200) {
                            finalMessage = await this.pedidoInvalido(id, "Sua conta não possui um pedido com o código informado.");
                        }
                        else {
                            finalMessage = await this.pedidoValido(finalMessage, resultPedido.data);
                        }                        
                    }                
                }
                else {
                    if(slots.mesmopedido.toLowerCase().includes("nao"))
                    {
                        if(!slots.outropedido) {
                            const params = {
                                botAlias: 'skyBot', /* required */
                                botName: 'skybot', /* required */
                                userId: id, /* required */
                                inputText: "nao"
                            };
                    
                            const response = await this.alexaObj.postText(params).promise();  
                            finalMessage = response.message;                                               
                        }
                        else {
                            if(slots.outropedido.toLowerCase().includes("sim")) {
                                const response = await this.changeAlexaSession(pedidoInvalidoSession(id));
                                finalMessage = response.message;
                            }
                            else {
                                if(slots.outropedido.toLowerCase().includes("nao")) {
                                    if(slots.ajudar) {
                                        if(slots.ajudar.toLowerCase().includes("sim")) {
                                            finalMessage = "Foi um prazer poder te ajudar! " + finalMessage;
                                        }
                                        else {
                                            if(slots.outropedido.toLowerCase().includes("nao")) {
                                                finalMessage = "Acho que infelizmente não consegui te ajudar desta vez. " + finalMessage;
                                            }
                                        }
                                        
                                        const params = {
                                            botAlias: 'skyBot', /* required */
                                            botName: 'skybot', /* required */
                                            userId: id, /* required */
                                            inputText: "fim"
                                        };
                                
                                        const response = await this.alexaObj.postText(params).promise();  
                                    }
                                }
                            }
                        }
                    }
                    else {
                        if(slots.mesmopedido.toLowerCase().includes("sim")) {
                            if(slots.maisinfo) {
                                finalMessage = await this.mesmoPedido(slots);
                                const response = await this.changeAlexaSession(mesmoPedidoSession(id, slots.pedido));
                                finalMessage += ". " + response.message;
                            }
                        }
                    }
                }
            }
            else {
                finalMessage = "Claro, vamos consultar seu pedido. " + finalMessage;
            }
        }

        console.log("finalMessage", finalMessage);

        return finalMessage;
    }

    async mesmoPedido(slots) {
        let finalMessage = "";
        const utteranceArray = ["quando", "prazo", "itens", "compras", "data", "compra", "valor", "quanto", "custo", "preço", "preco", "total", "local", "endereco", "endereco"];
        const {data} = await getOrderDetailsByOrderId(slots.pedido);

        const found = utteranceArray.find((item) => {
            return slots.maisinfo.includes(item);
        })

        switch(found){
            case "quando":
            case "prazo":{
                const entrega = new Date(data.shippingData.logisticsInfo[0].shippingEstimateDate);
                const dataFormatada = entrega.getDate() + "/" + (entrega.getMonth()+1) + "/" + entrega.getFullYear();
                finalMessage = "Prazo para entrega: " + dataFormatada;
                break;
            }
            case "itens": 
            case "compras": {
                let count = 1;
                const itens = data.items.reduce((acc, cur) => {
                    if(acc != "")
                        acc += acc + " ";

                    acc += count + ". " + cur.name + " - Preço unitário: " + cur.price;
                    count++;
                    return acc;
                }, "");

                finalMessage = itens;
                break;
            }
            case "data":
            case "compra": {
                const compra = new Date(data.creationDate);
                const dataFormatada = compra.getDate() + "/" + (compra.getMonth()+1) + "/" + compra.getFullYear();
                finalMessage = "Data da compra: " + dataFormatada;
                break;
            }
            case "valor":
            case "quanto":
            case "custo":
            case "preço":
            case "preco":
            case "total": {
                const totalFormatado = "Valor Total do Pedido: R$ " + data.totals[0].value;
                finalMessage = totalFormatado;
                break;
            }
            case "local":
            case "endereço":
            case "endereco": {  
                const local = data.shippingData.address.street + ". Número: " +  data.shippingData.address.number + " Bairro: " + data.shippingData.address.neighborhood;          
                finalMessage = "Endereço de Entrega: " + local;
                break;
            }
        }

        return finalMessage;
    }

    async pedidoInvalido(id, customMessage) {
        const resultChangeSession = await this.changeAlexaSession(pedidoInvalidoSession(id)); 
        if(!resultChangeSession)
            return this.ERROMENSAGENS;   

        const params = {
            botAlias: 'skyBot', /* required */
            botName: 'skybot', /* required */
            userId: id, /* required */
            inputText: "consultar pedido"
        };

        const response = await this.alexaObj.postText(params).promise();  
        if(!response)
            return this.ERROMENSAGENS;                                                                              

        return customMessage + " " + response.message; 
    }

    async pedidoValido(customMessage, {clientProfileData, statusDescription, shippingData}) {
        const entrega = new Date(shippingData.logisticsInfo[0].shippingEstimateDate);
        const dataFormatada = entrega.getDate() + "/" + (entrega.getMonth()+1) + "/" + entrega.getFullYear();
        let message = `Perfeito, ${clientProfileData.firstName}! Localizei seu pedido. `
        message += `Ele está ${statusDescription}. `
        message += `Previsão de entrega: ${dataFormatada}. `
        message += customMessage;

        return message
    }

    async changeAlexaSession(session) {
        const result = await this.alexaObj.putSession(session).promise();
        if(!result)
            return this.ERROMENSAGENS;

        return result;
    }

    async sendMessageToQueue(id, messageBody) {
        const queueObj = await this.getQueueUrlByQueueName(`${id}-server.fifo`);
                
        if(!queueObj)
            return this.ERROMENSAGENS;

        const QueueUrl = (queueObj) ? queueObj.QueueUrl.toString() : null;
        

        if(!QueueUrl)
            return this.ERROMENSAGENS;

        
        const result = await this.sqsObj.sendMessage({
            MessageGroupId: id,
            MessageBody: JSON.stringify(messageBody),
            MessageDeduplicationId: uuid.v1(),
            QueueUrl
        }).promise();

        return result
    } 
}

module.exports = ClientController;