import { LinkedInScraper } from './build/linkedin/scraper.js';

const scraper = new LinkedInScraper();

async function test() {
  try {
    const profile = await scraper.extractProfile('https://www.linkedin.com/in/gaelthome/');
    console.log('Raw data:', JSON.stringify(profile._rawData, null, 2));
    console.log('\nTransformed data:', JSON.stringify(profile, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
