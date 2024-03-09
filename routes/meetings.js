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




router.post("/create_meeting", async (req, res) => {
    try {
        const newMeeting = new MeetingReport({
            meet_id: req.body.meet_id,
            host_id: req.body.host_id,
            title: req.body.title,
            description: req.body.description,
            startTime: req.body.startTime,
            endTime: "",
            host_name: req.body.host_name
        });

        // save meeting here
        newMeeting.save()
            .then(() => {
                console.log('Meeting created');
                res.status(200).send(newMeeting);
            })
            .catch((err) => {
                console.log(err);
                res.status(500).send('Error saving meeting');
            });
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
});

module.exports = router;

