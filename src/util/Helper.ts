export default class Helper {
    static readonly defaultErrorMessage: string = 'Something went wrong!';
    static readonly timeoutErrorMessage: string = 'There was an timeout!';

    static getFileName(date: Date): string {
        // Getting this local date (format: mm/dd/yyyy)
        const today: string = date.toUTCString();

        // Change this date to format: dd-mm-yyyy
        const fields: string[] = today.split('/');
        let tmp = fields[0];
        fields[0] = fields[1];
        fields[1] = tmp;
        const fileName = fields.join('-');

        return fileName;
    }
};