const express = require("express");
const parkingController = require("../controllers/parkingController");

const router = express.Router();

router.get("/", parkingController.getAllParkings);
router.get("/:id", parkingController.getParkingById);
router.post("/", parkingController.createParking);
router.put("/:id", parkingController.updateParking);
router.delete("/:id", parkingController.deleteParking);

module.exports = router;