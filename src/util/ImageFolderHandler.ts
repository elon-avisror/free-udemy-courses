import { promises } from 'fs';
import Helper from './TimeHelper';

export interface FolderHandler {
    create(): Promise<string>;
};

export default class ImageFolderHandler implements FolderHandler {
    static readonly images: string = 'images';
    static readonly added: string = 'added';
    static readonly enrolled: string = 'enrolled';
    static readonly exists: string = 'exists';

    async create(): Promise<string> {
        const today: string = Helper.getToday();
        const folder: string = `${__dirname}/../${ImageFolderHandler.images}/${today}`;
        try {
            await promises.access(folder);
        } catch (e) {
            console.log(`Folder for today ${today} is not exists, so have been created.`);
            try {
                await promises.mkdir(folder);
                await promises.mkdir(`${folder}/${ImageFolderHandler.added}`);
                await promises.mkdir(`${folder}/${ImageFolderHandler.enrolled}`);
                await promises.mkdir(`${folder}/${ImageFolderHandler.exists}`);
            } catch (e) {
                console.error(`Could not create today ${today} folder.`);
                throw e;
            }
        }
        return folder;
    }
};