import { obterCardapio } from "../utils/funcoes.js";

export default class DialogFlowCtrl {

    processarIntencoes(requisicao, resposta) {
        if (requisicao.method === 'POST') {
            const dados = requisicao.body;
            const nomeIntencao = dados.queryResult.intent.displayName;

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

            else if (nomeIntencao === "Pedido") {
                const sabor = dados.queryResult.parameters.sabor;
                const tamanho = dados.queryResult.parameters.tamanho;
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
            }

            else if (nomeIntencao === "Forma_pagamento") {
                const forma = dados.queryResult.parameters.tipo_pagamento;
                resposta.status(200).json({
                    "fulfillmentMessages": [{
                        "text": {
                            "text": [
                                `Forma de pagamento selecionado!`,
                                "Podemos confirmar o seu pedido?"
                            ]
                        }
                    }]
                });
            }

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
        }
    }
}
