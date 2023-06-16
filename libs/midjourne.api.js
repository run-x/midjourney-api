"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MidjourneyApi = void 0;
const tslib_1 = require("tslib");
const queue_1 = require("./queue");
const utls_1 = require("./utls");
const fs = tslib_1.__importStar(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
const mime = tslib_1.__importStar(require("mime"));
class MidjourneyApi {
    config;
    apiQueue = (0, queue_1.CreateQueue)(1);
    UpId = Date.now() % 10; // upload id
    constructor(config) {
        this.config = config;
        if (this.config.ProxyUrl && this.config.ProxyUrl !== "") {
        }
    }
    // limit the number of concurrent interactions
    async safeIteractions(payload) {
        return this.apiQueue.addTask(() => new Promise((resolve) => {
            this.interactions(payload, (res) => {
                resolve(res);
            });
        }));
    }
    async interactions(payload, callback) {
        try {
            const headers = {
                "Content-Type": "application/json",
                Authorization: this.config.SalaiToken,
            };
            console.log("api.DiscordBaseUrl", this.config.DiscordBaseUrl);
            let fetchUrl = `${this.config.ProxyUrl}?url=${encodeURIComponent(`${this.config.DiscordBaseUrl}/api/v9/interactions`)}`;
            fetchUrl = `${this.config.DiscordBaseUrl}/api/v9/interactions`;
            console.log("api.fetchUrl", fetchUrl);
            const response = await fetch(fetchUrl, {
                method: "POST",
                body: JSON.stringify(payload),
                headers: headers,
            });
            callback && callback(response.status);
            //discord api rate limit
            await (0, utls_1.sleep)(950);
            if (response.status >= 400) {
                console.error("api.error.config", { payload, config: this.config });
            }
            return response.status;
        }
        catch (error) {
            console.error(error);
            callback && callback(500);
        }
    }
    async ImagineApi(prompt, nonce = (0, utls_1.nextNonce)()) {
        const guild_id = this.config.ServerId;
        const payload = {
            type: 2,
            application_id: "936929561302675456",
            guild_id,
            channel_id: this.config.ChannelId,
            session_id: this.config.SessionId,
            data: {
                version: "1118961510123847772",
                id: "938956540159881230",
                name: "imagine",
                type: 1,
                options: [
                    {
                        type: 3,
                        name: "prompt",
                        value: prompt,
                    },
                ],
                application_command: {
                    id: "938956540159881230",
                    application_id: "936929561302675456",
                    version: "1077969938624553050",
                    default_permission: true,
                    default_member_permissions: null,
                    type: 1,
                    nsfw: false,
                    name: "imagine",
                    description: "Create images with Midjourney",
                    dm_permission: true,
                    options: [
                        {
                            type: 3,
                            name: "prompt",
                            description: "The prompt to imagine",
                            required: true,
                        },
                    ],
                },
                attachments: [],
            },
            nonce,
        };
        return this.safeIteractions(payload);
    }
    async VariationApi(index, messageId, messageHash, nonce) {
        const payload = {
            type: 3,
            guild_id: this.config.ServerId,
            channel_id: this.config.ChannelId,
            message_flags: 0,
            message_id: messageId,
            application_id: "936929561302675456",
            session_id: this.config.SessionId,
            data: {
                component_type: 2,
                custom_id: `MJ::JOB::variation::${index}::${messageHash}`,
            },
            nonce,
        };
        return this.safeIteractions(payload);
    }
    async UpscaleApi(index, messageId, messageHash, nonce) {
        const guild_id = this.config.ServerId;
        const payload = {
            type: 3,
            guild_id,
            channel_id: this.config.ChannelId,
            message_flags: 0,
            message_id: messageId,
            application_id: "936929561302675456",
            session_id: this.config.SessionId,
            data: {
                component_type: 2,
                custom_id: `MJ::JOB::upsample::${index}::${messageHash}`,
            },
            nonce,
        };
        return this.safeIteractions(payload);
    }
    async ClickBtnApi(messageId, customId, nonce) {
        const guild_id = this.config.ServerId;
        const payload = {
            type: 3,
            nonce,
            guild_id,
            channel_id: this.config.ChannelId,
            message_flags: 0,
            message_id: messageId,
            application_id: "936929561302675456",
            session_id: this.config.SessionId,
            data: {
                component_type: 2,
                custom_id: customId,
            },
        };
        return this.safeIteractions(payload);
    }
    async InfoApi(nonce) {
        const guild_id = this.config.ServerId;
        const payload = {
            type: 2,
            application_id: "936929561302675456",
            guild_id,
            channel_id: this.config.ChannelId,
            session_id: this.config.SessionId,
            data: {
                version: "987795925764280356",
                id: "972289487818334209",
                name: "info",
                type: 1,
                options: [],
                application_command: {
                    id: "972289487818334209",
                    application_id: "936929561302675456",
                    version: "987795925764280356",
                    default_member_permissions: null,
                    type: 1,
                    nsfw: false,
                    name: "info",
                    description: "View information about your profile.",
                    dm_permission: true,
                    contexts: null,
                },
                attachments: [],
            },
            nonce,
        };
        return this.safeIteractions(payload);
    }
    async FastApi(nonce) {
        const guild_id = this.config.ServerId;
        const payload = {
            type: 2,
            application_id: "936929561302675456",
            guild_id,
            channel_id: this.config.ChannelId,
            session_id: this.config.SessionId,
            data: {
                version: "987795926183731231",
                id: "972289487818334212",
                name: "fast",
                type: 1,
                options: [],
                application_command: {
                    id: "972289487818334212",
                    application_id: "936929561302675456",
                    version: "987795926183731231",
                    default_member_permissions: null,
                    type: 1,
                    nsfw: false,
                    name: "fast",
                    description: "Switch to fast mode",
                    dm_permission: true,
                    contexts: null,
                },
                attachments: [],
            },
            nonce,
        };
        return this.safeIteractions(payload);
    }
    async RelaxApi(nonce) {
        const guild_id = this.config.ServerId;
        const channel_id = this.config.ChannelId;
        const payload = {
            type: 2,
            application_id: "936929561302675456",
            guild_id,
            channel_id,
            session_id: this.config.SessionId,
            data: {
                version: "987795926183731232",
                id: "972289487818334213",
                name: "relax",
                type: 1,
                options: [],
                application_command: {
                    id: "972289487818334213",
                    application_id: "936929561302675456",
                    version: "987795926183731232",
                    default_member_permissions: null,
                    type: 1,
                    nsfw: false,
                    name: "relax",
                    description: "Switch to relax mode",
                    dm_permission: true,
                    contexts: null,
                },
                attachments: [],
            },
            nonce,
        };
        return this.safeIteractions(payload);
    }
    /**
     *
     * @param fileUrl http or local file path
     * @returns
     */
    async UploadImage(fileUrl) {
        let fileData;
        let mimeType;
        let filename;
        let file_size;
        if (fileUrl.startsWith("http")) {
            const response = await fetch(fileUrl);
            fileData = await response.arrayBuffer();
            mimeType = response.headers.get("content-type");
            filename = path_1.default.basename(fileUrl) || "image.png";
            file_size = fileData.byteLength;
        }
        else {
            fileData = await fs.promises.readFile(fileUrl);
            mimeType = mime.getType(fileUrl);
            filename = path_1.default.basename(fileUrl);
            file_size = (await fs.promises.stat(fileUrl)).size;
        }
        if (!mimeType) {
            throw new Error("Unknown mime type");
        }
        const { attachments } = await this.attachments({
            filename,
            file_size,
            id: this.UpId++,
        });
        const UploadSlot = attachments[0];
        await this.uploadImage(UploadSlot, fileData, mimeType);
        const response = {
            id: UploadSlot.id,
            filename: path_1.default.basename(UploadSlot.upload_filename),
            upload_filename: UploadSlot.upload_filename,
        };
        return response;
    }
    /**
     * prepare an attachement to upload an image.
     */
    async attachments(...files) {
        const headers = {
            Authorization: this.config.SalaiToken,
            "content-type": "application/json",
        };
        const url = new URL(`${this.config.DiscordBaseUrl}/api/v9/channels/${this.config.ChannelId}/attachments`);
        const body = { files };
        const response = await fetch(url.toString(), {
            headers,
            method: "POST",
            body: JSON.stringify(body),
        });
        if (response.status === 200) {
            return (await response.json());
        }
        throw new Error(`Attachments return ${response.status} ${response.statusText} ${await response.text()}`);
    }
    async uploadImage(slot, data, contentType) {
        const body = new Uint8Array(data);
        const headers = { "content-type": contentType };
        const response = await fetch(slot.upload_url, {
            method: "PUT",
            headers,
            body,
        });
        if (!response.ok) {
            throw new Error(`uploadImage return ${response.status} ${response.statusText} ${await response.text()}`);
        }
    }
    async DescribeApi(data, nonce) {
        const payload = {
            type: 2,
            application_id: "936929561302675456",
            guild_id: this.config.ServerId,
            channel_id: this.config.ChannelId,
            session_id: this.config.SessionId,
            data: {
                version: "1092492867185950853",
                id: "1092492867185950852",
                name: "describe",
                type: 1,
                options: [{ type: 11, name: "image", value: data.id }],
                application_command: {
                    id: "1092492867185950852",
                    application_id: "936929561302675456",
                    version: "1092492867185950853",
                    default_member_permissions: null,
                    type: 1,
                    nsfw: false,
                    name: "describe",
                    description: "Writes a prompt based on your image.",
                    dm_permission: true,
                    contexts: null,
                    options: [
                        {
                            type: 11,
                            name: "image",
                            description: "The image to describe",
                            required: true,
                        },
                    ],
                },
                attachments: [
                    {
                        id: data.id,
                        filename: data.filename,
                        uploaded_filename: data.upload_filename,
                    },
                ],
            },
            nonce,
        };
        return this.safeIteractions(payload);
    }
}
exports.MidjourneyApi = MidjourneyApi;
//# sourceMappingURL=midjourne.api.js.map