export interface MJConfig {
    ChannelId: string;
    SalaiToken: string;
    Debug: boolean;
    Limit: number;
    MaxWait: number;
    SessionId: string;
    ServerId?: string;
    Ws?: boolean;
    HuggingFaceToken?: string;
    DiscordBaseUrl: string;
    WsBaseUrl: string;
    ProxyUrl?: string;
}
export interface MJConfigParam {
    SalaiToken: string;
    ChannelId?: string;
    Debug?: boolean;
    Limit?: number;
    MaxWait?: number;
    Ws?: boolean;
    HuggingFaceToken?: string;
    ServerId?: string;
    SessionId?: string;
    DiscordBaseUrl?: string;
    WsBaseUrl?: string;
    ProxyUrl?: string;
}
export declare const DefaultMJConfig: MJConfig;
