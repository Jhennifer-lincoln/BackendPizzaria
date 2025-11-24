import { Router } from "express";
import DialogFlowCtrl from "../Controllers/dialogFlowCtrl.js";
const rotaDialogFlow = new Router();
const dialogFlowCtrl = new DialogFlowCtrl();

rotaDialogFlow.post("/", dialogFlowCtrl.processarIntencoes);
export default rotaDialogFlow;
