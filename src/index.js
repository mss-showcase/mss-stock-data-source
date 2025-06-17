// index.js
import https from 'https';
import zlib from 'zlib';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const apiKey = process.env.ALPHAVANTAGE_API_KEY;
const dataBucket = process.env.SHARED_DATA_BUCKET;
const region = process.env.AWS_REGION || 'eu-north-1';
const mode = process.env.RUN_MODE || "default";

const tickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA'];

const s3Client = new S3Client({ region });

// Main Lambda handler
export const handler = async (event) => {
  if (mode === "fundamentals") {
    await collectFundamentals();
  } else if (mode === "ticks") {
    await collectTicksData();
  } else {
    throw new Error(`Unknown RUN_MODE: ${mode}`);
  }
};

// Collects realtime stock data (original handler logic)
async function collectTicksData() {
  try {
    const results = {};
    let totalTicks = 0;

    for (const symbol of tickers) {
      const { data, statusCode } = await fetchAlphaVantageData(symbol);

      // Log non-2xx/3xx responses
      if (!(statusCode >= 200 && statusCode < 400)) {
        console.warn(`Alpha Vantage response for ${symbol}: HTTP ${statusCode}`);
      }

      results[symbol] = data;

      // Count tick data if present
      const timeSeriesKey = Object.keys(data).find(k => k.startsWith('Time Series'));
      if (timeSeriesKey && data[timeSeriesKey]) {
        totalTicks += Object.keys(data[timeSeriesKey]).length;
      }
    }

    // Log aggregated tick count
    console.log(`Aggregated tick data fetched: ${totalTicks}`);

    const jsonString = JSON.stringify(results);
    const gzippedBuffer = zlib.gzipSync(jsonString);

    const fileName = `magnificent7-ticks-${new Date().toISOString()}.json.gz`;

    const putCommand = new PutObjectCommand({
      Bucket: dataBucket,
      Key: fileName,
      Body: gzippedBuffer,
      ContentType: 'application/json',
      ContentEncoding: 'gzip',
    });

    await s3Client.send(putCommand);

    console.log(`Uploaded ${fileName} to bucket ${dataBucket}`);
    return { statusCode: 200, body: `OK - ${fileName}` };
  } catch (err) {
    console.error('Error:', err);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
}

// Placeholder for fundamentals collection logic
async function collectFundamentals() {
  try {
    const results = {};

    for (const symbol of tickers) {
      const { data, statusCode } = await fetchAlphaVantageData(symbol, "OVERVIEW");

      // Log non-2xx/3xx responses
      if (!(statusCode >= 200 && statusCode < 400)) {
        console.warn(`Alpha Vantage OVERVIEW response for ${symbol}: HTTP ${statusCode}`);
      }

      results[symbol] = data;
    }

    const jsonString = JSON.stringify(results);
    const gzippedBuffer = zlib.gzipSync(jsonString);

    const fileName = `magnificent7-fundamentals-${new Date().toISOString()}.json.gz`;

    const putCommand = new PutObjectCommand({
      Bucket: dataBucket,
      Key: fileName,
      Body: gzippedBuffer,
      ContentType: 'application/json',
      ContentEncoding: 'gzip',
    });

    await s3Client.send(putCommand);

    console.log(`Uploaded ${fileName} to bucket ${dataBucket}`);
    return { statusCode: 200, body: `OK - ${fileName}` };
  } catch (err) {
    console.error('Error:', err);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
}

// Helper to fetch Alpha Vantage data for different functions
async function fetchAlphaVantageData(symbol, func = "TIME_SERIES_INTRADAY") {
  let url;
  if (func === "TIME_SERIES_INTRADAY") {
    url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&interval=30min&symbol=${symbol}&apikey=${apiKey}`;
  } else if (func === "OVERVIEW") {
    url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`;
  } else {
    throw new Error(`Unsupported Alpha Vantage function: ${func}`);
  }

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let raw = '';
      res.on('data', (chunk) => raw += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          resolve({ data: parsed, statusCode: res.statusCode });
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}
