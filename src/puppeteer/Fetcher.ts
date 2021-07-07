import * as puppeteer from 'puppeteer';
import { LauncherErrorMessage } from './Launcher';

export interface Fetcher {
    goto(page: puppeteer.Page): Promise<boolean>;
    fetch(page: puppeteer.Page): Promise<string[]>;
};

export default abstract class PuppeteerFetcher implements Fetcher {
    private readonly url: string;

    constructor(url: string) {
        this.url = url;
    }

    public getUrl(): string {
        return this.url;
    }

    async goto(page: puppeteer.Page): Promise<boolean> {
        let response: puppeteer.Response;
        try {
            // Go-to free source and record that session
            response = await page.goto(this.url, { waitUntil: 'load', timeout: 0 });
            if (!response?.ok()) {
                console.error(`${LauncherErrorMessage.default}. The response is:  ${response}.`);
            }
        } catch (e) {
            console.error(`Cannot getting to ${this.url} website.`);
            throw e;
        }
        return !!response;
    }

    abstract fetch(page: puppeteer.Page): Promise<string[]>;
};