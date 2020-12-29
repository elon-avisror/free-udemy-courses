import * as puppeteer from 'puppeteer';
import Helper from '../util/Helper';
import SubscriberAble from './SubscriberAble';

export default abstract class Subscriber implements SubscriberAble {
    private options: puppeteer.LaunchOptions;
    private browser: puppeteer.Browser;
    private pages: puppeteer.Page[];
    private debug: boolean;

    async subscribe(options: puppeteer.LaunchOptions, debug?: boolean): Promise<boolean> {
        this.options = options;
        this.debug = debug;

        await this.start();
        let response: boolean = false;
        try {
            response = await this.fetch();
        } catch (e) {
            this.printError(e);
        }
        await this.stop();

        return response;
    }

    async start(): Promise<void> {
        this.browser = await puppeteer.launch(this.options);
        this.pages = await this.browser.pages();

        if (this.debug)
            console.debug(this.constructor.name + ' has been started...');
    }

    abstract fetch(): Promise<boolean>;

    async stop(): Promise<void> {
        await this.browser.close();

        if (this.debug)
            console.debug(this.constructor.name + ' has been closed...');
    }

    getPage(index: number): puppeteer.Page {
        return index > -1 && index < this.pages.length ? this.pages[index] : null;
    }

    async newPage(): Promise<puppeteer.Page> {
        return this.pages[this.pages.push(await this.browser.newPage()) - 1];
    }

    async closePage(): Promise<puppeteer.Page> {
        await this.pages[this.pages.length - 1].close();
        return this.pages.pop();
    }

    private printError(error: any): void {
        if (error instanceof puppeteer.errors.TimeoutError)
            console.error(`${Helper.timeoutErrorMessage}\n${error}`);
        else {
            console.error(`${Helper.defaultErrorMessage}\n${error}`);
        }
    }
};