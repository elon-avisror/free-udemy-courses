import { LaunchOptions } from 'puppeteer';
import SubscriberAble from './puppeteer/SubscriberAble';
import SubscriberYoSamples from './puppeteer/SubscriberYoSamples';

const options: LaunchOptions = {
    headless: false,
    args: ['--window-size=1920,1080']
};
const debug: boolean = true;

const subscriber: SubscriberAble = new SubscriberYoSamples();

if (require.main === module) {
    (async () => {
        const response: boolean = await subscriber.subscribe(options, debug);
        if (response)
            console.info('Success!!!')
        else
            console.error('Failed!!!')
    })();
}