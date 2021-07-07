import * as dotenv from 'dotenv';
import * as puppeteer from 'puppeteer';
import ImageFolderHandler, { FolderHandler } from '../util/ImageFolderHandler';
import Fetcher from './Fetcher';
import { PuppeteerLauncher, LauncherErrorMessage } from './Launcher';
import JsonFileHandler, { FileHandler } from '../util/JsonFileHandler';

dotenv.config();
const {
    EMAIL,
    PASSWORD
} = process.env;

export default interface Subscriber {
    run(options: puppeteer.LaunchOptions): Promise<void>;
};

export class UdemySubscriber implements Subscriber {
    private readonly loginPageUrl: string = 'https://www.udemy.com/join/login-popup/';
    private processedCourses: string[] = [];
    private launcher: PuppeteerLauncher;
    private fetchers: Fetcher[];
    private readonly jsonFileHandler: FileHandler = new JsonFileHandler();
    private readonly imageFolderHandler: FolderHandler = new ImageFolderHandler();
    private debug: boolean;

    constructor(fetchers: Fetcher[], debug?: boolean) {
        this.fetchers = fetchers;
        this.debug = debug;
    }

    async run(options: puppeteer.LaunchOptions): Promise<void> {
        this.launcher = new PuppeteerLauncher(options);

        await this.launcher.start();
        if (this.debug)
            console.debug(this.constructor.name + ' has been started...');

        try {
            await this.login();

            let response: boolean = false;
            for (const fetcher of this.fetchers) {
                const page: puppeteer.Page = await this.launcher.newPage();
                const courses: string[] = await fetcher.goto(page) && await fetcher.fetch(page);

                // NOTE: it is already goes to Udemy and loged-in to the system
                response = await this.subscribe(courses);
                const message = response ? 'Succeeded' : 'Failed';
                console.log(`The ${this.constructor.name} ended with status ${message}.`);
            }
        } catch (e) {
            if (e instanceof puppeteer.errors.TimeoutError)
                console.error(`${LauncherErrorMessage.timeout}\n${e}`);
            else {
                console.error(`${LauncherErrorMessage.default}\n${e}`);
            }
        }

        await this.launcher.stop();
        if (this.debug)
            console.debug(this.constructor.name + ' has been closed...');
    }

    async login(): Promise<boolean> {
        let status: boolean = false;
        try {
            const loginPage = await this.launcher.newPage();
            const response = await loginPage.goto(this.loginPageUrl)
            if (!response?.ok()) {
                this.printError(await response.text());
            }

            await loginPage.$eval(SubscriberSelector.emailInput, (input: HTMLInputElement, value: string) => input.value = value, EMAIL);
            await loginPage.$eval(SubscriberSelector.passwordInput, (input: HTMLInputElement, value: string) => input.value = value, PASSWORD);
            await loginPage.$eval(SubscriberSelector.loginSubmitButton, (button: HTMLButtonElement) => button !== null ? button.click() : console.error('Cannot find "Login" button'));
            status = true;

            if (this.debug) {
                console.debug(this.constructor.name + ' has been successfuly logged-in to udemy...');
            }
        } catch (e) {
            console.error(`Cannot login to udemy at ${this.loginPageUrl} page.`);
            throw e;
        }
        return status;
    }

