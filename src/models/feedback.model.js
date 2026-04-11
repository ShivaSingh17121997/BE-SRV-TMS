const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            default: "Anonymous"
        },
        rating: { // Q1
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        teachingQuality: { // Q2
            type: String,
            required: true,
        },
        whatTheyLike: [ // Q3
            {
                type: String,
            }
        ],
        improvement: { // Q4
            type: String,
            required: true,
        },
        comment: { // Q5
            type: String,
            trim: true,
        },
        ipAddress: {
            type: String,
        }
    },
    {
        timestamps: true,
    }
);

const Feedback = mongoose.model('Feedback', feedbackSchema);
module.exports = Feedback;
