const uuid = require('uuid');
const {getOrderDetailsByOrderId} = require("./vtexController");
const {validateOrderId} = require("./validations");
const {zerarSession, mesmoPedidoSession, maisInfoSession} = require("./lexSessions");

class ClientController {
    constructor(sqsObj, alexaObj, alexaServiceObj) {
        this.sqsObj = sqsObj;
        this.alexaObj = alexaObj;
        this.alexaServiceObj = alexaServiceObj;
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
            await this.sqsObj.purgeQueue({QueueUrl: queueUrl.QueueUrl}).promise();
            await this.alexaObj.putSession(zerarSession(messageGroupId));
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
        console.log("mensagem:", message);
        const resultProcess = await this.sendMessageToQueue(messageData.messageGroupId, message);

        return resultProcess;
//        return message // temporario
    }

    async processAlexaResult(result, id){
        if(!result)
            return result;

        const {message, slots, intentName, dialogState} = result;
        const generalParams = {
            botAlias: 'skyBot', /* required */
            botName: 'skybot', /* required */
            userId: id, /* required */
        };
        
        let finalMessage = message;
        
        if(intentName !== "consultapedido")
            return finalMessage;

        if(!slots.pedido || slots.pedido.length <= 0)
            return "Claro, vamos consultar seu pedido. " + finalMessage;

        if(!slots.mesmopedido) {
            if(!validateOrderId(slots.pedido))
                return pedidoInvalido(id, "Código do pedido inválido.");

            const resultPedido = await getOrderDetailsByOrderId(slots.pedido);

            finalMessage = (resultPedido.status !== 200) ? await this.pedidoInvalido(id, "Sua conta não possui um pedido com o código informado.") : await this.pedidoValido(finalMessage, resultPedido.data);                               

            return finalMessage;
        }

        if(slots.mesmopedido.toLowerCase().includes("nao")) {
            if(!slots.outropedido) {
                const params = {
                    ...generalParams,
                    inputText: "nao"
                };
        
                const response = await this.alexaObj.postText(params).promise();  
                return response.message;                                               
            }

            if(slots.outropedido.toLowerCase().includes("sim")) {
                const response = await this.changeAlexaSession(zerarSession(id));
                return response.message;
            }

            if(slots.outropedido.toLowerCase().includes("nao")) {
                if(!slots.ajudar)
                    return finalMessage;

                if(slots.ajudar.toLowerCase().includes("sim"))
                    finalMessage = "Foi um prazer poder te ajudar! " + finalMessage;
                else if(slots.outropedido.toLowerCase().includes("nao"))
                    finalMessage = "Acho que infelizmente não consegui te ajudar desta vez. " + finalMessage;
                
                const params = {
                    ...generalParams,
                    inputText: "fim"
                };
        
                await this.alexaObj.postText(params).promise();  
            }

            return finalMessage;
        }
        
        if(slots.mesmopedido.toLowerCase().includes("sim")) {
            if(slots.maisinfo) {
                finalMessage = await this.mesmoPedido(slots, id);
                const response = await this.changeAlexaSession(mesmoPedidoSession(id, slots.pedido));
                finalMessage += ". " + response.message;
                return finalMessage;
            }
            
            if(!dialogState || dialogState !== "Failed")
                return finalMessage;
                
            const response = await this.changeAlexaSession(maisInfoSession(id, slots.pedido));
            return response.message;
        }

        return finalMessage;
    }

    async mesmoPedido(slots, id) {
        let finalMessage = "";
        const {enumerationValues} = await this.alexaServiceObj.getSlotType({version: "$LATEST", name: "TIPO_INFORMACAO"}).promise();
        const {data} = await getOrderDetailsByOrderId(slots.pedido);
        const toFind = slots.maisinfo.toLowerCase();

        const found = enumerationValues.reduce((acc, tipo) => {
            if(toFind.includes(tipo.value))
                return acc = tipo.value;
            
            const syn = tipo.synonyms.find((syn) => {
                return (toFind.includes(syn));
            })

            if(syn && syn.length > 0)
                acc = tipo.value;

            console.log(acc);
            return acc; 
        }, "");

        if(!found || found.length <= 0) {
            const response = await this.changeAlexaSession(maisInfoSession(id, slots.pedido));
            return `Não foram encontrados dados referentes à informação \"${toFind}\". ` + response.message;
        }

        switch(found){
            case "prazo":{
                const entrega = new Date(data.shippingData.logisticsInfo[0].shippingEstimateDate);
                const dataFormatada = entrega.getDate() + "/" + (entrega.getMonth()+1) + "/" + entrega.getFullYear();
                finalMessage = "Prazo para entrega: " + dataFormatada;
                break;
            }
            case "itens": {
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
            case "data": {
                const compra = new Date(data.creationDate);
                const dataFormatada = compra.getDate() + "/" + (compra.getMonth()+1) + "/" + compra.getFullYear();
                finalMessage = "Data da compra: " + dataFormatada;
                break;
            }
            case "valor": {
                const totalFormatado = "Valor Total do Pedido: R$ " + data.totals[0].value;
                finalMessage = totalFormatado;
                break;
            }
            case "local": {  
                const local = data.shippingData.address.street + ". Número: " +  data.shippingData.address.number + " Bairro: " + data.shippingData.address.neighborhood;          
                finalMessage = "Endereço de Entrega: " + local;
                break;
            }
        }

        return finalMessage;
    }

    async pedidoInvalido(id, customMessage) {
        const resultChangeSession = await this.changeAlexaSession(zerarSession(id)); 
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