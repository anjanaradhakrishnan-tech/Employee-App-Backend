
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// Task 1: Initiate app and run server at port 3000
const app = express();
const PORT = 3000;

app.use(express.json());

// Keep the provided frontend build unchanged
app.use(express.static(path.join(__dirname, 'dist', 'Frontend')));

// Task 2: Create MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('MongoDB Atlas connected successfully');

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error.message);
    });

// Employee schema: structure of each employee document
const employeeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    position: {
        type: String,
        required: true,
        trim: true
    },
    salary: {
        type: Number,
        required: true,
        min: 0
    }
});

const Employee = mongoose.model('Employee', employeeSchema);

// GET API: Retrieve all employees
app.get('/api/employeelist', async (req, res) => {
    try {
        const employees = await Employee.find();
        res.status(200).json(employees);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Unable to retrieve employees' });
    }
});

// GET API: Retrieve one employee by ID
app.get('/api/employeelist/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid employee ID' });
        }

        const employee = await Employee.findById(id);

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.status(200).json(employee);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Unable to retrieve employee' });
    }
});

// POST API: Add a new employee
// Request body: { name, location, position, salary }
app.post('/api/employeelist', async (req, res) => {
    try {
        const { name, location, position, salary } = req.body;

        if (
            typeof name !== 'string' || !name.trim() ||
            typeof location !== 'string' || !location.trim() ||
            typeof position !== 'string' || !position.trim() ||
            salary === undefined || salary === null || salary === ''
        ) {
            return res.status(400).json({
                message: 'Please provide name, location, position and salary'
            });
        }

        const numericSalary = Number(salary);

        if (!Number.isFinite(numericSalary) || numericSalary < 0) {
            return res.status(400).json({
                message: 'Salary must be a valid non-negative number'
            });
        }

        const employee = new Employee({
            name: name.trim(),
            location: location.trim(),
            position: position.trim(),
            salary: numericSalary
        });

        const savedEmployee = await employee.save();
        res.status(201).json(savedEmployee);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Unable to add employee' });
    }
});

// DELETE API: Delete one employee by ID
app.delete('/api/employeelist/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid employee ID' });
        }

        const deletedEmployee = await Employee.findByIdAndDelete(id);

        if (!deletedEmployee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.status(200).json({
            message: 'Employee deleted successfully',
            employee: deletedEmployee
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Unable to delete employee' });
    }
});

// PUT API: Update one employee using its ID in the request body
app.put('/api/employeelist', async (req, res) => {
    try {
        const { _id, id, name, location, position, salary } = req.body;
        const employeeId = _id || id;

        if (!employeeId || !mongoose.isValidObjectId(employeeId)) {
            return res.status(400).json({
                message: 'A valid employee ID is required'
            });
        }

        const updates = {};

        if (name !== undefined) {
            if (typeof name !== 'string' || !name.trim()) {
                return res.status(400).json({ message: 'Invalid name' });
            }
            updates.name = name.trim();
        }

        if (location !== undefined) {
            if (typeof location !== 'string' || !location.trim()) {
                return res.status(400).json({ message: 'Invalid location' });
            }
            updates.location = location.trim();
        }

        if (position !== undefined) {
            if (typeof position !== 'string' || !position.trim()) {
                return res.status(400).json({ message: 'Invalid position' });
            }
            updates.position = position.trim();
        }

        if (salary !== undefined) {
            if (
                salary === '' ||
                !Number.isFinite(Number(salary)) ||
                Number(salary) < 0
            ) {
                return res.status(400).json({ message: 'Invalid salary' });
            }
            updates.salary = Number(salary);
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                message: 'Provide at least one field to update'
            });
        }

        const updatedEmployee = await Employee.findByIdAndUpdate(
            employeeId,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!updatedEmployee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.status(200).json(updatedEmployee);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Unable to update employee' });
    }
});

// Keep the original frontend fallback
app.get('/*', function (req, res) {
    res.sendFile(path.join(__dirname + '/dist/Frontend/index.html'));
});
