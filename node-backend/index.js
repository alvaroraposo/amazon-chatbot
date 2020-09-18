import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import validateEmail, {validateOrderId} from './validations.js';
import {v1} from 'uuid';
import getMostRecentOrderByEmail, {getOrderDetailsByOrderId} from './getOrders.js';

const app = express();
app.use(express.json());
app.use(cors());

dotenv.config();
axios.defaults.timeout = 20000;

app.get("/chatbot/:email", async (req, res, next) => {
    const email = (req && req.params) ? req.params.email : -1;

    if(!validateEmail(email)){
        res.send({
            statusCode: 401,
            body: {message: "Por favor, efetue login para possibilitar a consulta aos pedidos."}
        })
    }

    const id = email.replace("@", "-").replace(".", "-");
    const result = await axios.get(`${process.env.AWS_CLIENT_GET}/${id}`);
    
    const resultStatusCode = (result) ? result.status : 500;
    const message = (result && result.data) ? result.data.message : -1;

    if(message !== id || resultStatusCode !== 200) {
        return res.send({
            statusCode: 500,
            body: {message: 'Erro interno no servidor'}
        })
    }
    
    res.send({
        statusCode: 200,
        body: {message: `Seja bem-vindo ${email}`}
    })

    next();
}, async (req, res, next) => {
    
    const email = (req && req.params) ? req.params.email : -1;
    const id = email.replace("@", "-").replace(".", "-");
    const message = `Em que posso ajudar?`.toString();

    const resultPost = await axios.post(`${process.env.AWS_SERVER_POST}`, {
        messageGroupId: id,
        messageDeduplicationId: v1(),
        messageBody: message
    });

    if(!resultPost || resultPost.status != 200)
    {
        res.send({
            statusCode: 500,
            body: {message: 'Erro interno no servidor'}
        })
    };

    res.end();
})

app.get("/chatbot/messages/:email", async (req, res) => {
    const email = (req && req.params) ? req.params.email : -1;

    if(!validateEmail(email)){
        res.send({
            statusCode: 401,
            message: "E-mail inválido."
        })
    }    
    const id = email.replace("@", "-").replace(".", "-");

    let result = null;
    try {
        result = await axios.get(`${process.env.AWS_SERVER_GET}/${id}`);
    } catch(error) {
        console.log(error);
        res.send({
            statusCode: error.response.status,
            body: {message: error.response.statusText}
        })

        return;
    }
    
    const resultStatusCode = (result) ? result.status : 500;
    const message = (result && result.data) ? result.data.message : -1;

    res.send({
        statusCode: resultStatusCode,
        body: { message: {...message}}
    })
})

// app.get("/chatbot/:orderid", async (req, res) => {
//     const orderid = (req && req.params) ? req.params.orderid : -1;

//     if(!validateOrderId(orderid)){
//         res.send({
//             statusCode: 400,
//             message: "Código do pedido inválido, por favor, digite novamente."
//         })
//     }

//     const message = [];
//     const order = await getOrderDetailsByOrderId(orderid);

//     if(!order || order === {} || !validateOrderId(order.orderId)) {
//         res.send({
//             statusCode: 204,
//             message: "Você não possui pedidos com o código informado, por favor, digite novamente."
//         })        
//     }

//     message.push(order);

//     const items = order.items.reduce((acc, item) => {        
//         acc = (acc !== "") ? acc + "; " + item.name : item.name;
//     }, "");

//     message.push(order);
//     message.push("Você adquiriu: " + items);
//     message.push("Gostaria de mais informações?");
//     message.push(["Sim", "Não"]);

//     res.send({
//         statusCode: 200,
//         message
//     }) 
// })

// app.post("/chatbot/:orderid", async (req, res) => {
//     const body = (req.body) ? req.body : null;
//     const orderid = (req && req.params) ? req.params.orderid : -1;

//     if(!validateOrderId(orderid)){
//         res.send({
//             statusCode: 400,
//             message: "Código do pedido inválido, por favor, digite novamente."
//         })
//     }
// })

// app.post("/messages", async(req, res) => {
//     const body = (req.body) ? req.body : null;

//     const postResult = await axios.post(process.env.AWS_CLIENT_POST, body);
//     const statusCode = (postResult) ? postResult.status : 500;
//     const messageGroupId = (postResult && postResult.data) ? postResult.data.messageGroupId : -1;
    
//     res.send({
//         statusCode,
//         body: {messageGroupId}
//     })
// });

// app.get("/messages/:id", async(req, res) => {
//     const messageGroupId = (req && req.params) ? req.params.id : -1;

//     if(messageGroupId <= 0) {
//         res.send({
//             statusCode: 500,
//             message: "Erro ao acessar a fila de mensagens"
//         })
//     }

//     const getFirstResult = await axios.get(`${process.env.AWS_SERVER_GET}/${messageGroupId}`);
//     const firstStatusCode = (getFirstResult) ? getFirstResult.status : 500;
//     const firstMessage = (getFirstResult && getFirstResult.data) ? getFirstResult.data.messageBody : -1;

//     if(firstStatusCode != 200) {
//         res.send({
//             firstStatusCode,
//             body: JSON.stringify({
//                 message: firstMessage
//             })
//         })
//     }
    
//     const getResult = await axios.get(`${process.env.AWS_CLIENT_GET}/${messageGroupId}`);
//     const statusCode = (getResult) ? getResult.status: 500;
//     const message = (getResult && getResult.data) ? getResult.data.messageBody : -1;

//     res.send({
//         statusCode,
//         body: {
//             message
//         }
//     })

// })

const porta = process.env.PORT || 8081;
app.listen(porta, () => {
    console.log("APP INICIADA: PORTA", porta);
});

