'use strict';

const router = require('express').Router();
const ComboController = require('../controllers/combo.controller');

router.get('/', ComboController.getAll);
router.get('/:id', ComboController.getById);

module.exports = router;
