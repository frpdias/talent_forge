"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCandidateNoteDto = exports.NoteContext = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var NoteContext;
(function (NoteContext) {
    NoteContext["PROFILE"] = "profile";
    NoteContext["RESUME"] = "resume";
    NoteContext["ASSESSMENTS"] = "assessments";
    NoteContext["INTERVIEW"] = "interview";
    NoteContext["GENERAL"] = "general";
})(NoteContext || (exports.NoteContext = NoteContext = {}));
class UpdateCandidateNoteDto {
}
exports.UpdateCandidateNoteDto = UpdateCandidateNoteDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Candidato demonstrou excelente fit cultural durante a entrevista.',
        description: 'Updated note content',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCandidateNoteDto.prototype, "note", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'interview',
        enum: NoteContext,
        description: 'Context where the note was created',
        required: false,
    }),
    (0, class_validator_1.IsEnum)(NoteContext),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCandidateNoteDto.prototype, "context", void 0);
//# sourceMappingURL=update-candidate-note.dto.js.map