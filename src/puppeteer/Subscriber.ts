import * as puppeteer from 'puppeteer';
import Helper from '../utils/Helper';
import Subscribable from './Subscribable';

export default abstract class Subscriber implements Subscribable {
    private options: puppeteer.LaunchOptions;
    private browser: puppeteer.Browser;
    private page: puppeteer.Page;
    private debug: boolean;

    async subscribe(options: puppeteer.LaunchOptions, debug?: boolean): Promise<boolean> {
        this.options = options;
        this.debug = debug;

        await this.init(options);
        let response: boolean = false;
        try {
            response = await this.fetch();
        } catch (e) {
            this.printError(e);
        }
        this.stop();

        return response;
    }

    async init(options: puppeteer.LaunchOptions): Promise<void> {
        this.browser = await puppeteer.launch(options);
        this.page = await this.browser.newPage();

        if (this.debug)
            console.debug(this.constructor.name + ' has initialized...');
    }

    abstract fetch(): Promise<boolean>;

    async stop(): Promise<void> {
        await this.browser.close();

        if (this.debug)
            console.debug(this.constructor.name + ' has closed...');
    }

    getPage(): puppeteer.Page {
        return this.page;
    }

    private printError = (error: any): void => {
        if (error instanceof puppeteer.errors.TimeoutError)
            console.error(`${Helper.timeoutErrorMessage}\n${error}`);
        else {
            console.error(`${Helper.defaultErrorMessage}\n${error}`);
        }
    }
};