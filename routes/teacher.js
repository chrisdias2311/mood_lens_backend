const express = require('express');
const Teacher = require('../schemas/TeacherSchema');
const router = express.Router();
const bcrypt = require('bcrypt');

router.post("/signup", async (req, res) => {
    const saltRounds = 10;
    try {
        const teacher = await Teacher.findOne({ host_id: req.body.host_id });
        if (teacher) return res.status(400).send("Account already exists");

        // bcrypt encryption
        bcrypt.hash(req.body.password, saltRounds, async (err, hash) => {
            if (err) {
                console.log(err);
                res.status(500).send('Error generating hash');
            } else {
                const newTeacher = new Teacher({
                    host_id: req.body.host_id,
                    email: req.body.email,
                    password: hash
                });

                // save teacher here
                newTeacher.save()
                    .then(() => {
                        console.log('Teacher created');
                        res.status(200).send(newTeacher);
                    })
                    .catch((err) => {
                        console.log(err);
                        res.status(500).send('Error saving teacher');
                    });
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
});


router.post("/login", async (req, res) => {
    try {
        // find teacher by host_id or email
        const teacher = await Teacher.findOne({ $or: [{ host_id: req.body.host_id }, { email: req.body.email }] });
        if (!teacher) return res.status(400).send("Account does not exist");

        // bcrypt password comparison
        bcrypt.compare(req.body.password, teacher.password, (err, result) => {
            if (err) {
                console.log(err);
                res.status(500).send('Error comparing passwords');
            } else if (result) {
                console.log('Teacher logged in');
                res.status(200).send(teacher);
            } else {
                res.status(400).send('Incorrect password');
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
});

module.exports = router;

