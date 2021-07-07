import * as puppeteer from 'puppeteer';
import Helper from '../util/TimeHelper';
import Fetcher from './Fetcher';

export default class YoSamplesFetcher extends Fetcher {
    constructor() {
        super('https://yofreesamples.com/courses/free-discounted-udemy-courses-list/');
    }

    async fetch(page: puppeteer.Page): Promise<string[]> {
        // Handling the advertising on the very beginning
        try {
            await page.$eval(
                YoSamplesFetcherSelector.ADVETISING_CLOSE_BUTTON,
                (button: Element) => button instanceof HTMLButtonElement ? button.click() : console.log('No advertisings this time!')
            );
        } catch (e) {
            console.error(`Cannot closing the advetising of ${this.getUrl()} website.`);
            throw e;
        }

        let courses: string[] = [];
        try {
            // Getting the list of today's courses
            courses = await page.$$eval(YoSamplesFetcherSelector.COURSE_LIST, (courses: any[]) => {
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
            console.error(`Cannot fetch courses from ${this.getUrl()} website.`);
            throw e;
        }
        return courses;
    }
};

export enum YoSamplesFetcherSelector {
    ADVETISING_CLOSE_BUTTON = '#subscribe-dialog > div > div > div.modal-header > button',
    COURSE_LIST = '#course-list > ul'
};