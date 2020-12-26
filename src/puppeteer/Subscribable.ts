import { LaunchOptions } from 'puppeteer';

export default interface Subscribable {
    subscribe(options: LaunchOptions, debug?: boolean): Promise<boolean>;
};