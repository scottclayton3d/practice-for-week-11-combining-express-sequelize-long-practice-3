// Instantiate router - DO NOT MODIFY
const express = require('express');
const router = express.Router();

// Import model(s)
const { Student } = require('../db/models');
const { Op } = require("sequelize");

// List
router.get('/', async (req, res, next) => {
    let errorResult = { errors: [], count: 0, pageCount: 0 };

    // Phase 4: Student Search Filters
    const where = {};

    // First Name Filter
    if (req.query.firstName) {
        where.firstName = {
            [Sequelize.Op.iLike]: `%${req.query.firstName}%` // Case-insensitive match
        };
    }

    // Last Name Filter
    if (req.query.lastName) {
        where.lastName = {
            [Sequelize.Op.iLike]: `%${req.query.lastName}%` // Case-insensitive match
        };
    }

    // Lefty Filter
    if (req.query.lefty) {
        if (req.query.lefty === 'true') {
            where.leftHanded = true;
        } else if (req.query.lefty === 'false') {
            where.leftHanded = false;
        } else {
            errorResult.errors.push({ message: 'Lefty should be either true or false' });
        }
    }

    // Phase 2C: Handle invalid params with "Bad Request" response
    if (errorResult.errors.length > 0) {
        // Include total student count in the response even if params were invalid
        errorResult.count = await Student.count(); // Total count of students
        return res.status(400).json(errorResult);
    }

    // Continue with pagination and fetching students...
    let page = parseInt(req.query.page) || 1; // Default to 1
    let size = parseInt(req.query.size) || 10; // Default to 10
    let limit = size;
    let offset = (page - 1) * size;

    const result = {};
    result.rows = await Student.findAll({
        attributes: ['id', 'firstName', 'lastName', 'leftHanded'],
        where,
        limit,
        offset,
        order: [
            ['lastName', 'ASC'],
            ['firstName', 'ASC']
        ]
    });

    // Add total count and page information to the result
    result.count = await Student.count({ where }); // Total number of unpaginated results
    result.page = page; // Current page
    result.pageCount = Math.ceil(result.count / size); // Total number of pages

    res.json(result);
});

// Export class - DO NOT MODIFY
module.exports = router;