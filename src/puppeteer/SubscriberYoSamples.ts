import * as puppeteer from 'puppeteer';
import * as fs from 'fs/promises';
import Subscriber from './Subscriber';
import SubscriberUtils from '../util/Helper';
import Helper from '../util/Helper';
import Json from '../json/Json';

export default class SubscriberYoSamples extends Subscriber {
    // Resources
    private readonly website: string = 'https://yofreesamples.com/courses/free-discounted-udemy-courses-list/';
    private readonly images: string = 'images';
    private readonly added: string = 'added';
    private readonly enrolled: string = 'enrolled';
    private readonly exists: string = 'exists';
    // Submits
    private readonly ENROLL_NOW: string = 'Enroll now';
    private readonly ADD_TO_CART: string = 'Add to cart';
    private readonly GO_TO_COURSE: string = 'Go to course';
    // Selectors
    private readonly ADVETISING_CLOSE_BUTTON: string = '#subscribe-dialog > div > div > div.modal-header > button';
    private readonly COURSE_LIST: string = '#course-list > ul';
    private readonly COURSE_BUTTON_1: string = '#udemy > div.main-content-wrapper > div.main-content > div.paid-course-landing-page__container > div.sidebar-container-position-manager > div > div > div > div.course-landing-page_slider-menu-container > div > div.slider-menu--cta-button--3eii3 > div > button';
    private readonly COURSE_BUTTON_2: string = '#sg > div.main-content-wrapper > div.main-content > div.paid-course-landing-page__container > div.sidebar-container-position-manager > div > div > div > div.course-landing-page_slider-menu-container > div > div.slider-menu--cta-button--3eii3 > div > button';
    private readonly ENROLL_NOW_SUBMIT_BUTTON: string = '#udemy > div.main-content-wrapper > div.main-content > div > div > div > div.container.styles--shopping-container--A136v > form > div.styles--shopping-lists--3qgap > div > div:nth-child(5) > div > div > div.styles--button-slider--2IGed.styles--checkout-slider--1ry4z > div.styles--complete-payment-container--3Jazs > button';
    private readonly ENROLLED_WINDOW: string = '#udemy > div.main-content-wrapper > div.main-content';
    private readonly ADD_TO_CART_BUTTON: string = '#udemy > div.main-content-wrapper > div.main-content > div.paid-course-landing-page__container > div.top-container.dark-background > div > div > div.course-landing-page__main-content.course-landing-page__purchase-section__main.dark-background-inner-text-container > div > div > div > div > div.buy-box-main > div > div.buy-box__element.buy-box__element--add-to-cart-button > div > button';
    private readonly ADDED_TO_CART_POPUP: string = '#udemy > div.modal--dialog-container--3rrJR > div > div.udlite-modal.modal--dialog--16df1.modal--default-size--cbk60';
    // JSON
    private readonly json = new Json();
    private processed: string[] = [];

