import express from "express";
const routes = express.Router();

import BillingController from "./controllers/BillingController";

routes.get('/billing/dynamicInvoice', BillingController.changeEncoding);

module.exports = routes;