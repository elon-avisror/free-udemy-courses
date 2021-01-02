import * as puppeteer from 'puppeteer';
import Subscriber from './Subscriber';
import Helper from '../util/Helper';
import { ErrorMessage } from '../enum/ErrorMessage';

export default class YoSamplesSubscriber extends Subscriber {
    // Source
    private readonly website: string = 'https://yofreesamples.com/courses/free-discounted-udemy-courses-list/';
    // Selectors
    private readonly ADVETISING_CLOSE_BUTTON: string = '#subscribe-dialog > div > div > div.modal-header > button';
    private readonly COURSE_LIST: string = '#course-list > ul';

    // NOTE: it is already goes to Udemy and loged-in to the system
    async fetch(): Promise<string[]> {
        // Go-to free source and record that session
        try {
            const response: puppeteer.Response = await (await this.newPage()).goto(this.website, { waitUntil: 'load', timeout: 0 });
            if (!response?.ok()) {
                console.error(`${ErrorMessage.default}. The response is:  ${response}.`);
                return;
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

        let courses: string[] = [];
        try {
            // Getting the list of today's courses
            courses = await this.getPage(1).$$eval(this.COURSE_LIST, (courses: any[]) => {
                const links: string[] = [];
                for (let i = 0; i < courses[0].children.length; i++) {
                    links.push(courses[0].children[i]?.children[0]?.children[0]?.href);
                }
                return links;
            });
            if (!courses) {
                console.warn(`There are no new courses for today ${Helper.getToday()}.`)
                return [];
            }
        } catch (e) {
            console.error(`Cannot fetch courses from ${this.website} website.`);
            throw e;
        }
        return courses;
    }
};