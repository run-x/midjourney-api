"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateQueue = void 0;
const tslib_1 = require("tslib");
const p_queue_1 = tslib_1.__importDefault(require("p-queue"));
class ConcurrentQueue {
    queue = [];
    limit;
    constructor(concurrency) {
        this.limit = new p_queue_1.default({ concurrency });
    }
    getWaiting() {
        return this.queue.length;
    }
    async addTask(task) {
        return await this.limit.add(async () => {
            const result = await task();
            return result;
        });
    }
    async getResults() {
        return Promise.allSettled(this.queue.map((task) => {
            return task().catch((err) => err);
        }));
    }
}
function CreateQueue(concurrency) {
    return new ConcurrentQueue(5);
}
exports.CreateQueue = CreateQueue;
// // Usage example:
// const queue = new ConcurrentQueue(5);
// for (let i = 0; i < 10; i++) {
//   queue.addTask(() =>
//     new Promise<number>((resolve, reject) => {
//       setTimeout(() => {
//         console.log('Task done:', i);
//         resolve(i * 2);
//       }, Math.random() * 1000);
//     })
//   );
// }
// console.log('Tasks waiting:', queue.getWaiting());
// setTimeout(() => {
//   queue.getResults().then((results) => {
//     console.log('Results:', results);
//   });
// }, 5000);
//# sourceMappingURL=queue.js.map