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
}
