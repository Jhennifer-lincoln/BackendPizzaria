import { obterCardapio } from "../utils/funcoes.js";
import PedidoDAO from "../DAO/pedidoDAO.js";
import PizzaDAO from "../DAO/pizzaDAO.js";

export default class DialogFlowCtrl {

    constructor() {
        this.pedidoDAO = new PedidoDAO();
        this.pizzaDAO = new PizzaDAO();

        this.processarIntencoes = this.processarIntencoes.bind(this);
    }

    processarIntencoes = async (requisicao, resposta) => {
        if (requisicao.method !== "POST") {
            return resposta.status(400).json({ status: false, mensagem: "Requisição inválida. Use POST." });
        }

        const dados = requisicao.body;
        const nomeIntencao = dados.queryResult.intent.displayName;
        const session = dados.session || (dados.originalDetectIntentRequest?.payload?.session) || "";
        const sessionId = session.split("/").pop();

        try {
            // ===== Boas-vindas =====
            if (nomeIntencao === "Default Welcome Intent") {
                const origem = dados?.originalDetectIntentRequest?.source;
                if (origem) {
                    // custom cards
                    const cards = await obterCardapio("custom");
                    let respostaDF = { fulfillmentMessages: [] };
                    respostaDF.fulfillmentMessages.push({
                        text: { text: ["🍕 Bem-vindo à Pizzaria Lincoln!", "Confira nosso cardápio delicioso abaixo 👇"] }
                    });
                    respostaDF.fulfillmentMessages.push(...cards);
                    respostaDF.fulfillmentMessages.push({
                        text: { text: ["Qual sabor você deseja pedir hoje?"] }
                    });
                    return resposta.status(200).json(respostaDF);
                } else {
                    // messenger cards
                    const cards = await obterCardapio("messenger");
                    let respostaDF = { fulfillmentMessages: [] };
                    respostaDF.fulfillmentMessages.push({
                        payload: {
                            richContent: [[{
                                type: "description",
                                title: "🍕 Bem-vindo à Pizzaria Lincoln!",
                                text: ["Estamos felizes em atender você 😄", "Aqui está o nosso cardápio:"]
                            }]]
                        }
                    });
                    respostaDF.fulfillmentMessages[0].payload.richContent[0].push(...cards);
                    respostaDF.fulfillmentMessages[0].payload.richContent[0].push({
                        type: "description",
                        title: "Qual sabor você deseja pedir hoje?",
                        text: []
                    });
                    return resposta.status(200).json(respostaDF);
                }
            }

            else if (nomeIntencao === "Pedido") {
                const sabor = dados.queryResult.parameters.sabor;
                const quantidade = dados.queryResult.parameters.quantidade || 1;

                const pizzaRegistro = await this.pizzaDAO.buscarPorNome(sabor);
                if (!pizzaRegistro) {
                    return resposta.status(200).json({
                        fulfillmentMessages: [{
                            text: { text: ["❌ Desculpe, não encontrei esse sabor no cardápio. Pode escolher outro?"] }
                        }]
                    });
                }

                const pedido = await this.pedidoDAO.adicionarItem(sessionId, pizzaRegistro.codigo, quantidade);

                return resposta.status(200).json({
                    fulfillmentMessages: [{
                        text: { text: [`✅ Adicionado: ${pizzaRegistro.nome} (x${quantidade}).`, "Deseja adicionar outro sabor?"] }
                    }]
                });
            }

            else if (nomeIntencao === "Forma_pagamento") {
                const forma = dados.queryResult.parameters.tipo_pagamento || dados.queryResult.parameters.forma;
                if (!forma) {
                    return resposta.status(200).json({
                        fulfillmentMessages: [{ text: { text: ["Qual forma de pagamento você prefere?"] } }]
                    });
                }

                await this.pedidoDAO.atualizarDadosPedido(sessionId, { forma_pagamento: forma });
                return resposta.status(200).json({
                    fulfillmentMessages: [{
                        text: { text: [`Forma de pagamento "${forma}" registrada.`, "Deseja finalizar o pedido agora?"] }
                    }]
                });
            }

            else if (nomeIntencao === "Finalizar_Pedido") {
                try {
                    const pedidoFinal = await this.pedidoDAO.finalizarPedido(sessionId);
                    return resposta.status(200).json({
                        fulfillmentMessages: [{
                            text: { text: [
                                `✅ Pedido finalizado! Número do pedido: ${pedidoFinal.id}`,
                                `Total: R$ ${Number(pedidoFinal.valor_total).toFixed(2)}`,
                                "Em breve entraremos em contato para confirmar a entrega. Obrigado!"
                            ] }
                        }]
                    });
                } catch (errFin) {
                    return resposta.status(200).json({
                        fulfillmentMessages: [{ text: { text: ["Não foi possível finalizar o pedido: " + errFin.message] } }]
                    });
                }
            }

            else if (nomeIntencao === "Não Finalizar_Pedido") {
                return resposta.status(200).json({
                    fulfillmentMessages: [{
                        text: { text: ["Tudo bem, seu pedido ficou salvo. Deseja alterar algo (endereço, pagamento) ou continuar no cardápio?"] }
                    }]
                });
            }

            else {
                return resposta.status(200).json({
                    fulfillmentMessages: [{
                        text: { text: ["Desculpe, não entendi o seu pedido 😅", "Poderia repetir, por favor?"] }
                    }]
                });
            }
        } catch (erroGeral) {
            console.log("Erro no webhook:", erroGeral.message);
            return resposta.status(500).json({
                fulfillmentMessages: [{
                    text: { text: ["Ocorreu um erro no servidor. Tente novamente em alguns instantes."] }
                }]
            });
        }
    }
}
