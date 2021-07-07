import { promises } from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();
const {
    PROJECT_ROOT_PATH,
    JSON_FILE_PATH
} = process.env;

export interface FileHandler {
    read(): Promise<string[]>;
    save(courses: string[]): Promise<boolean>;
    clear(): Promise<void>;
};

export default class JsonFileHandler implements FileHandler {
    private subscribedCourses: string[] = [];
    private readonly jsonFile: string = `${PROJECT_ROOT_PATH}/${JSON_FILE_PATH}`;

    async read(): Promise<string[]> {
        try {
            await promises.access(this.jsonFile);
            this.subscribedCourses = JSON.parse((await promises.readFile(this.jsonFile)).toString());
        } catch (e) {
            console.error('Cannot read data from DB.');
            throw e;
        }
        return this.subscribedCourses;
    }

    async save(newCourses: string[]): Promise<boolean> {
        try {
            await promises.writeFile(this.jsonFile, JSON.stringify([...this.subscribedCourses, ...newCourses]));
        } catch (e) {
            console.error('Cannot save data to DB.');
            throw e;
        }
        this.subscribedCourses = [...this.subscribedCourses, ...newCourses];
        return !!this.subscribedCourses;
    }

    async clear(): Promise<void> {
        try {
            const setSubscribedCourses: string[] = [...new Set(await this.read())];
            await this.save(setSubscribedCourses);
        } catch (e) {
            console.error('Cannot clear data on DB.');
            throw e;
        }
    }
};
