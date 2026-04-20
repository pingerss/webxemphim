'use strict';

const router = require('express').Router();
const GenreController = require('../controllers/genre.controller');

router.get('/', GenreController.getAll);
router.get('/:id/movies', GenreController.getMoviesByGenre);

module.exports = router;
