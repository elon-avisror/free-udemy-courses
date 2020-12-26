import { LaunchOptions } from 'puppeteer';
import Subscribable from './puppeteer/Subscribable';
import SubscriberYoSamples from './puppeteer/SubscriberYoSamples';

const options: LaunchOptions = {
    headless: false,
    args: ['--window-size=1920,1080'],
    timeout: 999999  // almost disable timeout
};
const debug: boolean = true;

const subscriber: Subscribable = new SubscriberYoSamples();

(async () => {
    const response: boolean = await subscriber.subscribe(options, debug);
    if (response)
        console.info('Success!!!')
    else
        console.error('Failed!!!')
})();