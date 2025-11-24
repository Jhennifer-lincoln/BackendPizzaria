import conectar from "./conexao.js";
import Pizza from "../Models/pizza.js";

export default class PizzaDAO {

    constructor() {
        this.init();
    }

    async init() {
        let conexao;
        try {
            const sql = `
            CREATE TABLE IF NOT EXISTS pizza (
                codigo INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(100) NOT NULL,
                descricao VARCHAR(255) NOT NULL,
                preco DECIMAL(10,2) NOT NULL,
                imagem VARCHAR(255)
            );
        `;
            conexao = await conectar();
            await conexao.execute(sql);
            console.log("🍕 Banco de dados da pizzaria iniciado com sucesso!");
        } catch (erro) {
            console.log("❌ Erro ao iniciar o banco de dados:", erro.message);
        } finally {
            if (conexao) conexao.release();
        }
    }

    async consultar() {
        const sql = `SELECT * FROM pizza`;
        const conexao = await conectar();
        const [registros] = await conexao.execute(sql);
        conexao.release();

        const listaPizzas = [];
        for (const registro of registros) {
            const pizza = new Pizza(
                registro["codigo"],
                registro["nome"],
                registro["descricao"],
                registro["preco"],
                registro["imagem"]
            );
            listaPizzas.push(pizza);
        }

        return listaPizzas;
    }

    async buscarPorNome(nome) {
        const conexao = await conectar();
        try {
            // busca aproximada, case-insensitive
            const [rows] = await conexao.execute(
                "SELECT * FROM pizza WHERE LOWER(nome) = LOWER(?) LIMIT 1",
                [nome]
            );

            if (rows.length === 0) return null;
            return rows[0];
        } finally {
            conexao.release();
        }
    }

    async buscarPorCodigo(codigo) {
        const sql = `SELECT * FROM pizza WHERE codigo = ? LIMIT 1`;
        const conexao = await conectar();
        try {
            const [rows] = await conexao.execute(sql, [codigo]);
            if (rows.length === 0) return null;
            const r = rows[0];
            return {
                codigo: r.codigo,
                nome: r.nome,
                descricao: r.descricao,
                preco: r.preco,
                imagem: r.imagem
            };
        } finally {
            conexao.release();
        }
    }

}
