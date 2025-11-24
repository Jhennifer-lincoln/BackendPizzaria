import Pizza from "../Models/pizza.js";

export default class PizzaCtrl {

  consultar(req, res) {
    if (req.method === "GET") {
      const pizza = new Pizza();
      pizza.consultar()
        .then(listaDePizzas => {
          res.status(200).json({
            status: true,
            listaDePizzas
          });
        })
        .catch(erro => {
          res.status(500).json({
            status: false,
            mensagem: "Erro ao tentar consultar as pizzas: " + erro.message
          });
        });
    } else {
      res.status(400).json({
        status: false,
        mensagem: "Requisição inválida. Método não permitido!"
      });
    }
  }
}
