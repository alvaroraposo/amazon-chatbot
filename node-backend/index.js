import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

const app = express();
app.use(express.json());
app.use(cors());

dotenv.config();

app.post("/messages", async(req, res) => {
    const body = (req.body) ? req.body : null;

    const postResult = await axios.post(process.env.AWS_CLIENT_POST, body);
    const statusCode = (postResult) ? postResult.status : 500;
    const messageGroupId = (postResult && postResult.data) ? postResult.data.messageGroupId : -1;
    
    res.send({
        statusCode,
        body: {messageGroupId}
    })
});

app.get("/messages/:id", async(req, res) => {
    const messageGroupId = (req && req.params) ? req.params.id : -1;

    if(messageGroupId <= 0) {
        res.send({
            statusCode: 500,
            message: "Erro ao acessar a fila de mensagens"
        })
    }

    const getFirstResult = await axios.get(`${process.env.AWS_SERVER_GET}/${messageGroupId}`);
    const firstStatusCode = (getFirstResult) ? getFirstResult.status : 500;
    const firstMessage = (getFirstResult && getFirstResult.data) ? getFirstResult.data.messageBody : -1;

    if(firstStatusCode != 200) {
        res.send({
            firstStatusCode,
            body: JSON.stringify({
                message: firstMessage
            })
        })
    }
    
    const getResult = await axios.get(`${process.env.AWS_CLIENT_GET}/${messageGroupId}`);
    const statusCode = (getResult) ? getResult.status: 500;
    const message = (getResult && getResult.data) ? getResult.data.messageBody : -1;

    res.send({
        statusCode,
        body: {
            message
        }
    })

})

const porta = process.env.PORT || 8081;
app.listen(porta, () => {
    console.log("APP INICIADA: PORTA", porta);
});

