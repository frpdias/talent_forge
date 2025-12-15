import { PiBlock } from './submit-pi-descriptor.dto';
export declare enum PiAxis {
    DIRECAO = "direcao",
    ENERGIA_SOCIAL = "energia_social",
    RITMO = "ritmo",
    ESTRUTURA = "estrutura"
}
export declare class SubmitPiSituationalDto {
    questionId: string;
    selectedAxis: PiAxis;
    block: PiBlock;
}
