import { Router } from "express";
import PizzaCtrl from "../Controllers/pizzaCtrl.js";

const rotaPizza = new Router();
const pizzaCtrl = new PizzaCtrl();

rotaPizza.get("/", (req, res) => pizzaCtrl.consultar(req, res))

export default rotaPizza;
