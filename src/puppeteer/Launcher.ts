import * as puppeteer from 'puppeteer';

export default interface Launcher {
    newPage(): Promise<puppeteer.Page>;
    getPage(index: number): puppeteer.Page;
    closePage(): Promise<puppeteer.Page>;
};

export class PuppeteerLauncher implements Launcher {
    private options: puppeteer.LaunchOptions;
    private browser: puppeteer.Browser;
    private pages: puppeteer.Page[];

    constructor(options: puppeteer.LaunchOptions) {
        this.options = options;
    }

    async newPage(): Promise<puppeteer.Page> {
        return this.pages[this.pages.push(await this.browser.newPage()) - 1];
    }

    getPage(index: number): puppeteer.Page {
        return index > -1 && index < this.pages.length ? this.pages[index] : null;
    }

    async closePage(): Promise<puppeteer.Page> {
        await this.pages[this.pages.length - 1].close();
        return this.pages.pop();
    }

    async start(): Promise<void> {
        this.browser = await puppeteer.launch(this.options);
        this.pages = await this.browser.pages();
    }

    async stop(): Promise<void> {
        await this.browser.close();
    }
};

export enum LauncherErrorMessage {
    default = 'Something went wrong!',
    timeout = 'There was an timeout!'
};
