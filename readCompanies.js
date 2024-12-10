const fs = require('fs');
const { MongoClient } = require('mongodb');

// MongoDB connection URI
const uri = "mongodb+srv://stockuser:Stocks123@cluster0.smdvj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// File path for the CSV
const filePath = './companies.csv';

async function run() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db('Stock');
        const collection = db.collection('PublicCompanies');

        await collection.deleteMany({});
        console.log('Cleared existing data in the PublicCompanies collection.');

        const data = fs.readFileSync(filePath, 'utf8');
        const lines = data.split('\n');

        for (let line of lines) {
            if (!line.trim()) continue;
            const [companyName, stockTicker, stockPrice] = line.split(',');

            await collection.insertOne({
                companyName: companyName.trim(),
                stockTicker: stockTicker.trim(),
                stockPrice: parseFloat(stockPrice.trim()),
            });
            console.log(`Inserted: ${companyName} (${stockTicker}) - $${stockPrice}`);
        }

        console.log('All data inserted successfully.');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
        console.log('Connection to MongoDB closed.');
    }
}

run();
