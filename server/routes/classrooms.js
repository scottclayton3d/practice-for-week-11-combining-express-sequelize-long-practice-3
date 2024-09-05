// Instantiate router - DO NOT MODIFY
const express = require('express');
const router = express.Router();

// Import model(s)
const { Classroom } = require('../db/models');
const { Op } = require('sequelize');

// List of classrooms
router.get('/', async (req, res, next) => {
    let errorResult = { errors: [], count: 0, pageCount: 0 };

    // Phase 6B: Classroom Search Filters
    const where = {};

    // Name Filter
    if (req.query.name) {
        where.name = {
            [Sequelize.Op.iLike]: `%${req.query.name}%` // Case-insensitive match
        };
    }

    // Student Limit Filter
    if (req.query.studentLimit) {
        const limits = req.query.studentLimit.split(',');

        if (limits.length === 2) {
            const min = parseInt(limits[0]);
            const max = parseInt(limits[1]);

            if (isNaN(min) || isNaN(max) || min > max) {
                errorResult.errors.push({ message: 'Student Limit should be two integers: min,max' });
            } else {
                where.studentLimit = {
                    [Sequelize.Op.between]: [min, max]
                };
            }
        } else {
            const limit = parseInt(req.query.studentLimit);
            if (isNaN(limit)) {
                errorResult.errors.push({ message: 'Student Limit should be an integer' });
            } else {
                where.studentLimit = limit; // Exact match
            }
        }
    }

    // Phase 2C: Handle invalid params with "Bad Request" response
    if (errorResult.errors.length > 0) {
        // Include total count in error response
        errorResult.count = await Classroom.count(); // Total count of classrooms
        return res.status(400).json(errorResult);
    }

    // Continue with fetching classrooms...
    const classrooms = await Classroom.findAll({
        where,
        // Add any additional options like pagination, ordering, etc.
    });

    res.json(classrooms);
});

// Single classroom
router.get('/:id', async (req, res, next) => {
    try {
        const classroomId = req.params.id;

        const classroom = await Classroom.findByPk(classroomId, {
            include: [
                {
                    model: Supply,
                    attributes: ['id', 'name', 'category'], // Include only necessary attributes
                    order: [
                        ['category', 'ASC'], // Order supplies by category
                        ['name', 'ASC'] // Then order by name
                    ]
                },
                {
                    model: Student,
                    attributes: ['id', 'firstName', 'lastName'], // Include only necessary attributes
                    order: [
                        ['lastName', 'ASC'], // Order students by lastName
                        ['firstName', 'ASC'] // Then order by firstName
                    ]
                }
            ]
        });

        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        res.json(classroom);
    } catch (err) {
        next(err);
    }
});

// Export class - DO NOT MODIFY
module.exports = router;