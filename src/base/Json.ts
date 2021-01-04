import * as fs from 'fs/promises';
import * as dotenv from 'dotenv';

dotenv.config();
const {
    PROJECT_ROOT_PATH,
    JSON_PATH,
    JSON_FILE
} = process.env;

export default class Json implements JsonAble {
    private subscribed: string[] = [];
    private readonly jsonPath: string = `${PROJECT_ROOT_PATH}/${JSON_PATH}/${JSON_FILE}`;

    async read(): Promise<string[]> {
        try {
            await fs.access(this.jsonPath);
            this.subscribed = JSON.parse((await fs.readFile(this.jsonPath)).toString());
        } catch (e) {
            console.error('Cannot read data from DB.');
            throw e;
        }
        return this.subscribed;
    }

    async save(courses: string[]): Promise<boolean> {
        try {
            await fs.writeFile(this.jsonPath, JSON.stringify([...this.subscribed, ...courses]));
        } catch (e) {
            console.error('Cannot save data to DB.');
            throw e;
        }
        this.subscribed = [...this.subscribed, ...courses];
        return !!this.subscribed;
    }

    async clear(): Promise<void> {
        try {
            const subscribed: string[] = [...new Set(await this.read())];
            await this.save(subscribed);
        } catch (e) {
            console.error('Cannot clear data on DB.');
            throw e;
        }
    }
};

export interface JsonAble {
    read(): Promise<string[]>;
    save(courses: string[]): Promise<boolean>;
    clear(): Promise<void>;
};