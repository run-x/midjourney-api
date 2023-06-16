export declare class VerifyHuman {
    private inference;
    constructor(HuggingFaceToken: string);
    verify(imageUri: string, categories: string[]): Promise<string | undefined>;
}
