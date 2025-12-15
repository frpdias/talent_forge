export declare enum AssessmentKind {
    BEHAVIORAL_V1 = "behavioral_v1"
}
export declare class CreateAssessmentDto {
    candidateId: string;
    jobId?: string;
    assessmentKind?: AssessmentKind;
}
export declare class AssessmentAnswerDto {
    questionId: string;
    value: number;
}
export declare class SubmitAssessmentDto {
    answers: AssessmentAnswerDto[];
}
