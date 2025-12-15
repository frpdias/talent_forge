"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColorAssessmentsModule = void 0;
const common_1 = require("@nestjs/common");
const color_assessments_controller_1 = require("./color-assessments.controller");
const color_assessments_service_1 = require("./color-assessments.service");
const supabase_module_1 = require("../supabase/supabase.module");
let ColorAssessmentsModule = class ColorAssessmentsModule {
};
exports.ColorAssessmentsModule = ColorAssessmentsModule;
exports.ColorAssessmentsModule = ColorAssessmentsModule = __decorate([
    (0, common_1.Module)({
        imports: [supabase_module_1.SupabaseModule],
        controllers: [color_assessments_controller_1.ColorAssessmentsController],
        providers: [color_assessments_service_1.ColorAssessmentsService],
    })
], ColorAssessmentsModule);
//# sourceMappingURL=color-assessments.module.js.map