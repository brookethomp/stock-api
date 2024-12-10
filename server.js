const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Alpha Vantage API 
const STOCK_API_KEY = 'MM4A1R1XQ3HPX9LA';
const STOCK_API_URL = 'https://www.alphavantage.co/query';

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Process view
app.get('/process', async (req, res) => {
    const { query, type } = req.query;

    if (!query || !type) {
        return res.status(400).send('Invalid input. Please provide a query and type.');
    }

    try {
        const symbol = type === 'ticker' ? query : '';

        console.log(`Calling API for ${type}: ${query}`);
        const response = await axios.get(STOCK_API_URL, {
            params: {
                function: 'GLOBAL_QUOTE',
                symbol,
                apikey: STOCK_API_KEY,
            },
        });

        const data = response.data['Global Quote'];
        if (!data) {
            return res.send('<h1>No results found.</h1><a href="/">Back to Home</a>');
        }

        const resultHTML = `
            <p>
                <strong>Company Name:</strong> ${query}<br>
                <strong>Stock Ticker:</strong> ${data['01. symbol']}<br>
                <strong>Stock Price:</strong> $${parseFloat(data['05. price']).toFixed(2)}
            </p>
        `;

        res.send(`
            <h1>Search Results</h1>
            ${resultHTML}
            <a href="/">Back to Home</a>
        `);
    } catch (error) {
        console.error('Error retrieving data:', error.message);
        res.status(500).send('An error occurred while processing your request.');
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
