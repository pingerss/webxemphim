'use strict';

const router = require('express').Router();
const ActorController = require('../controllers/actor.controller');

router.get('/', ActorController.getAll);
router.get('/:id', ActorController.getById);

module.exports = router;
