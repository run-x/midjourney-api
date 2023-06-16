"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Midjourney = void 0;
const interfaces_1 = require("./interfaces");
const midjourne_api_1 = require("./midjourne.api");
const midjourney_message_1 = require("./midjourney.message");
const utls_1 = require("./utls");
const ws_message_1 = require("./ws.message");
class Midjourney extends midjourney_message_1.MidjourneyMessage {
    config;
    wsClient;
    MJApi;
    constructor(defaults) {
        const { SalaiToken } = defaults;
        if (!SalaiToken) {
            throw new Error("SalaiToken are required");
        }
        super(defaults);
        this.config = {
            ...interfaces_1.DefaultMJConfig,
            ...defaults,
        };
        this.MJApi = new midjourne_api_1.MidjourneyApi(this.config);
    }
    async init() {
        if (!this.config.Ws) {
            return this;
        }
        if (this.wsClient)
            return this;
        return new Promise((resolve) => {
            this.wsClient = new ws_message_1.WsMessage(this.config, this.MJApi);
            this.wsClient.once("ready", () => {
                this.log(`ws ready`);
                resolve(this);
            });
        });
    }
    async Imagine(prompt, loading) {
        prompt = prompt.trim();
        if (!this.wsClient) {
            const seed = (0, utls_1.random)(1000000000, 9999999999);
            prompt = `[${seed}] ${prompt}`;
        }
        const nonce = (0, utls_1.nextNonce)();
        this.log(`Imagine`, prompt, "nonce", nonce);
        const httpStatus = await this.MJApi.ImagineApi(prompt, nonce);
        if (httpStatus !== 204) {
            throw new Error(`ImagineApi failed with status ${httpStatus}`);
        }
        if (this.wsClient) {
            return await this.wsClient.waitImageMessage(nonce, loading);
        }
        else {
            this.log(`await generate image`);
            const msg = await this.WaitMessage(prompt, loading);
            this.log(`image generated`, prompt, msg?.uri);
            return msg;
        }
    }
    async Info() {
        const nonce = (0, utls_1.nextNonce)();
        const httpStatus = await this.MJApi.InfoApi(nonce);
        if (httpStatus !== 204) {
            throw new Error(`ImagineApi failed with status ${httpStatus}`);
        }
        if (this.wsClient) {
            return this.wsClient.waitInfo();
        }
        return null;
    }
    async Fast() {
        const nonce = (0, utls_1.nextNonce)();
        const httpStatus = await this.MJApi.FastApi(nonce);
        if (httpStatus !== 204) {
            throw new Error(`FastApi failed with status ${httpStatus}`);
        }
        return null;
    }
    async Relax() {
        const nonce = (0, utls_1.nextNonce)();
        const httpStatus = await this.MJApi.RelaxApi(nonce);
        if (httpStatus !== 204) {
            throw new Error(`RelaxApi failed with status ${httpStatus}`);
        }
        return null;
    }
    async Describe(imgUri) {
        const nonce = (0, utls_1.nextNonce)();
        const DcImage = await this.MJApi.UploadImage(imgUri);
        this.log(`Describe`, DcImage, "nonce", nonce);
        const httpStatus = await this.MJApi.DescribeApi(DcImage, nonce);
        if (httpStatus !== 204) {
            throw new Error(`DescribeApi failed with status ${httpStatus}`);
        }
        if (this.wsClient) {
            return this.wsClient.waitDescribe(nonce);
        }
        return null;
    }
    async Variation(content, index, msgId, msgHash, loading) {
        // index is 1-4
        if (index < 1 || index > 4) {
            throw new Error(`Variation index must be between 1 and 4, got ${index}`);
        }
        const nonce = (0, utls_1.nextNonce)();
        const httpStatus = await this.MJApi.VariationApi(index, msgId, msgHash, nonce);
        if (httpStatus !== 204) {
            throw new Error(`VariationApi failed with status ${httpStatus}`);
        }
        if (this.wsClient) {
            return await this.wsClient.waitImageMessage(nonce, loading);
        }
        else {
            return await this.WaitOptionMessage(content, `Variations`, loading);
        }
    }
    async Upscale(content, index, msgId, msgHash, loading) {
        // index is 1-4
        if (index < 1 || index > 4) {
            throw new Error(`Variation index must be between 1 and 4, got ${index}`);
        }
        const nonce = (0, utls_1.nextNonce)();
        const httpStatus = await this.MJApi.UpscaleApi(index, msgId, msgHash, nonce);
        if (httpStatus !== 204) {
            throw new Error(`VariationApi failed with status ${httpStatus}`);
        }
        this.log(`await generate image`);
        if (this.wsClient) {
            return await this.wsClient.waitImageMessage(nonce, loading);
        }
        return await this.WaitUpscaledMessage(content, index, loading);
    }
    Close() {
        if (this.wsClient) {
            this.wsClient.close();
            this.wsClient = undefined;
        }
    }
}
exports.Midjourney = Midjourney;
//# sourceMappingURL=midjourney.js.map