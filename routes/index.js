const express = require("express");

const router = express.Router();

const routes = [require("./user")];

router.use("/", routes);

module.exports = router;
