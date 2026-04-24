export class IndexedDBAdapter {
    async init() {
        console.log('IndexedDBAdapter: готов');
    }
    async save(key, data) {}
    async load(key) { return null; }
}
