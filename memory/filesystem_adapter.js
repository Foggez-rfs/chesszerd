export class FilesystemAdapter {
    constructor() {
        this.basePath = '/data/data/com.termux/files/home/chesszerd_data';
    }
    async init() {
        console.log('FilesystemAdapter: готов к работе');
    }
    async save(key, data) {
        console.log(`Сохраняю ${key} в ФС`);
    }
    async load(key) {
        console.log(`Загружаю ${key} из ФС`);
        return null;
    }
}
