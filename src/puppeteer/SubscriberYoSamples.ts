import * as puppeteer from 'puppeteer';
import Subscriber from './Subscriber';
import SubscriberUtils from '../utils/Helper';
import Helper from '../utils/Helper';

export default class SubscriberYoSamples extends Subscriber {
    // Selectors
    private readonly WEBSITE: string = 'https://yofreesamples.com/courses/free-discounted-udemy-courses-list/';
    private readonly ADVETISING_CLOSE_BUTTON: string = '#subscribe-dialog > div > div > div.modal-header > button';
    private readonly COURSE_LIST: string = '#course-list > ul';
    private readonly COURSE_LINK: string = this.COURSE_LIST + ' > li:nth-child(1) > div.col-xs-12.col-sm-9 > p:nth-child(5) > a';

    async fetch(): Promise<boolean> {
        // TODO: Go-to Udemy and log-in to the system

        // Go-to free source and record that session
        try {
            const response: puppeteer.Response = await this.getPage().goto(this.WEBSITE);
            if (!response.ok()) {
                console.error(`${Helper.defaultErrorMessage}. The response is:  ${response}`);
                return;
            }
        } catch (e) {
            console.error(`Cannot getting to ${this.WEBSITE} website.`);
            throw e;
        }

        // Handling the advertising on the very beginning
        try {
            await this.getPage().$eval(
                this.ADVETISING_CLOSE_BUTTON,
                (button: HTMLButtonElement) => button !== null ? button.click() : console.log('No advertisings this time!')
            );
        } catch (e) {
            console.error(`Cannot closing the advetising of ${this.WEBSITE} website.`);
            throw e;
        }

        // Save that session's picture
        const date: Date = new Date();
        const fileName: string = SubscriberUtils.getFileName(date);
        try {
            await this.getPage().screenshot({ path: `${__dirname}/../img/${fileName}.png` });
        } catch (e) {
            console.error(`Unable to have a screenshot of this ${fileName} session.`);
            throw e;
        }

        try {
            // TODO: handle that!
            // const numberOfCourses: number = await this.getPage().$eval(this.COURSE_LIST, (list: HTMLUListElement) => list.children.length);
            // for (let i = 0; i < numberOfCourses-1; i++) {
            //     const course: HTMLLIElement = await this.getPage().$eval(this.COURSE_LIST, (list: HTMLUListElement) => list.children[i]);
            //     console.log(course);
            // }

            // Getting the list of today's courses
            const courses: HTMLCollection = await this.getPage().$eval(this.COURSE_LIST, (list: HTMLUListElement) => list.children);
            console.log(courses);
            for (let i = 0; i < courses.length; i++) {
                // For each course
                const course = courses[i];
                console.log(course);
                // Click on the link (open new tab)

                // Check if we can add it to cart (then we did'nt have it).

                // If we didn't have it, click on button "Add to cart"

                // Close tab
            }
            console.log("DEVELOPED!");
        } catch (e) {
            console.error('Cannot manipulate courses list as expected.');
            throw e;
        }

        return;
    }
};