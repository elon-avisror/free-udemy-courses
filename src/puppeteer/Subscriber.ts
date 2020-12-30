import * as puppeteer from 'puppeteer';
import * as dotenv from 'dotenv';
import Helper from '../util/Helper';
import SubscriberAble from './SubscriberAble';

dotenv.config();
const {
    EMAIL,
    PASSWORD
} = process.env;

export default abstract class Subscriber implements SubscriberAble {
    private options: puppeteer.LaunchOptions;
    private browser: puppeteer.Browser;
    private pages: puppeteer.Page[];
    private debug: boolean;
    private readonly udemy: string = 'https://www.udemy.com/join/login-popup/';
    // Selectors
    private readonly EMAIL_INPUT: string = '#email--1';
    private readonly PASSWORD_INPUT: string = '#id_password';
    private readonly LOGIN_BUTTON: string = '#submit-id-submit';

    async subscribe(options: puppeteer.LaunchOptions, debug?: boolean): Promise<boolean> {
        this.options = options;
        this.debug = debug;

        let response: boolean = false;
        await this.start();
        try {
            response = await this.login() && await this.fetch();
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

    async login(): Promise<boolean> {
        let status: boolean = false;
        try {
            const response = await this.pages[0].goto(this.udemy);
            if (!response?.ok()) {
                console.error(`${Helper.defaultErrorMessage}. The response is:  ${response}`);
            }

            await this.pages[0].$eval(this.EMAIL_INPUT, (input: HTMLInputElement, value: string) => input.value = value, EMAIL);
            await this.pages[0].$eval(this.PASSWORD_INPUT, (input: HTMLInputElement, value: string) => input.value = value, PASSWORD);
            await this.pages[0].$eval(this.LOGIN_BUTTON, (button: HTMLButtonElement) => button !== null ? button.click() : console.error('Cannot find "Login" button'));
            status = true;

            if (this.debug) {
                console.debug(this.constructor.name + ' has been successfuly logged-in to udemy...');
            }
        } catch (e) {
            console.error(`Cannot getting to ${this.udemy} website.`);
            throw e;
        }
        return status;
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

    isDebugEnabled(): boolean {
        return this.debug;
    }
};