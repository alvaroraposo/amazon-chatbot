function pedidoInvalidoSession(id) {
    const session = {
        botAlias: 'skyBot', /* required */
        botName: 'skybot',
        userId: id,
        dialogAction: {
            type: "ElicitSlot",
            intentName: 'consultapedido',
            slotToElicit: 'pedido',
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
            slots: { maisinfo: null, mesmopedido: null, outropedido: null, pedido },
        }
    }

    return session;
}

module.exports = {pedidoInvalidoSession, mesmoPedidoSession}