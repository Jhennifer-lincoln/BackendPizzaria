import { obterCardapio } from "../utils/funcoes.js";
import PedidoDAO from "../DAO/pedidoDAO.js";
import PizzaDAO from "../DAO/pizzaDAO.js";
import Pizza from "../Models/pizza.js";

export default class DialogFlowCtrl {

    constructor() {
        this.pedidoDAO = new PedidoDAO();
        this.pizzaDAO = new PizzaDAO();
    }

    async processarIntencoes(requisicao, resposta) {
        if (requisicao.method === 'POST') {
            const dados = requisicao.body;
            const nomeIntencao = dados.queryResult.intent.displayName;
            // session ex: projects/.../agent/sessions/SESSION_ID
            const session = dados.session || (dados.originalDetectIntentRequest && dados.originalDetectIntentRequest.payload && dados.originalDetectIntentRequest.payload.session) || "";
            const sessionId = session.split("/").pop();

            try {
                if (nomeIntencao === "Default Welcome Intent") {
                    const origem = dados?.originalDetectIntentRequest?.source;

                    if (origem) {
                        obterCardapio("custom").then((cards) => {
                            let respostaDF = { "fulfillmentMessages": [] };

                            respostaDF.fulfillmentMessages.push({
                                "text": {
                                    "text": [
                                        "🍕 Bem-vindo à Pizzaria Lincoln!",
                                        "Confira nosso cardápio delicioso abaixo 👇"
                                    ]
                                }
                            });

                            respostaDF.fulfillmentMessages.push(...cards);

                            respostaDF.fulfillmentMessages.push({
                                "text": {
                                    "text": [
                                        "Qual sabor você deseja pedir hoje?"
                                    ]
                                }
                            });

                            resposta.status(200).json(respostaDF);
                        }).catch((erro) => {
                            let respostaDF = {
                                "fulfillmentMessages": [{
                                    "text": {
                                        "text": [
                                            "🍕 Bem-vindo à Pizzaria Lincoln!",
                                            "Infelizmente não conseguimos carregar o cardápio agora 😔",
                                            "Tente novamente em instantes."
                                        ]
                                    }
                                }]
                            };
                            resposta.status(200).json(respostaDF);
                        });
                    } else {
                        obterCardapio("messenger").then((cards) => {
                            let respostaDF = { "fulfillmentMessages": [] };

                            respostaDF.fulfillmentMessages.push({
                                "payload": {
                                    "richContent": [[{
                                        "type": "description",
                                        "title": "🍕 Bem-vindo à Pizzaria Lincoln!",
                                        "text": [
                                            "Estamos felizes em atender você 😄",
                                            "Aqui está o nosso cardápio:"
                                        ]
                                    }]]
                                }
                            });

                            respostaDF.fulfillmentMessages[0].payload.richContent[0].push(...cards);

                            respostaDF.fulfillmentMessages[0].payload.richContent[0].push({
                                "type": "description",
                                "title": "Qual sabor você deseja pedir hoje?",
                                "text": []
                            });

                            resposta.status(200).json(respostaDF);
                        }).catch((erro) => {
                            let respostaDF = {
                                "fulfillmentMessages": [{
                                    "payload": {
                                        "richContent": [[{
                                            "type": "description",
                                            "title": "🍕 Bem-vindo à Pizzaria Lincoln!",
                                            "text": [
                                                "Estamos felizes em atender você 😄",
                                                "Mas no momento não conseguimos mostrar o cardápio 😔",
                                                "Tente novamente em alguns minutos."
                                            ]
                                        }]]
                                    }
                                }]
                            };
                            resposta.status(200).json(respostaDF);
                        });
                    }
                }

                // Quando o usuário informa um pedido (sabor e opcionalmente quantidade)
                else if (nomeIntencao === "Pedido") {
                    // parâmetros esperados: sabor (string), quantidade (number) OU código (numero)
                    const sabor = dados.queryResult.parameters.sabor;
                    const quantidade = dados.queryResult.parameters.quantidade || 1;
                   const pizza = new Pizza();

                    const respostaDF = {
                    "fulfillmentMessages": [{
                        "text": {
                            "text": [
                                `Perfeito! Essa faz sucesso.`,
                                "Deseja adicionar outro sabor?"
                            ]
                        }
                    }]
                };
                resposta.status(200).json(respostaDF);


                    // adiciona item ao pedido temporário (associado à session)
                    try {
                        const pedido = await this.pedidoDAO.adicionarItem(sessionId, pizza.codigo, quantidade);
                        return resposta.status(200).json({
                            "fulfillmentMessages": [{
                                "text": {
                                    "text": [
                                        `Adicionado: ${pizza.nome} (x${quantidade}).`,
                                        "Deseja adicionar outro sabor?"
                                    ]
                                }
                            }]
                        });
                    } catch (errItem) {
                        return resposta.status(200).json({
                            "fulfillmentMessages": [{
                                "text": { "text": ["Erro ao adicionar item ao pedido. Tente novamente."] }
                            }]
                        });
                    }
                }

                // Pergunta se deseja pedir mais (PedirMais - Sim / - Não)
                else if (nomeIntencao === "PedirMais") {
                    const respostaSim = dados.queryResult.parameters.confirmacao === "sim" || dados.queryResult.intent.displayName.endsWith("Sim");
                    if (respostaSim) {
                        return resposta.status(200).json({
                            "fulfillmentMessages": [{
                                "text": { "text": ["Perfeito! Qual outro sabor deseja adicionar?"] }
                            }]
                        });
                    } else {
                        // se não pedir mais, pede endereço
                        return resposta.status(200).json({
                            "fulfillmentMessages": [{
                                "text": { "text": ["Ok! Por favor, informe o endereço para entrega."] }
                            }]
                        });
                    }
                }

                // Recebe o Endereco (parâmetro endereco)
                else if (nomeIntencao === "Endereco") {
                    const endereco = dados.queryResult.parameters.endereco || dados.queryResult.parameters["endereco.original"] || null;
                    if (!endereco) {
                        return resposta.status(200).json({
                            "fulfillmentMessages": [{
                                "text": { "text": ["Não consegui entender o endereço. Pode repetir, por favor?"] }
                            }]
                        });
                    }

                    const pedidoAtualizado = await this.pedidoDAO.atualizarDadosPedido(sessionId, { endereco });
                    return resposta.status(200).json({
                        "fulfillmentMessages": [{
                            "text": { "text": ["Endereço recebido! Qual a forma de pagamento? (Ex: Dinheiro, Cartão)"] }
                        }]
                    });
                }

                // Forma de pagamento
                else if (nomeIntencao === "Forma_pagamento") {
                    const forma = dados.queryResult.parameters.tipo_pagamento || dados.queryResult.parameters.forma || null;
                    if (!forma) {
                        return resposta.status(200).json({
                            "fulfillmentMessages": [{
                                "text": { "text": ["Qual forma de pagamento você prefere?"] }
                            }]
                        });
                    }

                    const pedidoAtualizado = await this.pedidoDAO.atualizarDadosPedido(sessionId, { forma_pagamento: forma });
                    return resposta.status(200).json({
                        "fulfillmentMessages": [{
                            "text": {
                                "text": [
                                    `Forma de pagamento "${forma}" registrada.`,
                                    "Deseja finalizar o pedido agora?"
                                ]
                            }
                        }]
                    });
                }

                // Finalizar pedido (sim / não)
                else if (nomeIntencao === "Finalizar_Pedido") {
                    try {
                        const pedidoFinal = await this.pedidoDAO.finalizarPedido(sessionId);
                        return resposta.status(200).json({
                            "fulfillmentMessages": [{
                                "text": {
                                    "text": [
                                        `Pedido finalizado com sucesso! Número do pedido: ${pedidoFinal.id}`,
                                        `Total: R$ ${Number(pedidoFinal.valor_total).toFixed(2)}`,
                                        "Em breve entraremos em contato para confirmar a entrega. Obrigado!"
                                    ]
                                }
                            }]
                        });
                    } catch (errFin) {
                        return resposta.status(200).json({
                            "fulfillmentMessages": [{
                                "text": { "text": ["Não foi possível finalizar o pedido: " + errFin.message] }
                            }]
                        });
                    }
                }

                else if (nomeIntencao === "Não Finalizar_Pedido") {
                    // mantém pedido em andamento e confirma retorno ao menu ou alteração
                    return resposta.status(200).json({
                        "fulfillmentMessages": [{
                            "text": {
                                "text": [
                                    "Tudo bem, seu pedido ficou salvo. Deseja alterar algo (endereço, pagamento) ou continuar no cardápio?"
                                ]
                            }
                        }]
                    });
                }

                // Intenção padrão (já tinha)
                else {
                    resposta.status(200).json({
                        "fulfillmentMessages": [{
                            "text": {
                                "text": [
                                    "Desculpe, não entendi o seu pedido 😅",
                                    "Poderia repetir, por favor?"
                                ]
                            }
                        }]
                    });
                }
            } catch (erroGeral) {
                console.log("Erro no webhook:", erroGeral.message);
                resposta.status(500).json({
                    "fulfillmentMessages": [{
                        "text": {
                            "text": [
                                "Ocorreu um erro no servidor. Tente novamente em alguns instantes."
                            ]
                        }
                    }]
                });
            }
        } else {
            resposta.status(400).json({ status: false, mensagem: "Requisição inválida. Use POST." });
        }
    }
}
