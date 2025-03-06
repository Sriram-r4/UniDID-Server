const express = require("express");
const router = express.Router();

const {
  createIdentity,
  getIdentities,
  getIdentity,
  deleteIdentity,
} = require("../controllers/identityController");

router.post("/:walletId/add", createIdentity);
router.get("/:walletId", getIdentities);
router.get("/:id", getIdentity);
router.delete("/:walletId/:id", deleteIdentity);

module.exports = router;
