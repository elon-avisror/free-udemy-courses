import * as fs from 'fs/promises';
import Helper from './Helper';

export interface FolderAble {
    create(): Promise<string>;
};

export default class Folder implements FolderAble {
    static readonly images: string = 'images';
    static readonly added: string = 'added';
    static readonly enrolled: string = 'enrolled';
    static readonly exists: string = 'exists';

    async create(): Promise<string> {
        const today: string = Helper.getToday();
        const folder: string = `${__dirname}/../${Folder.images}/${today}`;
        try {
            await fs.access(folder);
        } catch (e) {
            console.log(`Folder for today ${today} is not exists, so have been created.`);
            try {
                await fs.mkdir(folder);
                await fs.mkdir(`${folder}/${Folder.added}`);
                await fs.mkdir(`${folder}/${Folder.enrolled}`);
                await fs.mkdir(`${folder}/${Folder.exists}`);
            } catch (e) {
                console.error(`Could not create today ${today} folder.`);
                throw e;
            }
        }
        return folder;
    }
};