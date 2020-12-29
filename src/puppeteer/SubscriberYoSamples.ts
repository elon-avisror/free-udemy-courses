import * as puppeteer from 'puppeteer';
import Subscriber from './Subscriber';
import SubscriberUtils from '../util/Helper';
import Helper from '../util/Helper';
import Json from '../json/Json';

export default class SubscriberYoSamples extends Subscriber {
    // Selectors
    private readonly WEBSITE: string = 'https://yofreesamples.com/courses/free-discounted-udemy-courses-list/';
    private readonly ADVETISING_CLOSE_BUTTON: string = '#subscribe-dialog > div > div > div.modal-header > button';
    private readonly COURSE_LIST: string = '#course-list > ul';
    private readonly ADD_TO_CART: string = '#udemy > div.main-content-wrapper > div.main-content > div.paid-course-landing-page__container > div.top-container.dark-background > div > div > div.course-landing-page__main-content.course-landing-page__purchase-section__main.dark-background-inner-text-container > div > div > div > div > div.buy-box-main > div > div.buy-box__element.buy-box__element--add-to-cart-button > div > button';

    async fetch(): Promise<boolean> {
        let status: boolean = false;
        // TODO: Go-to Udemy and log-in to the system

        // Go-to free source and record that session
        try {
            const response: puppeteer.Response = await this.getPage(0).goto(this.WEBSITE, { waitUntil: 'load', timeout: 0 });
            if (!response?.ok()) {
                console.error(`${Helper.defaultErrorMessage}. The response is:  ${response}`);
                return false;
            }
        } catch (e) {
            console.error(`Cannot getting to ${this.WEBSITE} website.`);
            throw e;
        }

        // Handling the advertising on the very beginning
        try {
            await this.getPage(0).$eval(
                this.ADVETISING_CLOSE_BUTTON,
                (button: HTMLButtonElement) => button !== null ? button.click() : console.log('No advertisings this time!')
            );
        } catch (e) {
            console.error(`Cannot closing the advetising of ${this.WEBSITE} website.`);
            throw e;
        }

        // Save that session's picture
        const date: Date = new Date();
        // TODO: make a folder of today courses...
        const today: string = SubscriberUtils.getFileName(date);
        try {
            await this.getPage(0).screenshot({ path: `${__dirname}/../images/${today}.png` });
        } catch (e) {
            console.error(`Unable to have a screenshot of this ${today} session.`);
            throw e;
        }

        try {
            // Getting the list of today's courses
            const courses: string[] = await this.getPage(0).$$eval(this.COURSE_LIST, (courses: any[]) => {
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
            console.log(courses);

            const json = new Json();
            const subscribed: string[] = await json.read();
            console.log(subscribed);

            // Filtering with subscribed courses
            const newCourses: Set<string> = new Set(courses.filter(function (course) {
                return this.indexOf(course) < 0;
            }, subscribed));
            console.log(newCourses);

            // Then, for each new course
            for (const newCourse of newCourses) {
                // Go to this course link (with free coupon)
                const response: puppeteer.Response = await (await this.newPage()).goto(newCourse);
                if (!response?.ok()) {
                    console.error(`${Helper.defaultErrorMessage}. The response is:  ${response}`);
                    return false;
                }

                // Check if we can add it to cart (then we did not have it)
                await this.getPage(1).$eval(
                    this.ADD_TO_CART,
                    // If we did not have it, click on button "Add to cart"
                    (button: HTMLButtonElement) => button !== null ? button.click() : console.error('There is no "Add to cart" button!')
                );

                // TODO: make a screen shot of this course added to cart

                // Close tab
                this.closePage();
                console.log("DEVELOPED!");
            }
            status = await json.save([...newCourses])
        } catch (e) {
            console.error('Cannot manipulate courses list as expected.');
            throw e;
        }
        return status;
    }
};