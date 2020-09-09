import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(express.json());
app.use(cors());

app.post("/messages", async(req, res) => {
    const body = (req.body) ? req.body : null;
    console.log("body", body)
    const postResult = await axios.post('https://ke1lzcm9le.execute-api.us-east-1.amazonaws.com/dev/send', body);
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

    const getFirstResult = await axios.get(`https://00yw61ayva.execute-api.us-east-1.amazonaws.com/dev/receive/${messageGroupId}`);
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
    
    const getResult = await axios.get(`https://ke1lzcm9le.execute-api.us-east-1.amazonaws.com/dev/receive/${messageGroupId}`);
    const statusCode = (getResult) ? getResult.status: 500;
    const message = (getResult && getResult.data) ? getResult.data.messageBody : -1;

    res.send({
        statusCode,
        body: {
            message
        }
    })

})

app.listen(4000, () =>{
    console.log("Listening at PORT 4000");
})

