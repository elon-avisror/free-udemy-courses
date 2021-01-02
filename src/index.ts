import { LaunchOptions } from 'puppeteer';
import Subscriber from './puppeteer/Subscriber';
import YoSamplesSubscriber from './puppeteer/YoSamplesSubscriber';

const options: LaunchOptions = {
    headless: false,
    args: ['--window-size=1920,1080']
};
const debug: boolean = true;

const subscriber: Subscriber = new YoSamplesSubscriber();

if (require.main === module) {
    (async () => {
        const response: boolean = await subscriber.run(options, debug);
        if (response)
            console.info('Success!!!')
        else
            console.error('Failed!!!')
    })();
}