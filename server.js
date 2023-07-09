const express = require("express")
const mongoose = require('mongoose')
const rateLimit = require('express-rate-limit');
const ShortUrl = require('./models/shortUrl')
const CONFIG = require("./config/config");
const QRCode = require('qrcode');
const connectToDb = require('./database/db');
const app = express()

require("dotenv").config();

app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended: false }))



//Creating a rate limiter 
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Maximum 100 requests per windowMs
})

app.use(limiter);

// Function to generate a random string of specified length
function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
  
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters.charAt(randomIndex);
    }
  
    return result;
  }

  
// QR CODE
async function generateQRcode(text) {
    try {
        const qrCodeURL = await QRCode.toDataURL(text);
        return qrCodeURL;
    } catch (error) {
        console.error('Failed to generate QR code:', error);
        return null;
    }
}

// Update the /shortUrls/:id/qrcode route to send the QR code image file
app.get('/shortUrls/:id/qrcode', async (req, res) => {
    const { id } = req.params;
    try {
        const shortUrl = await ShortUrl.findById(id);
        if (!shortUrl) {
            return res.sendStatus(404);
        }
        const qrCodeDataURL = await generateQRcode(shortUrl.full);
        if (!qrCodeDataURL) {
            return res.sendStatus(500);
        }

        // Convert the data URL to a Buffer
        const qrCodeImageBuffer = Buffer.from(qrCodeDataURL.split(',')[1], 'base64');

        // Set the response headers for image download
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `attachment; filename="qrcode.png"`);
        res.setHeader('Content-Length', qrCodeImageBuffer.length);

        // Send the image buffer as the response
        res.send(qrCodeImageBuffer);
    } catch (error) {
        res.status(500).send('Failed to generate QR code.');
    }
});


    

app.get('/', async (req, res) => {
    const shortUrls = await ShortUrl.find()
    res.render('index', { shortUrls: shortUrls})

})


app.get('/:shortUrl', async (req, res) => {
    const shortUrl = await ShortUrl.findOne({ short: req.params.shortUrl })
    if (shortUrl == null) return res.sendStatus(404)

    // Track analytics
    const analyticsData = {
        referer: req.headers.referer || 'Direct',
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
    };
    shortUrl.analytics.push(analyticsData);
    shortUrl.clicks++;
    await shortUrl.save();

    res.redirect(shortUrl.full)
})

  

app.post('/shortUrls', limiter, async (req, res) => {
    const { fullUrl, customUrl } = req.body;

    // Check if the custom URL is provided
    if (customUrl) {
        // Check if the custom URL is already taken
        const existingShortUrl = await ShortUrl.findOne({ short: customUrl });
        if (existingShortUrl) {
            return res.status(400).send('Custom URL is already taken.');
        }
    }

    // Create a new short URL document
    const shortUrl = new ShortUrl({
        full: fullUrl,
        short: customUrl || generateRandomString(6), // If custom URL not provided, generate a random short URL
        clicks: 0
    });

    try {
        await shortUrl.save();
        res.redirect('/');
    } catch (error) {
        res.status(500).send('Failed to create short URL.');
    }
});

// Adding a new route to handle deleting a short URL
app.delete('/shortUrls/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await ShortUrl.findByIdAndDelete(id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).send('Failed to delete the short URL.');
    }
  });
  


connectToDb()

app.listen(CONFIG.PORT, () => {
    console.log(`Server started on http://localhost:${CONFIG.PORT}`)
})

module.exports = { generateQRcode, generateRandomString }