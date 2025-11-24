import { Router } from "express";
import PedidoDAO from "../DAO/pedidoDAO.js";

const rotaPedido = new Router();
const pedidoDAO = new PedidoDAO();

rotaPedido.get("/meu-pedido/:sessionId", async (req, res) => {
    const sessionId = req.params.sessionId;
    try {
        const pedido = await pedidoDAO.buscarPedidoPorSession(sessionId);
        if (!pedido) return res.status(404).json({ status: false, mensagem: "Pedido não encontrado" });
        res.status(200).json({ status: true, pedido });
    } catch (err) {
        res.status(500).json({ status: false, mensagem: err.message });
    }
});

export default rotaPedido;
