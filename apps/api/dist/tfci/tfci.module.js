"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TfciModule = void 0;
const common_1 = require("@nestjs/common");
const supabase_module_1 = require("../supabase/supabase.module");
const auth_module_1 = require("../auth/auth.module");
const peer_selection_controller_1 = require("./controllers/peer-selection.controller");
const peer_selection_service_1 = require("./services/peer-selection.service");
let TfciModule = class TfciModule {
};
exports.TfciModule = TfciModule;
exports.TfciModule = TfciModule = __decorate([
    (0, common_1.Module)({
        imports: [supabase_module_1.SupabaseModule, auth_module_1.AuthModule],
        controllers: [peer_selection_controller_1.PeerSelectionController],
        providers: [peer_selection_service_1.PeerSelectionService],
        exports: [peer_selection_service_1.PeerSelectionService],
    })
], TfciModule);
//# sourceMappingURL=tfci.module.js.map