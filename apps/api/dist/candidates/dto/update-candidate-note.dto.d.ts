export declare enum NoteContext {
    PROFILE = "profile",
    RESUME = "resume",
    ASSESSMENTS = "assessments",
    INTERVIEW = "interview",
    GENERAL = "general"
}
export declare class UpdateCandidateNoteDto {
    note?: string;
    context?: NoteContext;
}
