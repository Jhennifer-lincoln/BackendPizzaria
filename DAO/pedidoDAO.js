import conectar from "./conexao.js";
import PizzaDAO from "../DAO/pizzaDAO.js";

export default class PedidoDAO {
    constructor() {
        this.init();
    }

    async init() {
        let conexao;
        try {
            const sqlPedidos = `
            CREATE TABLE IF NOT EXISTS pedido (
                id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                sessao VARCHAR(255) NOT NULL,
                forma_pagamento VARCHAR(100),
                status VARCHAR(50) DEFAULT 'novo',
                total DECIMAL(10,2) DEFAULT 0,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );`;

            const sqlItens = `
            CREATE TABLE IF NOT EXISTS pedido_item (
                id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                pedido_id INT NOT NULL,
                pizza_codigo INT NOT NULL,
                pizza_nome VARCHAR(150),
                quantidade INT NOT NULL,
                subtotal DECIMAL(10,2) NOT NULL,
                FOREIGN KEY (pedido_id) REFERENCES pedido(id) ON DELETE CASCADE
            );`;

            conexao = await conectar();
            await conexao.execute(sqlPedidos);
            await conexao.execute(sqlItens);
            console.log("🧾 Tabelas de pedidos inicializadas com sucesso!");
        } catch (erro) {
            console.log("❌ Erro ao iniciar tabelas de pedido:", erro.message);
        } finally {
            if (conexao) conexao.release();
        }
    }

    async criarOuAtualizarPedidoTemp(sessao) {
        const conexao = await conectar();
        try {
            const [rows] = await conexao.execute(
                "SELECT * FROM pedido WHERE sessao = ? AND status = 'novo' LIMIT 1",
                [sessao]
            );
            if (rows.length > 0) return rows[0];

            const [res] = await conexao.execute(
                "INSERT INTO pedido (sessao, status, total) VALUES (?, 'novo', 0)",
                [sessao]
            );

            const [novoRow] = await conexao.execute(
                "SELECT * FROM pedido WHERE id = ?",
                [res.insertId]
            );
            return novoRow[0];
        } finally {
            conexao.release();
        }
    }

    async adicionarItem(sessao, pizzaCodigo, quantidade = 1) {
        const conexao = await conectar();
        const pizzaDAO = new PizzaDAO();
        try {
            const pizza = await pizzaDAO.buscarPorCodigo(pizzaCodigo);
            if (!pizza) throw new Error("Produto não encontrado");

            const pedido = await this.criarOuAtualizarPedidoTemp(sessao);

            const precoUnitario = Number(pizza.preco) || 0;
            const qty = Number(quantidade) || 1;
            const subtotal = precoUnitario * qty;

            await conexao.execute(
                "INSERT INTO pedido_item (pedido_id, pizza_codigo, pizza_nome, quantidade, subtotal) VALUES (?, ?, ?, ?, ?)",
                [
                    pedido.id,
                    pizza.codigo,
                    pizza.nome || null,
                    qty,
                    subtotal
                ]
            );

            await conexao.execute(
                "UPDATE pedido SET total = COALESCE(total,0) + ? WHERE id = ?",
                [subtotal, pedido.id]
            );

            const [pedidoRows] = await conexao.execute(
                "SELECT * FROM pedido WHERE id = ?",
                [pedido.id]
            );
            const [itens] = await conexao.execute(
                "SELECT * FROM pedido_item WHERE pedido_id = ?",
                [pedido.id]
            );
            pedidoRows[0].itens = itens;
            return pedidoRows[0];
        } finally {
            conexao.release();
        }
    }

    async atualizarDadosPedido(sessao, dados = {}) {
        const conexao = await conectar();
        try {
            const updates = [];
            const params = [];

            if ('status' in dados) { updates.push("status = ?"); params.push(dados.status ?? null); }
            if ('forma_pagamento' in dados) { updates.push("forma_pagamento = ?"); params.push(dados.forma_pagamento ?? null); }
            if ('endereco' in dados) { updates.push("endereco = ?"); params.push(dados.endereco ?? null); }

            if (updates.length > 0) {
                params.push(sessao);
                const sql = `UPDATE pedido SET ${updates.join(", ")} WHERE sessao = ? AND status = 'novo'`;
                await conexao.execute(sql, params);
            }

            const [rows] = await conexao.execute(
                "SELECT * FROM pedido WHERE sessao = ? LIMIT 1",
                [sessao]
            );
            if (rows.length === 0) return null;

            const [itens] = await conexao.execute(
                "SELECT * FROM pedido_item WHERE pedido_id = ?",
                [rows[0].id]
            );
            rows[0].itens = itens;
            return rows[0];
        } finally {
            conexao.release();
        }
    }

    async finalizarPedido(sessao) {
        const conexao = await conectar();
        try {
            const [rows] = await conexao.execute(
                "SELECT * FROM pedido WHERE sessao = ? AND status = 'novo' LIMIT 1",
                [sessao]
            );
            if (rows.length === 0) throw new Error("Pedido não encontrado");

            const pedido = rows[0];

            const [itens] = await conexao.execute(
                "SELECT * FROM pedido_item WHERE pedido_id = ?",
                [pedido.id]
            );
            if (itens.length === 0) throw new Error("Nenhum item no pedido");

            let total = 0;
            for (const it of itens) total += Number(it.subtotal) || 0;

            await conexao.execute(
                "UPDATE pedido SET status = 'finalizado', total = ? WHERE id = ?",
                [total, pedido.id]
            );

            const [pedidoFinal] = await conexao.execute(
                "SELECT * FROM pedido WHERE id = ?",
                [pedido.id]
            );
            const [itensFinal] = await conexao.execute(
                "SELECT * FROM pedido_item WHERE pedido_id = ?",
                [pedido.id]
            );
            pedidoFinal[0].itens = itensFinal;
            return pedidoFinal[0];
        } finally {
            conexao.release();
        }
    }

    async buscarPedidoPorSession(sessao) {
        const conexao = await conectar();
        try {
            const [rows] = await conexao.execute(
                "SELECT * FROM pedido WHERE sessao = ? LIMIT 1",
                [sessao]
            );
            if (rows.length === 0) return null;

            const [itens] = await conexao.execute(
                "SELECT * FROM pedido_item WHERE pedido_id = ?",
                [rows[0].id]
            );
            rows[0].itens = itens;
            return rows[0];
        } finally {
            conexao.release();
        }
    }
}
