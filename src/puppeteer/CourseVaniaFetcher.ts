import { Page } from 'puppeteer';
import { transpileModule } from 'typescript';
import TimeHelper from '../util/TimeHelper';
import PuppeteerFetcher from './Fetcher';

export default class CourseVaniaFetcher extends PuppeteerFetcher {
    constructor() {
        super('https://coursevania.com/courses/');
    }

    async fetch(page: Page): Promise<string[]> {
        let courses: string[] = [];
        try {
            // While there is load more button, load more courses
            let loadMoreButton = true;
            try {
                while (loadMoreButton) {
                    loadMoreButton = await page.$$eval(CourseVaniaFetcherSelector.LOAD_MORE_BUTTON, (button: any) => {
                        if (button && button instanceof HTMLButtonElement) {
                            button.click();
                            return true;
                        }
                        return false;
                    });
                }
            } catch (e) {
                console.error(`Cannot closing the advetising of ${this.getUrl()} website.`);
                throw e;
            }

            // Getting the list of today's courses
            courses = await page.$$eval(CourseVaniaFetcherSelector.COURSE_LIST, (courses: any[]) => {
                const links: string[] = [];
                for (let i = 0; i < courses[0].children.length; i++) {
                    links.push(courses[0].children[i]?.children[0]?.children[0]?.href);
                }
                return links;
            });
            if (!courses) {
                console.warn(`There are no new courses for today ${TimeHelper.getToday()}.`)
                return [];
            }
        } catch (e) {
            console.error(`Cannot fetch courses from ${this.getUrl()} website.`);
            throw e;
        }
        return courses;
    }
};

export enum CourseVaniaFetcherSelector {
    LOAD_MORE_BUTTON = '#main > div.container > div.post_type_exist.clearfix > div > div.stm_lms_courses__archive_wrapper > div > div.text-center > a',
    COURSE_LIST = '#main > div.container > div.post_type_exist.clearfix > div > div.stm_lms_courses__archive_wrapper > div > div.stm_lms_courses__grid.stm_lms_courses__grid_4.stm_lms_courses__grid_center.archive_grid.stm_lms_courses__grid_found_2841'
};