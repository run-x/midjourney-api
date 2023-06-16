import { LoadingHandler, MJConfig, MJConfigParam } from "./interfaces";
import { MidjourneyApi } from "./midjourne.api";
import { MidjourneyMessage } from "./midjourney.message";
export declare class Midjourney extends MidjourneyMessage {
    config: MJConfig;
    private wsClient?;
    MJApi: MidjourneyApi;
    constructor(defaults: MJConfigParam);
    init(): Promise<Midjourney>;
    Imagine(prompt: string, loading?: LoadingHandler): Promise<import("./interfaces").MJMessage | null>;
    Info(): Promise<import("./interfaces").MJInfo | null>;
    Fast(): Promise<null>;
    Relax(): Promise<null>;
    Describe(imgUri: string): Promise<string[] | null>;
    Variation(content: string, index: number, msgId: string, msgHash: string, loading?: LoadingHandler): Promise<import("./interfaces").MJMessage | null>;
    Upscale(content: string, index: number, msgId: string, msgHash: string, loading?: LoadingHandler): Promise<import("./interfaces").MJMessage | null>;
    Close(): void;
}
