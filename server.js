const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const axios = require('axios');
const path = require('path');

// MongoDB connection
const uri = "mongodb+srv://stockuser:Stocks123@cluster0.smdvj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true })); // Parse form data
app.use(express.static(path.join(__dirname, 'public')));

let collection;

// Alpha Vantage API configuration
const STOCK_API_KEY = 'MM4A1R1XQ3HPX9LA';
const STOCK_API_URL = 'https://www.alphavantage.co/query';

// Connect to MongoDB
client.connect().then(() => {
    const db = client.db('Stock');
    collection = db.collection('PublicCompanies');
    console.log('Connected to MongoDB');
}).catch(err => console.error('Failed to connect to MongoDB:', err));

// Home view (form)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Process view with dynamic stock price retrieval
app.get('/process', async (req, res) => {
    const { query, type } = req.query;

    if (!query || !type) {
        return res.status(400).send('Invalid input. Please provide a query and type.');
    }

    try {
        const searchKey = type === 'ticker' ? 'stockTicker' : 'companyName';
        const results = await collection.find({ [searchKey]: { $regex: query, $options: 'i' } }).toArray();

        if (results.length === 0) {
            return res.send('<h1>No results found.</h1><a href="/">Back to Home</a>');
        }

        const updatedResults = await Promise.all(
            results.map(async (result) => {
                if (type === 'ticker') {
                    try {
                        console.log(`Calling API for ticker: ${result.stockTicker}`);

                        const response = await axios.get(STOCK_API_URL, {
                            params: {
                                function: 'GLOBAL_QUOTE',
                                symbol: result.stockTicker,
                                apikey: STOCK_API_KEY,
                            },
                        });

                        console.log('API Response:', response.data);

                        const currentPrice = response.data['Global Quote']?.['05. price'];

                        if (currentPrice) {
                            console.log(`Live price fetched: ${currentPrice}`);
                            await collection.updateOne(
                                { stockTicker: result.stockTicker },
                                { $set: { stockPrice: parseFloat(currentPrice) } }
                            );
                            return { ...result, stockPrice: currentPrice };
                        }
                    } catch (error) {
                        console.warn(`Failed to fetch live price for ${result.stockTicker}: ${error.message}`);
                    }
                }
                return result;
            })
        );

        const resultHTML = updatedResults.map(result => `
            <p>
                <strong>Company Name:</strong> ${result.companyName}<br>
                <strong>Stock Ticker:</strong> ${result.stockTicker}<br>
                <strong>Stock Price:</strong> $${parseFloat(result.stockPrice).toFixed(2)}
            </p>
        `).join('');

        res.send(`
            <h1>Search Results</h1>
            ${resultHTML}
            <a href="/">Back to Home</a>
        `);
    } catch (error) {
        console.error('Error retrieving data:', error);
        res.status(500).send('An error occurred while processing your request.');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
