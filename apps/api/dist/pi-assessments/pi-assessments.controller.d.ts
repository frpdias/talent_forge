import type { Request } from 'express';
import { PiAssessmentsService } from './pi-assessments.service';
import { CreatePiAssessmentDto, SubmitPiDescriptorDto, SubmitPiSituationalDto } from './dto';
export declare class PiAssessmentsController {
    private readonly piAssessmentsService;
    constructor(piAssessmentsService: PiAssessmentsService);
    create(dto: CreatePiAssessmentDto, req: Request): Promise<any>;
    listDescriptors(req: Request): Promise<any[]>;
    listSituational(req: Request): Promise<any[]>;
    submitDescriptor(assessmentId: string, dto: SubmitPiDescriptorDto, req: Request): Promise<any>;
    submitSituational(assessmentId: string, dto: SubmitPiSituationalDto, req: Request): Promise<any>;
    finalize(assessmentId: string, req: Request): Promise<{
        scores_natural: {
            direcao: number;
            energia_social: number;
            ritmo: number;
            estrutura: number;
        };
        scores_adapted: {
            direcao: number;
            energia_social: number;
            ritmo: number;
            estrutura: number;
        };
        gaps: Record<string, number>;
    }>;
    latest(req: Request): Promise<any>;
}
