// index.js
const https = require('https');
const zlib = require('zlib');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const apiKey = process.env.ALPHAVANTAGE_API_KEY;
const s3Bucket = process.env.SHARED_BUILD_DATA_BUCKET;
const region = process.env.AWS_REGION || 'eu-north-1';

const tickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA'];

const s3Client = new S3Client({ region });

// This code fetches stock data for the specified tickers from Alpha Vantage,
// compresses it using gzip, and uploads it to an S3 bucket.

exports.handler = async function () {
  try {
    const results = {};

    for (const symbol of tickers) {
      const data = await fetchAlphaVantageData(symbol);
      results[symbol] = data;
    }

    const jsonString = JSON.stringify(results);
    const gzippedBuffer = zlib.gzipSync(jsonString);

    const fileName = `magnificent7-${new Date().toISOString()}.json.gz`;

    const putCommand = new PutObjectCommand({
      Bucket: s3Bucket,
      Key: fileName,
      Body: gzippedBuffer,
      ContentType: 'application/json',
      ContentEncoding: 'gzip',
    });

    await s3Client.send(putCommand);

    console.log(`Uploaded ${fileName} to bucket ${s3Bucket}`);
    return { statusCode: 200, body: `OK - ${fileName}` };
  } catch (err) {
    console.error('Error:', err);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};

async function fetchAlphaVantageData(symbol) {
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&interval=30min&symbol=${symbol}&apikey=${apiKey}`;
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let raw = '';
      res.on('data', (chunk) => raw += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          resolve(parsed);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}
