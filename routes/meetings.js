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

// const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

//Chris's account
const accountSid = 'AC556c5f29a1a095c7798a52f873c90836';
const authToken = 'c1dd61de8ad045e63ed630379cf4c892';


const client = require('twilio')(accountSid, authToken);

function sendWhatsappMessage(teacherName, topic, code) {
    const msg = `Hello *Chris*,
*${teacherName}* has recently scheduled a new meeting for your upcoming lecture on ${topic}. To join the lecture, please use the code *${code}* or click on the provided link below.

Meeting Link: https://moodlensclient.web.app/room/${code}

Happy learning!`

    client.messages
        .create({
            body: msg,
            from: 'whatsapp:+14155238886',
            to: 'whatsapp:+919637261594'
        })
        .then(message => console.log(message.sid));
}

router.get('/fire', async (req, res) => {
    try {
        // Call the sendWhatsappMessage function
        sendWhatsappMessage('Mustafiz', 'AI', '8132');

        res.status(200).json("Successfully fired SOS!")
    } catch (err) {
        console.log("The err", err.message)
        res.status(500).json(err.message);
    }
});













router.post("/create_meeting", async (req, res) => {
    try {
        // Generate a random 4-digit code
        let meet_id = generateRandomCode();

        // Check if a meeting with the same meet_id already exists
        let existingMeeting = await MeetingReport.findOne({ meet_id: meet_id });

        // If a meeting with the same meet_id exists, generate a new code
        while (existingMeeting) {
            meet_id = generateRandomCode();
            existingMeeting = await MeetingReport.findOne({ meet_id: meet_id });
        }

        // Create the new meeting
        const newMeeting = new MeetingReport({
            meet_id: meet_id,
            host_id: req.body.host_id,
            title: req.body.title,
            description: req.body.description,
            startTime: req.body.startTime,
            endTime: "",
            host_name: req.body.host_name
        });

        // Save the new meeting to the database
        await newMeeting.save();

        try {
            // Call the sendWhatsappMessage function
            sendWhatsappMessage(req.body.host_name, req.body.title, meet_id);
            console.log("Successfully sent whatsapp message!")
        } catch (err) {
            console.log("The err", err.message)
        }

        // Send the meet_id in the response
        res.json({ meet_id: meet_id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

function generateRandomCode() {
    return Math.floor(1000 + Math.random() * 9000); // Generate a random 4-digit number
}



router.post('/join_meeting', async (req, res) => {
    try {
        const meeting = await MeetingReport.findOne({ meet_id: req.body.meet_id });
        if (!meeting) {
            return res.status(400).json({ message: 'Meeting not found' });
        }

        if (meeting.endTime === '') {
            return res.status(200).json({ message: 'The meeting is currently happening', success: true });
        } else {
            return res.status(200).json({ message: 'The meeting has ended', success: false });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server error' });
    }
});

router.post('/end_meeting', async (req, res) => {
    try {
        const { meet_id, endTime } = req.body;
        const meeting = await MeetingReport.findOne({ meet_id: meet_id });
        if (!meeting) {
            return res.status(400).json({ message: 'Meeting not found' });
        }

        meeting.endTime = endTime;
        await meeting.save();

        return res.json({ message: 'Meeting ended successfully', meeting });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});




module.exports = router;

