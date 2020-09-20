function zerarSession(id) {
    const session = {
        botAlias: 'skyBot', /* required */
        botName: 'skybot',
        userId: id,
        dialogAction: {
            type: "ElicitSlot",
            intentName: 'consultapedido',
            slotToElicit: 'pedido',
            fulfillmentState: 'ReadyForFulfillment',
            slots: { maisinfo: null, mesmopedido: null, outropedido: null, pedido: null, ajudar: null, fim: null },
        }
    }

    return session;
}

function mesmoPedidoSession(id, pedido) {
    const session = {
        botAlias: 'skyBot', /* required */
        botName: 'skybot',
        userId: id,
        dialogAction: {
            type: "ElicitSlot",
            intentName: 'consultapedido',
            slotToElicit: 'mesmopedido',
            fulfillmentState: 'ReadyForFulfillment',
            slots: { maisinfo: null, mesmopedido: null, outropedido: null, pedido, ajudar: null, fim: null },
        }
    }

    return session;
}

function maisInfoSession(id, pedido) {
    const session = {
        botAlias: 'skyBot', /* required */
        botName: 'skybot',
        userId: id,
        dialogAction: {
            type: "ElicitSlot",
            intentName: 'consultapedido',
            slotToElicit: 'maisinfo',
            fulfillmentState: 'ReadyForFulfillment',
            slots: { maisinfo: null, mesmopedido: "sim", outropedido: null, pedido, ajudar: null, fim: null },
        }
    }

    return session;
}

module.exports = {zerarSession, mesmoPedidoSession, maisInfoSession}