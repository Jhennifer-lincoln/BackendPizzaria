import Pizza from "../Models/pizza.js";

export function criarMessengerCard() {
    return {
        type: "info",
        title: "",
        subtitle: "",
        image: {
            src: {
                rawUrl: ""
            }
        },
        actionLink: ""
    };
} 

export function criarCustomCard() {
    return {
        card: {
            title: "",
            subtitle: "",
            imageUri: "",
            buttons: [
                {
                    text: "Ver detalhes 🍕",
                    postback: ""
                }
            ]
        }
    };
} 
export async function obterCardapio(tipoCard = "custom") {
    const listaCardsPizzas = [];
    const pizzaModel = new Pizza();
    const pizzas = await pizzaModel.consultar(); 

    for (const pizza of pizzas) {
        let card;

        if (tipoCard === "custom") {
            card = criarCustomCard();
            card.card.title = pizza.nome;
            card.card.subtitle = `${pizza.descricao}\nPreço: R$ ${pizza.preco}`;
            card.card.imageUri = pizza.imagem;
            card.card.buttons[0].postback = "https://pedido.anota.ai/";
        } else {
            card = criarMessengerCard();
            card.title = pizza.nome;
            card.subtitle = `${pizza.descricao} — R$ ${pizza.preco}`;
            card.image.src.rawUrl = pizza.imagem;
            card.actionLink = "https://pedido.anota.ai/";
        }

        listaCardsPizzas.push(card);
    }

    return listaCardsPizzas;
}
