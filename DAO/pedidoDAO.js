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
                session_id VARCHAR(255) NOT NULL,
                cliente VARCHAR(255),
                endereco VARCHAR(255),
                forma_pagamento VARCHAR(100),
                status VARCHAR(50),
                valor_total DECIMAL(10,2),
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            `;

            const sqlItens = `
            CREATE TABLE IF NOT EXISTS pedido_item (
                id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                pedido_id INT NOT NULL,
                pizza_codigo INT,
                nome VARCHAR(255),
                quantidade INT,
                preco DECIMAL(10,2),
                FOREIGN KEY (pedido_id) REFERENCES pedido(id) ON DELETE CASCADE
            );
            `;

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

    async criarOuAtualizarPedidoTemp(sessionId) {
        const conexao = await conectar();
        try {
            // tenta encontrar pedido em andamento para a sessão
            const [rows] = await conexao.execute("SELECT * FROM pedido WHERE session_id = ? AND status = 'em_andamento' LIMIT 1", [sessionId]);
            if (rows.length > 0) {
                return rows[0];
            } else {
                const [res] = await conexao.execute("INSERT INTO pedido (session_id, status, valor_total) VALUES (?, 'em_andamento', 0.00)", [sessionId]);
                const id = res.insertId;
                const [novoRow] = await conexao.execute("SELECT * FROM pedido WHERE id = ?", [id]);
                return novoRow[0];
            }
        } finally {
            conexao.release();
        }
    }

    async adicionarItem(sessionId, pizzaCodigo, quantidade = 1) {
        const conexao = await conectar();
        const pizzaDAO = new PizzaDAO();
        try {
            // busca pizza por codigo
            const pizza = await pizzaDAO.buscarPorCodigo(pizzaCodigo);
            if (!pizza) throw new Error("Produto não encontrado");

            // garante pedido temporário
            const pedido = await this.criarOuAtualizarPedidoTemp(sessionId);
            const preco = Number(pizza.preco);
            const subtotal = preco * Number(quantidade);

            // insere item
            await conexao.execute(
                "INSERT INTO pedido_item (pedido_id, pizza_codigo, nome, quantidade, preco) VALUES (?, ?, ?, ?, ?)",
                [pedido.id, pizzaCodigo, pizza.nome, quantidade, subtotal]
            );

            // atualiza total
            await conexao.execute(
                "UPDATE pedido SET valor_total = COALESCE(valor_total,0) + ? WHERE id = ?",
                [subtotal, pedido.id]
            );

            // retorna pedido com itens
            const [pedidoRows] = await conexao.execute("SELECT * FROM pedido WHERE id = ?", [pedido.id]);
            const [itens] = await conexao.execute("SELECT * FROM pedido_item WHERE pedido_id = ?", [pedido.id]);

            pedidoRows[0].itens = itens;
            return pedidoRows[0];
        } finally {
            conexao.release();
        }
    }

    async atualizarDadosPedido(sessionId, dados = {}) {
        const conexao = await conectar();
        try {
            const updates = [];
            const params = [];
            if (dados.cliente !== undefined) { updates.push("cliente = ?"); params.push(dados.cliente); }
            if (dados.endereco !== undefined) { updates.push("endereco = ?"); params.push(dados.endereco); }
            if (dados.forma_pagamento !== undefined) { updates.push("forma_pagamento = ?"); params.push(dados.forma_pagamento); }
            if (dados.status !== undefined) { updates.push("status = ?"); params.push(dados.status); }

            if (updates.length === 0) {
                // retorna pedido atual
                const [rows] = await conexao.execute("SELECT * FROM pedido WHERE session_id = ? AND status IN ('em_andamento','finalizado') LIMIT 1", [sessionId]);
                if (rows.length === 0) return null;
                const [itens] = await conexao.execute("SELECT * FROM pedido_item WHERE pedido_id = ?", [rows[0].id]);
                rows[0].itens = itens;
                return rows[0];
            }

            params.push(sessionId);
            const sql = `UPDATE pedido SET ${updates.join(", ")} WHERE session_id = ? AND status = 'em_andamento'`;
            await conexao.execute(sql, params);

            const [rows] = await conexao.execute("SELECT * FROM pedido WHERE session_id = ? LIMIT 1", [sessionId]);
            const [itens] = await conexao.execute("SELECT * FROM pedido_item WHERE pedido_id = ?", [rows[0].id]);
            rows[0].itens = itens;
            return rows[0];
        } finally {
            conexao.release();
        }
    }

    async finalizarPedido(sessionId) {
        const conexao = await conectar();
        try {
            const [rows] = await conexao.execute("SELECT * FROM pedido WHERE session_id = ? AND status = 'em_andamento' LIMIT 1", [sessionId]);
            if (rows.length === 0) throw new Error("Pedido não encontrado");

            const pedido = rows[0];

            // valida se tem itens
            const [itens] = await conexao.execute("SELECT * FROM pedido_item WHERE pedido_id = ?", [pedido.id]);
            if (itens.length === 0) throw new Error("Nenhum item no pedido");

            // calcula total (já armazenado, mas recalcule por segurança)
            let total = 0;
            for (const it of itens) total += Number(it.preco);

            await conexao.execute("UPDATE pedido SET status = 'finalizado', valor_total = ? WHERE id = ?", [total, pedido.id]);

            // retorna pedido finalizado
            const [pedidoFinal] = await conexao.execute("SELECT * FROM pedido WHERE id = ?", [pedido.id]);
            const [itensFinal] = await conexao.execute("SELECT * FROM pedido_item WHERE pedido_id = ?", [pedido.id]);
            pedidoFinal[0].itens = itensFinal;
            return pedidoFinal[0];
        } finally {
            conexao.release();
        }
    }

    async buscarPedidoPorSession(sessionId) {
        const conexao = await conectar();
        try {
            const [rows] = await conexao.execute("SELECT * FROM pedido WHERE session_id = ? LIMIT 1", [sessionId]);
            if (rows.length === 0) return null;
            const [itens] = await conexao.execute("SELECT * FROM pedido_item WHERE pedido_id = ?", [rows[0].id]);
            rows[0].itens = itens;
            return rows[0];
        } finally {
            conexao.release();
        }
    }
}
