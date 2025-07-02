# mss-stock-data-source

Fetches data for the hard-coded tickers: `['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA']`  
from [Alpha Vantage](https://www.alphavantage.co), aggregates the results into a single JSON, gzips it, and uploads it to an S3 bucket.

## Features

- **Two modes of operation** (controlled by the `RUN_MODE` environment variable):
  - `ticks`: Fetches intraday time series data for all tickers and uploads as `magnificent7-ticks-<timestamp>.json.gz`
  - `fundamentals`: Fetches company overview (fundamentals) for all tickers and uploads as `magnificent7-fundamentals-<timestamp>.json.gz`
- Aggregates all results into a single gzipped JSON file per run.
- Uploads the gzipped file to the specified S3 bucket.

## Configuration

Set the following environment variables:

- `SHARED_DATA_BUCKET` - The target S3 bucket for uploads
- `ALPHAVANTAGE_API_KEY` - Your Alpha Vantage API key
- `AWS_REGION` - (Optional) AWS region for the S3 bucket (defaults to `eu-north-1`)
- `RUN_MODE` - (Optional) Set to `ticks` (default) or `fundamentals` to control which data is collected

## Usage

1. Install dependencies:
   ```sh
   npm install
   ```

2. Run locally (example for fundamentals):
   ```sh
   export SHARED_DATA_BUCKET=your-bucket
   export ALPHAVANTAGE_API_KEY=your-api-key
   export AWS_REGION=your-region
   export RUN_MODE=fundamentals
   node index.js
   ```

3. The Lambda handler will upload a gzipped JSON file to your S3 bucket.

## Notes

- When downloading files from S3 via the AWS Console, files with `Content-Encoding: gzip` may be automatically decompressed by your browser.
- When accessing files programmatically (AWS CLI/SDK), you will receive the gzipped file and must decompress it to access the JSON.