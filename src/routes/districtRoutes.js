const express = require("express");
const router = express.Router();
const districtController = require("./../controller/districtController");

router.get("/", districtController.getAllDistricts);
router.post("/", districtController.createDistrict);
router.post("/bulk", districtController.bulkCreateDistricts);
router.get("/:id", districtController.getDistrictById);
router.put("/:id", districtController.updateDistrict);
router.delete("/:id", districtController.deleteDistrict);

module.exports = router;
