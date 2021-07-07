import { LaunchOptions } from 'puppeteer';
import { CronJob } from 'cron';
import Subscriber, { UdemySubscriber } from './puppeteer/Subscriber';
import Fetcher from './puppeteer/Fetcher';
import YoSamplesFetcher from './puppeteer/YoSamplesFetcher';
import CourseVaniaFetcher from './puppeteer/CourseVaniaFetcher';

// Puppeteer Launcher options and debug mode
const options: LaunchOptions = {
    headless: false,
    args: ['--no-sandbox', /*'--window-size=1920,1080'*/]
};
const debug: boolean = true;

// Fetchers & Subscriber initialization
const fetchers: Fetcher[] = [new YoSamplesFetcher(), new CourseVaniaFetcher()];
const subscriber: Subscriber = new UdemySubscriber(fetchers, debug);

// const job = new CronJob('0 4 23 * * *', () => {
//     const date: Date = new Date();
//     console.info(`Cron job for date ${date} has started...`);

if (require.main === module) {
    (async () => {
        await subscriber.run(options);
    })();
}

// }, null, true, "America/Los_Angeles");
// job.start();
