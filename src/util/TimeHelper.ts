export default class TimeHelper {
    static getToday(): string {
        const date: Date = new Date();
        // Getting this local date (format: mm/dd/yyyy)
        const today: string = date.toLocaleDateString();

        // Change this date to format: dd-mm-yyyy
        const fields: string[] = today.split('/');
        let tmp = fields[0];
        fields[0] = fields[1];
        fields[1] = tmp;
        const fileName = fields.join('-');

        return fileName;
    }
};