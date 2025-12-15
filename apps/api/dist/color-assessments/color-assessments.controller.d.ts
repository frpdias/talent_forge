import type { Request } from 'express';
import { ColorAssessmentsService } from './color-assessments.service';
import { CreateColorAssessmentDto, SubmitColorResponseDto } from './dto';
export declare class ColorAssessmentsController {
    private readonly colorAssessmentsService;
    constructor(colorAssessmentsService: ColorAssessmentsService);
    create(dto: CreateColorAssessmentDto, req: Request): Promise<any>;
    listQuestions(req: Request): Promise<any[]>;
    submit(assessmentId: string, dto: SubmitColorResponseDto, req: Request): Promise<any>;
    finalize(assessmentId: string, req: Request): Promise<{
        primary_color: import("./dto").ColorChoice;
        secondary_color: import("./dto").ColorChoice;
        scores: {
            azul: number;
            rosa: number;
            amarelo: number;
            verde: number;
            branco: number;
        };
    }>;
    latest(req: Request): Promise<any>;
}