    // NOTE: it is already goes to Udemy and loged-in to the system
    async fetch(): Promise<boolean> {
        let status: boolean = false;

        // Create a directory for today pictures
        const date: Date = new Date();
        const today: string = SubscriberUtils.getFileName(date);
        const folder: string = `${__dirname}/../${this.images}/${today}`;
        try {
            await fs.access(folder);
        } catch (e) {
            console.log(`Folder for today ${today} is not exists, so have been created.`);
            try {
                await fs.mkdir(folder);
                await fs.mkdir(`${folder}/${this.added}`);
                await fs.mkdir(`${folder}/${this.enrolled}`);
                await fs.mkdir(`${folder}/${this.exists}`);
            } catch (e) {
                console.error(`Could not create today ${today} folder.`);
                throw e;
            }
        }

        // Go-to free source and record that session
        try {
            const response: puppeteer.Response = await (await this.newPage()).goto(this.website, { waitUntil: 'load', timeout: 0 });
            if (!response?.ok()) {
                console.error(`${Helper.defaultErrorMessage}. The response is:  ${response}`);
                return false;
            }
        } catch (e) {
            console.error(`Cannot getting to ${this.website} website.`);
            throw e;
        }

        // Handling the advertising on the very beginning
        try {
            await this.getPage(1).$eval(
                this.ADVETISING_CLOSE_BUTTON,
                (button: HTMLButtonElement) => button ? button.click() : console.log('No advertisings this time!')
            );
        } catch (e) {
            console.error(`Cannot closing the advetising of ${this.website} website.`);
            throw e;
        }

        try {
            // Getting the list of today's courses
            const courses: string[] = await this.getPage(1).$$eval(this.COURSE_LIST, (courses: any[]) => {
                const links: string[] = [];
                for (let i = 0; i < courses[0].children.length; i++) {
                    links.push(courses[0].children[i]?.children[0]?.children[0]?.href);
                }
                return links;
            });
            if (!courses) {
                console.warn(`There are no new courses for today ${today}`)
                return true;
            }

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
                    console.error(`${Helper.defaultErrorMessage}. The response is:  ${response}`);
                    return false;
                }

                // Check if this course already exists in my udemy user
                let buttonName: string;
                let buttonSelector: string;
                try {
                    // Try type 1
                    buttonName = await this.getPage(2).$eval(
                        this.COURSE_BUTTON_1,
                        (button: HTMLButtonElement) => button ? button.innerText : null
                    );
                    buttonSelector = this.COURSE_BUTTON_1;
                } catch (e) {
                    // Try type 2
                    buttonName = await this.getPage(2).$eval(
                        this.COURSE_BUTTON_2,
                        (button: HTMLButtonElement) => button ? button.innerText : null
                    );
                    buttonSelector = this.COURSE_BUTTON_2;
                }

                // Making a screenshot of this new course that was added to cart
                try {
                    const splitedUrl: string[] = newCourse.split('/');
                    const courseName: string = splitedUrl[splitedUrl.length - 2];

                    switch (buttonName) {
                        case this.ENROLL_NOW:
                            await this.getPage(2).screenshot({ path: `${folder}/${this.enrolled}/${courseName}.png` });
                            await this.getPage(2).waitForSelector(buttonSelector);
                            // Wait for "Enroll now" button to show
                            await this.getPage(2).$eval(
                                buttonSelector,
                                (button: HTMLButtonElement) => button ? button.click() : console.error('There is no "Enroll now" button!')
                            );
                            // Wait for "Enroll now" submit button to show
                            await this.getPage(2).waitForSelector(this.ENROLL_NOW_SUBMIT_BUTTON);
                            await this.getPage(2).$eval(
                                this.ENROLL_NOW_SUBMIT_BUTTON,
                                (button: HTMLButtonElement) => button ? button.click() : console.error('There is no "Enroll now" submit button!')
                            );
                            // Wait for Udemy subscription approvement
                            await this.getPage(2).waitForSelector(this.ENROLLED_WINDOW, { visible: true });
                            break;
                        case this.ADD_TO_CART:
                            await this.getPage(2).screenshot({ path: `${folder}/${this.added}/${courseName}.png` });
                            // Wait for "Add to cart" button to show
                            await this.getPage(2).waitForSelector(this.ADD_TO_CART_BUTTON);
                            await this.getPage(2).$eval(
                                this.ADD_TO_CART_BUTTON,
                                (button: HTMLButtonElement) => button ? button.click() : console.error('There is no "Add to cart" button!')
                            );
                            // Wait for Udemy subscription approvement
                            await this.getPage(2).waitForSelector(this.ADDED_TO_CART_POPUP, { visible: true });
                            break;
                        case this.GO_TO_COURSE:
                            await this.getPage(2).screenshot({ path: `${folder}/${this.exists}/${courseName}.png` });
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
                if (this.isDebugEnabled())
                    console.debug(`course ${newCourse} was added.`);
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
};