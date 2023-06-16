"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WsMessage = void 0;
const tslib_1 = require("tslib");
const verify_human_1 = require("./verify.human");
const isomorphic_ws_1 = tslib_1.__importDefault(require("isomorphic-ws"));
// import { HttpsProxyAgent } from "https-proxy-agent";
class WsMessage {
    config;
    MJApi;
    ws;
    MJBotId = "936929561302675456";
    closed = false;
    event = [];
    waitMjEvents = new Map();
    reconnectTime = [];
    heartbeatInterval = 0;
    // agent?: HttpsProxyAgent<string>;
    constructor(config, MJApi) {
        this.config = config;
        this.MJApi = MJApi;
        if (this.config.ProxyUrl && this.config.ProxyUrl !== "") {
            // this.agent = new HttpsProxyAgent(this.config.ProxyUrl);
        }
        // const agent = this.agent;
        this.ws = new isomorphic_ws_1.default(this.config.WsBaseUrl);
        this.ws.addEventListener("open", this.open.bind(this));
    }
    async heartbeat(num) {
        if (this.reconnectTime[num])
            return;
        this.heartbeatInterval++;
        this.ws.send(JSON.stringify({
            op: 1,
            d: this.heartbeatInterval,
        }));
        await this.timeout(1000 * 40);
        this.heartbeat(num);
    }
    close() {
        this.closed = true;
        this.ws.close();
    }
    //try reconnect
    reconnect() {
        if (this.closed)
            return;
        // const agent = this.agent;
        this.ws = new isomorphic_ws_1.default(this.config.WsBaseUrl);
        this.ws.addEventListener("open", this.open.bind(this));
    }
    // After opening ws
    async open() {
        const num = this.reconnectTime.length;
        this.log("open.time", num);
        this.reconnectTime.push(false);
        this.auth();
        this.ws.addEventListener("message", (event) => {
            this.parseMessage(event.data);
        });
        this.ws.addEventListener("error", (event) => {
            this.reconnectTime[num] = true;
            this.reconnect();
        });
        setTimeout(() => {
            this.heartbeat(num);
        }, 1000 * 10);
    }
    // auth
    auth() {
        this.ws.send(JSON.stringify({
            op: 2,
            d: {
                token: this.config.SalaiToken,
                capabilities: 8189,
                properties: {
                    os: "Mac OS X",
                    browser: "Chrome",
                    device: "",
                },
                compress: false,
            },
        }));
    }
    async timeout(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    async messageCreate(message) {
        const { embeds, id, nonce, components } = message;
        if (nonce) {
            this.log("waiting start image or info or error");
            this.updateMjEventIdByNonce(id, nonce);
            if (embeds?.[0]) {
                const { color, description, title } = embeds[0];
                this.log("embeds[0].color", color);
                switch (color) {
                    case 16711680: //error
                        const error = new Error(description);
                        this.EventError(id, error);
                        return;
                    case 16776960: //warning
                        console.warn(description);
                        break;
                    default:
                        if (title?.includes("continue") &&
                            description?.includes("verify you're human")) {
                            //verify human
                            await this.verifyHuman(message);
                            return;
                        }
                        if (title?.includes("Invalid")) {
                            //error
                            const error = new Error(description);
                            this.EventError(id, error);
                            return;
                        }
                }
            }
        }
        if (!nonce && components?.length > 0) {
            this.log("finished image");
            this.done(message);
            return;
        }
        this.messageUpdate(message);
    }
    messageUpdate(message) {
        // this.log("messageUpdate", message);
        const { content, embeds, interaction, nonce, id } = message;
        if (content === "") {
            //describe
            if (interaction.name === "describe" && !nonce) {
                this.emitDescribe(id, embeds[0].description);
            }
            if (embeds && embeds.length > 0 && embeds[0].color === 0) {
                this.log(embeds[0].title, embeds[0].description);
                //maybe info
                if (embeds[0].title.includes("info")) {
                    this.emit("info", embeds[0].description);
                    return;
                }
            }
            return;
        }
        this.processingImage(message);
    }
    processingImage(message) {
        const { content, id, attachments } = message;
        const event = this.getEventById(id);
        if (!event) {
            return;
        }
        event.prompt = content;
        //not image
        if (!attachments || attachments.length === 0) {
            return;
        }
        const MJmsg = {
            uri: attachments[0].url,
            content: content,
            progress: this.content2progress(content),
        };
        const eventMsg = {
            message: MJmsg,
        };
        this.emitImage(event.nonce, eventMsg);
    }
    // parse message from ws
    parseMessage(data) {
        const msg = JSON.parse(data);
        if (msg.t === null || msg.t === "READY_SUPPLEMENTAL")
            return;
        if (msg.t === "READY") {
            this.emit("ready", null);
            return;
        }
        if (!(msg.t === "MESSAGE_CREATE" || msg.t === "MESSAGE_UPDATE"))
            return;
        const message = msg.d;
        const { channel_id, content, id, nonce, author } = message;
        if (!(author && author.id === this.MJBotId))
            return;
        if (channel_id !== this.config.ChannelId)
            return;
        this.log("has message", msg.t, content, nonce, id);
        if (msg.t === "MESSAGE_CREATE") {
            this.messageCreate(message);
            return;
        }
        if (msg.t === "MESSAGE_UPDATE") {
            this.messageUpdate(message);
            return;
        }
    }
    async verifyHuman(message) {
        const { HuggingFaceToken } = this.config;
        if (HuggingFaceToken === "" || !HuggingFaceToken) {
            this.log("HuggingFaceToken is empty");
            return;
        }
        const { embeds, components } = message;
        const uri = embeds[0].image.url;
        const categories = components[0].components;
        const classify = categories.map((c) => c.label);
        const verifyClient = new verify_human_1.VerifyHuman(HuggingFaceToken);
        const category = await verifyClient.verify(uri, classify);
        if (category) {
            const custom_id = categories.find((c) => c.label === category).custom_id;
            const httpStatus = await this.MJApi.ClickBtnApi(custom_id, message.id);
            this.log("verifyHumanApi", httpStatus, custom_id, message.id);
            // this.log("verify success", category);
        }
    }
    EventError(id, error) {
        const event = this.getEventById(id);
        if (!event) {
            return;
        }
        const eventMsg = {
            error,
        };
        this.emit(event.nonce, eventMsg);
    }
    done(message) {
        const { content, id, attachments } = message;
        const MJmsg = {
            id,
            hash: this.uriToHash(attachments[0].url),
            progress: "done",
            uri: attachments[0].url,
            content: content,
        };
        this.filterMessages(MJmsg);
        return;
    }
    content2progress(content) {
        const spcon = content.split("**");
        if (spcon.length < 3) {
            return "";
        }
        content = spcon[2];
        const regex = /\(([^)]+)\)/; // matches the value inside the first parenthesis
        const match = content.match(regex);
        let progress = "";
        if (match) {
            progress = match[1];
        }
        return progress;
    }
    content2prompt(content) {
        if (!content)
            return "";
        const pattern = /\*\*(.*?)\*\*/; // Match **middle content
        const matches = content.match(pattern);
        if (matches && matches.length > 1) {
            return matches[1]; // Get the matched content
        }
        else {
            this.log("No match found.", content);
            return content;
        }
    }
    filterMessages(MJmsg) {
        const event = this.getEventByContent(MJmsg.content);
        if (!event) {
            this.log("FilterMessages not found", MJmsg, this.waitMjEvents);
            return;
        }
        const eventMsg = {
            message: MJmsg,
        };
        this.emitImage(event.nonce, eventMsg);
    }
    getEventByContent(content) {
        const prompt = this.content2prompt(content);
        for (const [key, value] of this.waitMjEvents.entries()) {
            if (prompt === this.content2prompt(value.prompt)) {
                return value;
            }
        }
    }
    getEventById(id) {
        for (const [key, value] of this.waitMjEvents.entries()) {
            if (value.id === id) {
                return value;
            }
        }
    }
    updateMjEventIdByNonce(id, nonce) {
        if (nonce === "" || id === "")
            return;
        let event = this.waitMjEvents.get(nonce);
        if (!event)
            return;
        event.id = id;
        this.log("updateMjEventIdByNonce success", this.waitMjEvents.get(nonce));
    }
    uriToHash(uri) {
        return uri.split("_").pop()?.split(".")[0] ?? "";
    }
    async log(...args) {
        this.config.Debug && console.info(...args, new Date().toISOString());
    }
    emit(event, message) {
        this.event
            .filter((e) => e.event === event)
            .forEach((e) => e.callback(message));
    }
    emitImage(type, message) {
        this.emit(type, message);
    }
    emitDescribe(id, data) {
        const event = this.getEventById(id);
        if (!event)
            return;
        this.emit(event.nonce, data);
    }
    on(event, callback) {
        this.event.push({ event, callback });
    }
    once(event, callback) {
        const once = (message) => {
            this.remove(event, once);
            callback(message);
        };
        this.event.push({ event, callback: once });
    }
    remove(event, callback) {
        this.event = this.event.filter((e) => e.event !== event && e.callback !== callback);
    }
    removeEvent(event) {
        this.event = this.event.filter((e) => e.event !== event);
    }
    onceInfo(callback) {
        const once = (message) => {
            this.remove("info", once);
            callback(message);
        };
        this.event.push({ event: "info", callback: once });
    }
    onceDescribe(nonce, callback) {
        const once = (message) => {
            this.remove(nonce, once);
            this.removeWaitMjEvent(nonce);
            callback(message);
        };
        this.waitMjEvents.set(nonce, { nonce });
        this.event.push({ event: nonce, callback: once });
    }
    removeInfo(callback) {
        this.remove("info", callback);
    }
    removeWaitMjEvent(nonce) {
        this.waitMjEvents.delete(nonce);
    }
    onceImage(nonce, callback) {
        const once = (data) => {
            const { message, error } = data;
            if (error || (message && message.progress === "done")) {
                this.remove(nonce, once);
                this.removeWaitMjEvent(nonce);
            }
            callback(data);
        };
        this.waitMjEvents.set(nonce, { nonce });
        this.event.push({ event: nonce, callback: once });
    }
    async waitImageMessage(nonce, loading) {
        return new Promise((resolve, reject) => {
            this.onceImage(nonce, ({ message, error }) => {
                if (error) {
                    reject(error);
                    return;
                }
                if (message && message.progress === "done") {
                    resolve(message);
                    return;
                }
                message && loading && loading(message.uri, message.progress || "");
            });
        });
    }
    async waitDescribe(nonce) {
        return new Promise((resolve) => {
            this.onceDescribe(nonce, (message) => {
                const data = message.split("\n\n");
                resolve(data);
            });
        });
    }
    async waitInfo() {
        return new Promise((resolve, reject) => {
            this.onceInfo((message) => {
                resolve(this.msg2Info(message));
            });
        });
    }
    msg2Info(msg) {
        let jsonResult = {
            subscription: "",
            jobMode: "",
            visibilityMode: "",
            fastTimeRemaining: "",
            lifetimeUsage: "",
            relaxedUsage: "",
            queuedJobsFast: "",
            queuedJobsRelax: "",
            runningJobs: "",
        }; // Initialize jsonResult with empty object
        msg.split("\n").forEach(function (line) {
            const colonIndex = line.indexOf(":");
            if (colonIndex > -1) {
                const key = line.substring(0, colonIndex).trim().replaceAll("**", "");
                const value = line.substring(colonIndex + 1).trim();
                switch (key) {
                    case "Subscription":
                        jsonResult.subscription = value;
                        break;
                    case "Job Mode":
                        jsonResult.jobMode = value;
                        break;
                    case "Visibility Mode":
                        jsonResult.visibilityMode = value;
                        break;
                    case "Fast Time Remaining":
                        jsonResult.fastTimeRemaining = value;
                        break;
                    case "Lifetime Usage":
                        jsonResult.lifetimeUsage = value;
                        break;
                    case "Relaxed Usage":
                        jsonResult.relaxedUsage = value;
                        break;
                    case "Queued Jobs (fast)":
                        jsonResult.queuedJobsFast = value;
                        break;
                    case "Queued Jobs (relax)":
                        jsonResult.queuedJobsRelax = value;
                        break;
                    case "Running Jobs":
                        jsonResult.runningJobs = value;
                        break;
                    default:
                    // Do nothing
                }
            }
        });
        return jsonResult;
    }
}
exports.WsMessage = WsMessage;
//# sourceMappingURL=ws.message.js.map