    async subscribe(courses: string[]): Promise<boolean> {
        let status: boolean = false;
        try {
            // Create a directory for today pictures
            const folder: string = await this.imageFolderHandler.create();
            const subscribedCourses: string[] = await this.jsonFileHandler.read();

            // Filtering with subscribed courses
            const newCourses: Set<string> = new Set(courses.filter(function (course) {
                return this.indexOf(course) < 0;
            }, subscribedCourses));

            // Then, for each new course
            for (const newCourse of newCourses) {
                const coursePage = await this.launcher.newPage();

                // Go to this course link (with free coupon)
                const response: puppeteer.Response = await coursePage.goto(newCourse, { waitUntil: 'networkidle2' });
                if (!response?.ok()) {
                    this.printError(await response.text());
                    return;
                }

                // Check if this course already exists in my udemy user
                let buttonName: string;
                let buttonSelector: string;
                try {
                    // Try type 1
                    buttonName = await coursePage.$eval(
                        SubscriberSelector.courseSubmitButton,
                        (button: HTMLButtonElement) => button ? button.innerText : null
                    );
                    buttonSelector = SubscriberSelector.courseSubmitButton;
                } catch (e) {
                    console.warn(`There is a new type of course submit button, see it in ${newCourse}`);
                }

                // Making a screenshot of this new course that was added to cart
                let courseStatus: SubscriberStatusText;
                try {
                    const splitedUrl: string[] = newCourse.split('/');
                    const courseName: string = splitedUrl[splitedUrl.length - 2];
                    switch (buttonName) {
                        case SubscriberButtonText.enrollNow:
                            await coursePage.screenshot({ path: `${folder}/${ImageFolderHandler.enrolled}/${courseName}.png` });
                            await coursePage.waitForSelector(buttonSelector);
                            // Wait for "Enroll now" button to show
                            await coursePage.$eval(
                                buttonSelector,
                                (button: HTMLButtonElement) => button ? button.click() : console.error('There is no "Enroll now" button!')
                            );
                            // Wait for "Enroll now" submit button to show
                            await coursePage.waitForSelector(SubscriberSelector.enrollNowSubmitButton);
                            await coursePage.$eval(
                                SubscriberSelector.enrollNowSubmitButton,
                                (button: HTMLButtonElement) => button ? button.click() : console.error('There is no "Enroll now" submit button!')
                            );
                            // Wait for Udemy subscription approvement
                            await coursePage.waitForSelector(SubscriberSelector.enrolledWindow, { visible: true });
                            courseStatus = SubscriberStatusText.subscribed;
                            break;
                        case SubscriberButtonText.addToCart:
                            await coursePage.screenshot({ path: `${folder}/${ImageFolderHandler.added}/${courseName}.png` });
                            // Wait for "Add to cart" button to show
                            await coursePage.waitForSelector(SubscriberSelector.addToCartButton);
                            await coursePage.$eval(
                                SubscriberSelector.addToCartButton,
                                (button: HTMLButtonElement) => button ? button.click() : console.error('There is no "Add to cart" button!')
                            );
                            // Wait for Udemy subscription approvement
                            await coursePage.waitForSelector(SubscriberSelector.addedToCartPopup, { visible: true });
                            courseStatus = SubscriberStatusText.added;
                            break;
                        case SubscriberButtonText.goToCourse:
                        case SubscriberButtonText.buyNow:
                            await coursePage.screenshot({ path: `${folder}/${ImageFolderHandler.exists}/${courseName}.png` });
                            courseStatus = SubscriberStatusText.exists;
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
                this.processedCourses.push(newCourse);
                if (this.debug)
                    console.debug(`course ${newCourse} ${courseStatus}.`);
                await this.launcher.closePage();
            }
            status = await this.jsonFileHandler.save(this.processedCourses);
        } catch (e) {
            // Save what we have achived so far
            await this.jsonFileHandler.save(this.processedCourses);
            console.error('Cannot manipulate courses list as expected.');
            throw e;
        }
        return status;
    }

    private printError(message: string): void {
        console.error(`${LauncherErrorMessage.default}.\nThe response is: ${message}`);
    }
};

export enum SubscriberSelector {
    // Login Page
    emailInput = '#email--1',
    passwordInput = '#id_password',
    loginSubmitButton = '#submit-id-submit',
    // Subscribe Pages
    courseSubmitButton = '#udemy > div.main-content-wrapper > div.main-content > div.paid-course-landing-page__container > div.sidebar-container-position-manager > div > div > div > div.course-landing-page_slider-menu-container > div > div.slider-menu--show-transactional-cta-container--1Xckm > div.slider-menu--cta-button--3eii3 > div > button',
    enrollNowSubmitButton = '#udemy > div.main-content-wrapper > div.main-content > div > div > div > div.container.styles--shopping-container--A136v > form > div.styles--shopping-lists--3qgap > div > div:nth-child(5) > div > div > div.styles--button-slider--2IGed.styles--checkout-slider--1ry4z > div.styles--complete-payment-container--3Jazs > button',
    enrolledWindow = '#udemy > div.main-content-wrapper > div.main-content',
    addToCartButton = '#udemy > div.main-content-wrapper > div.main-content > div.paid-course-landing-page__container > div.top-container.dark-background > div > div > div.course-landing-page__main-content.course-landing-page__purchase-section__main.dark-background-inner-text-container > div > div > div > div > div.buy-box-main > div > div.buy-box__element.buy-box__element--add-to-cart-button > div > button',
    addedToCartPopup = '#udemy > div.modal--dialog-container--3rrJR > div > div.udlite-modal.modal--dialog--16df1.modal--default-size--cbk60'
};

export enum SubscriberButtonText {
    enrollNow = 'Enroll now',
    addToCart = 'Add to cart',
    goToCourse = 'Go to course',
    buyNow = 'Buy now'
};

export enum SubscriberStatusText {
    subscribed = 'subscribed successfuly',
    added = 'was added to cart',
    exists = 'already exists'
};
