const express = require("express");
const router = express.Router();
const districtController = require("./../controller/districtController");

router.get("/", districtController.getAllDistricts);
router.post("/", districtController.createDistrict);
router.get("/:id", districtController.getDistrictById);
router.delete("/:id", districtController.deleteDistrict);

module.exports = router;
