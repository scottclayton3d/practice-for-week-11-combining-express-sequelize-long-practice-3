// Instantiate router - DO NOT MODIFY
const express = require('express');
const router = express.Router();

// Import model(s)
const { Supply } = require('../db/models');
const Sequelize = require('sequelize');

// List of supplies by category
router.get('/category/:categoryName', async (req, res, next) => {
    try {
        const { categoryName } = req.params;
        const normalizedCategory = categoryName.charAt(0).toUpperCase() + categoryName.slice(1).toLowerCase(); // Normalize to Title Case
        console.log(`Querying supplies for category: ${categoryName}`);
        const supplies = await Supply.findAll({
            where: { category: normalizedCategory },
            order: [
                // Custom ordering logic for specific categories
                [Sequelize.literal(`CASE 
                    WHEN name = 'Glue Stick' THEN 0 
                    WHEN name = 'Transparent Tape' THEN 1 
                    ELSE 2 END`), 'ASC'], // For Pasting category
                ['handed', 'ASC'], // Order by handedness
                ['name', 'ASC'] // Order by name
            ]
        });
        res.json(supplies);
    } catch (err) {
        next(err);
    }
});

// Scissors Supply Calculation - Business Logic Goes Here!
router.get('/scissors/calculate', async (req, res, next) => {
    let result = {};

    try {
        // Phase 10A: Current number of scissors in all classrooms
        result.numRightyScissors = await Supply.count({
            where: {
                name: 'Safety Scissors',
                handed: 'right'
            }
        });

        result.numLeftyScissors = await Supply.count({
            where: {
                name: 'Safety Scissors',
                handed: 'left'
            }
        });

        result.totalNumScissors = result.numRightyScissors + result.numLeftyScissors;

        // Phase 10B: Total number of right-handed and left-handed students in all classrooms
        result.numRightHandedStudents = await Student.count({
            include: [{
                model: Classroom,
                through: { attributes: [] }, // Exclude join table attributes
                where: { handed: 'right' } // Assuming 'handed' is a property in the StudentClassroom model
            }]
        });

        result.numLeftHandedStudents = await Student.count({
            include: [{
                model: Classroom,
                through: { attributes: [] },
                where: { handed: 'left' }
            }]
        });

        // Phase 10C: Total number of scissors still needed for all classrooms
        const totalRightHandedStudents = result.numRightHandedStudents;
        const totalLeftHandedStudents = result.numLeftHandedStudents;

        result.numRightyScissorsStillNeeded = Math.max(0, totalRightHandedStudents - result.numRightyScissors);
        result.numLeftyScissorsStillNeeded = Math.max(0, totalLeftHandedStudents - result.numLeftyScissors);

        res.json(result);
    } catch (err) {
        next(err);
    }
});

// Export class - DO NOT MODIFY
module.exports = router;