import Pizza from "../Models/pizza.js";

export default class Pedido {
    #id
    #endereco
    #formaPagamento
    #status
    #itens 
    #valorTotal

    constructor(id, cliente, endereco, formaPagamento, status, itens, valorTotal) {
        this.#id = id;
        this.#endereco = endereco;
        this.#formaPagamento = formaPagamento;
        this.#status = status;
        this.#itens = itens;
        this.#valorTotal = valorTotal; // corresponde a total no banco
    }

    get id() { return this.#id; }
    set id(v) { this.#id = v; }


    get endereco() { return this.#endereco; }
    set endereco(v) { this.#endereco = v; }

    get formaPagamento() { return this.#formaPagamento; }
    set formaPagamento(v) { this.#formaPagamento = v; }

    get status() { return this.#status; }
    set status(v) { this.#status = v; }

    get itens() { return this.#itens; }
    set itens(v) { this.#itens = v; }

    get valorTotal() { return this.#valorTotal; }
    set valorTotal(v) { this.#valorTotal = v; }

    toJSON() {
        return {
            id: this.#id,
            endereco: this.#endereco,
            formaPagamento: this.#formaPagamento,
            status: this.#status,
            itens: this.#itens,
            valorTotal: this.#valorTotal
        };
    }
}
