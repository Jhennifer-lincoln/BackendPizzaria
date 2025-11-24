import express from 'express';
import rotaPizza from './Routes/rotaPizza.js';
import rotaDialogFlow from './Routes/rotaDialogFlow.js';


const app = express();
const porta = 3000;
const host = "0.0.0.0";
app.use(express.json()); 

app.use("/webhook",rotaDialogFlow);
app.use("/pizza",rotaPizza);

app.listen(porta, host, () => {
    console.log(`Servidor rodando em http://${host}:${porta}`);
})