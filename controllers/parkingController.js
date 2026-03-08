const parkingService = require('../services/parkingService');

exports.getAllParkings = async (req, res, next) => {
  try {
    const result = await parkingService.getAllParkings(req.pagination);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getParkingById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.parkingId);
    const result = await parkingService.getParkingById(id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createParking = async (req, res, next) => {
  try {
    const { name, city } = req.body;
    const result = await parkingService.createParking(name, city, req.user?.userId);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateParking = async (req, res, next) => {
  try {
    const id = parseInt(req.params.parkingId);
    const { name, city } = req.body;
    const result = await parkingService.updateParking(id, name, city, req.user?.userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteParking = async (req, res, next) => {
  try {
    const id = parseInt(req.params.parkingId);
    const result = await parkingService.deleteParking(id, req.user?.userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updatePartialParking = async (req, res, next) => {
  try {
    const id = parseInt(req.params.parkingId);
    const result = await parkingService.updatePartialParking(id, req.body, req.user?.userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};