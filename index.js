import express from 'express';
import rotaPizza from './Routes/rotaPizza.js';
import rotaDialogFlow from './Routes/rotaDialogFlow.js';
import rotaPedido from "./Routes/rotaPedido.js";


const app = express();
const porta = 3000;
const host = "0.0.0.0";
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use("/webhook",rotaDialogFlow);
app.use("/pizza",rotaPizza);
app.use("/pedido", rotaPedido);

app.listen(porta, host, () => {
    console.log(`Servidor rodando em http://${host}:${porta}`);
})