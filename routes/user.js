const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();
const axios = require("axios");
const fs = require("fs");
const sharp = require("sharp");
const https = require("https");

const MeetingReport = require("../schemas/MeetingReportsSchema");
const MeetingTimestamp = require("../schemas/MeetingTimestampsSchema");
const StudentReport = require("../schemas/StudentReportSchema");

const User = require('../schemas/UserSchema');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');


router.post("/signup", async (req, res) => {
    const saltRounds = 10;
    try {
        const user = await User.findOne({ pid: req.body.pid });
        if (user) return res.status(400).send("Account already exists");

        // bcrypt encryption
        bcrypt.hash(req.body.password, saltRounds, async (err, hash) => {
            if (err) {
                console.log(err);
                res.status(500).send('Error generating hash');
            } else {
                const newUser = new User({
                    pid: req.body.pid,
                    email: req.body.email,
                    password: hash,
                    disability: req.body.disability
                });

                // save user here
                newUser.save()
                    .then(() => {
                        console.log('User created');
                        res.status(200).send(newUser);
                    })
                    .catch((err) => {
                        console.log(err);
                        res.status(500).send('Error saving user');
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
        // find user by PID or email
        const user = await User.findOne({ $or: [{ pid: req.body.pid }, { email: req.body.email }] });
        if (!user) return res.status(400).send("Account does not exist");

        // bcrypt password comparison
        bcrypt.compare(req.body.password, user.password, (err, result) => {
            if (err) {
                console.log(err);
                res.status(500).send('Error comparing passwords');
            } else if (result) {
                console.log('User logged in');
                res.status(200).send(user);
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