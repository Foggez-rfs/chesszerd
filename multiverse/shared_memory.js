export class SharedMemory {
    constructor() {
        this.buffer = new SharedArrayBuffer(1024 * 1024);
    }
}
