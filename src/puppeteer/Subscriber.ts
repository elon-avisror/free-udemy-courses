import * as puppeteer from 'puppeteer';
import * as dotenv from 'dotenv';
import Json from '../base/Json';
import Folder from '../util/Folder';
import { LaunchOptions } from 'puppeteer';
import { ErrorMessage } from '../enum/ErrorMessage';
import { Selector } from '../enum/Selector';
import { Button } from '../enum/Button';
import { Status } from '../enum/Status';

dotenv.config();
const {
    EMAIL,
    PASSWORD
} = process.env;

export default abstract class Subscriber implements SubscribeAble {
    private options: puppeteer.LaunchOptions;
    private browser: puppeteer.Browser;
    private pages: puppeteer.Page[];
    private debug: boolean;
    // Source
    private readonly udemy: string = 'https://www.udemy.com/join/login-popup/';
    // JSON
    private readonly json = new Json();
    private readonly folderer = new Folder();
    private processed: string[] = [];

    async run(options: puppeteer.LaunchOptions, debug?: boolean): Promise<boolean> {
        this.options = options;
        this.debug = debug;

        let response: boolean = false;

        await this.start();
        try {
            const courses: string[] = await this.login() && await this.fetch();
            response = await this.subscribe(courses);
        } catch (e) {
            this.printError(e);
        }
        await this.stop();

        return response;
    }

    private async start(): Promise<void> {
        this.browser = await puppeteer.launch(this.options);
        this.pages = await this.browser.pages();

        if (this.debug)
            console.debug(this.constructor.name + ' has been started...');
    }

    private async login(): Promise<boolean> {
        let status: boolean = false;
        try {
            const response = await this.pages[0].goto(this.udemy);
            if (!response?.ok()) {
                console.error(`${ErrorMessage.default}. The response is:  ${response}`);
            }

            await this.pages[0].$eval(Selector.emailInput, (input: HTMLInputElement, value: string) => input.value = value, EMAIL);
            await this.pages[0].$eval(Selector.passwordInput, (input: HTMLInputElement, value: string) => input.value = value, PASSWORD);
            await this.pages[0].$eval(Selector.loginSubmitButton, (button: HTMLButtonElement) => button !== null ? button.click() : console.error('Cannot find "Login" button'));
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

    abstract fetch(): Promise<string[]>;

    private async subscribe(courses: string[]): Promise<boolean> {
        let status: boolean = false;
        try {
            // Create a directory for today pictures
            const folder: string = await this.folderer.create();
            const subscribed: string[] = await this.json.read();

            // Filtering with subscribed courses
            const newCourses: Set<string> = new Set(courses.filter(function (course) {
                return this.indexOf(course) < 0;
            }, subscribed));

            // Then, for each new course
            for (const newCourse of newCourses) {
                // Go to this course link (with free coupon)
                const response: puppeteer.Response = await (await this.newPage()).goto(newCourse, { waitUntil: 'networkidle2' });
                if (!response?.ok()) {
                    console.error(`${ErrorMessage.default}. The response is:  ${response}.`);
                    return;
                }

                // Check if this course already exists in my udemy user
                let buttonName: string;
                let buttonSelector: string;
                try {
                    // Try type 1
                    buttonName = await this.getPage(2).$eval(
                        Selector.courseSubmitButton1,
                        (button: HTMLButtonElement) => button ? button.innerText : null
                    );
                    buttonSelector = Selector.courseSubmitButton1;
                } catch (e) {
                    try {
                        // Try type 2
                        buttonName = await this.getPage(2).$eval(
                            Selector.courseSubmitButton2,
                            (button: HTMLButtonElement) => button ? button.innerText : null
                        );
                        buttonSelector = Selector.courseSubmitButton2;
                    } catch (e) {
                        console.warn(`There is a new type of course submit button, see it in ${newCourse}`);
                    }
                }

                // Making a screenshot of this new course that was added to cart
                let courseStatus: Status;
                try {
                    const splitedUrl: string[] = newCourse.split('/');
                    const courseName: string = splitedUrl[splitedUrl.length - 2];
                    switch (buttonName) {
                        case Button.enrollNow:
                            await this.getPage(2).screenshot({ path: `${folder}/${Folder.enrolled}/${courseName}.png` });
                            await this.getPage(2).waitForSelector(buttonSelector);
                            // Wait for "Enroll now" button to show
                            await this.getPage(2).$eval(
                                buttonSelector,
                                (button: HTMLButtonElement) => button ? button.click() : console.error('There is no "Enroll now" button!')
                            );
                            // Wait for "Enroll now" submit button to show
                            await this.getPage(2).waitForSelector(Selector.enrollNowSubmitButton);
                            await this.getPage(2).$eval(
                                Selector.enrollNowSubmitButton,
                                (button: HTMLButtonElement) => button ? button.click() : console.error('There is no "Enroll now" submit button!')
                            );
                            // Wait for Udemy subscription approvement
                            await this.getPage(2).waitForSelector(Selector.enrolledWindow, { visible: true });
                            courseStatus = Status.subscribed;
                            break;
                        case Button.addToCart:
                            await this.getPage(2).screenshot({ path: `${folder}/${Folder.added}/${courseName}.png` });
                            // Wait for "Add to cart" button to show
                            await this.getPage(2).waitForSelector(Selector.addToCartButton);
                            await this.getPage(2).$eval(
                                Selector.addToCartButton,
                                (button: HTMLButtonElement) => button ? button.click() : console.error('There is no "Add to cart" button!')
                            );
                            // Wait for Udemy subscription approvement
                            await this.getPage(2).waitForSelector(Selector.addedToCartPopup, { visible: true });
                            courseStatus = Status.added;
                            break;
                        case Button.goToCourse:
                        case Button.buyNow:
                            await this.getPage(2).screenshot({ path: `${folder}/${Folder.exists}/${courseName}.png` });
                            courseStatus = Status.exists;
                            // Do nothing about this
                            break;
                        default:
                            console.warn(`There is a button status that we not recognized called ${buttonName}.`);
                            break;
                    }
                } catch (e) {
                    console.error(`Unable to have a screenshot of this ${newCourse} course.`);
                    throw e;
                }

                // Close tab
                this.processed.push(newCourse);
                if (this.debug)
                    console.debug(`course ${newCourse} ${courseStatus}.`);
                await this.closePage();
            }
            status = await this.json.save(this.processed);
        } catch (e) {
            // Save what we have achived so far
            await this.json.save(this.processed);
            console.error('Cannot manipulate courses list as expected.');
            throw e;
        }
        return status;
    }

    private async stop(): Promise<void> {
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

    private async closePage(): Promise<puppeteer.Page> {
        await this.pages[this.pages.length - 1].close();
        return this.pages.pop();
    }

    private printError(error: any): void {
        if (error instanceof puppeteer.errors.TimeoutError)
            console.error(`${ErrorMessage.timeout}\n${error}`);
        else {
            console.error(`${ErrorMessage.default}\n${error}`);
        }
    }
};

export interface SubscribeAble {
    run(options: LaunchOptions, debug?: boolean): Promise<boolean>;
};