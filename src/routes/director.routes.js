'use strict';

const router = require('express').Router();
const DirectorController = require('../controllers/director.controller');

router.get('/', DirectorController.getAll);
router.get('/:id', DirectorController.getById);

module.exports = router;
