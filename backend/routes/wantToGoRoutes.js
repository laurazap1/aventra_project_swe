const express = require("express");
const { add } = require("../controllers/wantToGoController");
const { list } = require("../controllers/wantToGoController");

const router = express.Router();

router.post("/add", add);
router.get("/list", list);

module.exports = router;
