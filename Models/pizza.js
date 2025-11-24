    import PizzaDAO from "../DAO/pizzaDAO.js";

    export default class Pizza {

        #codigo
        #nome
        #descricao
        #preco
        #imagem

        constructor(codigo, nome, descricao, preco, imagem) {
            this.#codigo = codigo;
            this.#nome = nome;
            this.#descricao = descricao;
            this.#preco = preco;
            this.#imagem = imagem;
        }

        get codigo() { 
            return this.#codigo; 
        }

        set codigo(codigo) { 
            this.#codigo = codigo; 
        }

        get nome() { 
            return this.#nome; 
        }

        set nome(nome) { 
            this.#nome = nome; 
        }

        get descricao() { 
            return this.#descricao; 
        }

        set descricao(descricao) { 
            this.#descricao = descricao; 
        }

        get preco() { 
            return this.#preco; 
        }

        set preco(preco) { 
            this.#preco = preco; 
        }

        get imagem() { 
            return this.#imagem; 
        }

        set imagem(imagem) { 
            this.#imagem = imagem; 
        }

        toJSON() {
            return {
                'codigo': this.#codigo,
                'nome': this.#nome,
                'descricao': this.#descricao,
                'preco': this.#preco,
                'imagem': this.#imagem
            };
        }

        async consultar() {
            const pizzaDAO = new PizzaDAO();
            return await pizzaDAO.consultar();
        }
    }
