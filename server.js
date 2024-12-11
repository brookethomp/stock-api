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
        if (type === 'ticker') {
            // Search by stock ticker
            console.log(`Calling API for ticker: ${query}`);
            const response = await axios.get(STOCK_API_URL, {
                params: {
                    function: 'GLOBAL_QUOTE',
                    symbol: query,
                    apikey: STOCK_API_KEY,
                },
            });

            const data = response.data['Global Quote'];
            if (!data || Object.keys(data).length === 0) {
                return res.send('<h1>No results found for the ticker.</h1><a href="/">Back to Home</a>');
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

        } else if (type === 'company') {
            // Search by company name
            console.log(`Calling API for company name: ${query}`);
            const response = await axios.get(STOCK_API_URL, {
                params: {
                    function: 'SYMBOL_SEARCH',
                    keywords: query,
                    apikey: STOCK_API_KEY,
                },
            });

            const matches = response.data.bestMatches;
            if (!matches || matches.length === 0) {
                return res.send('<h1>No results found for the company name.</h1><a href="/">Back to Home</a>');
            }

            const resultHTML = matches.map(match => `
                <p>
                    <strong>Company Name:</strong> ${match['2. name']}<br>
                    <strong>Stock Ticker:</strong> ${match['1. symbol']}<br>
                    <strong>Region:</strong> ${match['4. region']}
                </p>
            `).join('');

            res.send(`
                <h1>Search Results</h1>
                ${resultHTML}
                <a href="/">Back to Home</a>
            `);
        } else {
            res.status(400).send('Invalid type. Please use "ticker" or "company" as the type.');
        }
    } catch (error) {
        console.error('Error retrieving data:', error.message);
        res.status(500).send('An error occurred while processing your request.');
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
