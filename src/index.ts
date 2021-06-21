import { LaunchOptions } from 'puppeteer';
import { CronJob } from 'cron';
import Subscriber from './puppeteer/Subscriber';
import YoSamplesSubscriber from './puppeteer/YoSamplesSubscriber';

const options: LaunchOptions = {
    headless: false,
    args: ['--no-sandbox', /*'--window-size=1920,1080'*/]
};

const debug: boolean = true;

// TODO: read from implemented subscribers directory
function getSubscribers(): Subscriber[] {
    return [new YoSamplesSubscriber()];
}

const subscribers: Subscriber[] = getSubscribers();

// const job = new CronJob('0 4 23 * * *', () => {
//     const date: Date = new Date();
//     console.info(`Cron job for date ${date} has started...`);

if (require.main === module) {
    for (const subscriber of subscribers) {
        (async () => {
            const response: boolean = await subscriber.run(options, debug);
            const msg = response ? 'Succeeded' : 'Failed';
            console.log(`The ${subscriber.constructor.name} ended with status ${msg}.`);
        })();
    }
}

// }, null, true, "America/Los_Angeles");
// job.start();
