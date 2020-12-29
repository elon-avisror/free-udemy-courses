import { LaunchOptions } from 'puppeteer';

export default interface SubscriberAble {
    subscribe(options: LaunchOptions, debug?: boolean): Promise<boolean>;
};