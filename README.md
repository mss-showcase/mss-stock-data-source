# mss-stock-data-source

Takes the hard coded tickers ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA'];

Then download them from https://www.alphavantage.co 

Aggregate them into a single json then zip it and upload it to S3 bucket.

## configuration

Via environment variables:

 * SHARED_BUILD_DATA_BUCKET - the target S3 bucket
 * ALPHAVANTAGE_API_KEY - The aphavantage API key