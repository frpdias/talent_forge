"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrgRole = exports.OrgId = void 0;
const common_1 = require("@nestjs/common");
exports.OrgId = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.orgId;
});
exports.OrgRole = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.orgRole;
});
//# sourceMappingURL=org.decorator.js.map