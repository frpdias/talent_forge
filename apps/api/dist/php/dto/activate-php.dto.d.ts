export declare class ActivatePhpDto {
    activation_plan: 'tfci_only' | 'nr1_only' | 'copc_only' | 'full';
    settings?: Record<string, any>;
}
export declare class UpdatePhpSettingsDto {
    settings: Record<string, any>;
}
