const reservationService = require('../services/reservationService');

exports.getAllreservation = async (req, res, next) => {
  try {
    const { parkingId } = req.params;
    const result = await reservationService.getAllReservations(parkingId, req.pagination);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getAllreservationById = async (req, res, next) => {
  try {
    const reservationId = parseInt(req.params.reservationId);
    const { parkingId } = req.params;
    const result = await reservationService.getReservationById(parkingId, reservationId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createReservation = async (req, res, next) => {
  try {
    const { parkingId } = req.params;
    const result = await reservationService.createReservation(parkingId, req.body, req.user?.userId);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateReservation = async (req, res, next) => {
  try {
    const { parkingId, reservationId } = req.params;
    const result = await reservationService.updateReservation(parkingId, reservationId, req.body, req.user?.userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteReservation = async (req, res, next) => {
  try {
    const { parkingId, reservationId } = req.params;
    const result = await reservationService.deleteReservation(parkingId, reservationId, req.user?.userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updatePartialReservation = async (req, res, next) => {
  try {
    const parkingId = parseInt(req.params.parkingId);
    const reservationId = parseInt(req.params.reservationId);
    const result = await reservationService.updatePartialReservation(parkingId, reservationId, req.body, req.user?.userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
