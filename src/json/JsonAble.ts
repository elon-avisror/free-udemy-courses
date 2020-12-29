export default interface JsonAble {
    read(): Promise<string[]>;
    save(courses: string[]): Promise<boolean>;
};