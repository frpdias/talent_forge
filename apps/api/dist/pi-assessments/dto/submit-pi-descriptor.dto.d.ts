export declare enum PiBlock {
    NATURAL = "natural",
    ADAPTADO = "adaptado"
}
export declare class SubmitPiDescriptorDto {
    descriptorId: string;
    block: PiBlock;
    selected?: boolean;
}
