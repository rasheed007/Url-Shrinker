const mongoose = require('mongoose')
const shortId = require('shortid')

const shortUrlSchema = new mongoose.Schema({
    full: {
        type: String,
        required: true
    },
    short: {
        type: String,
        required: true,
        default: shortId.generate
    },
    clicks: {
        type: Number,
        required: true,
        default: 0
    },
    analytics: [
        {
            timestamp: { type: Date, default: Date.now },
            referer: { type: String },
            userAgent: { type: String },
            ipAddress: { type: String }
        }
    ]
})

module.exports = mongoose.model('ShortUrl', shortUrlSchema)