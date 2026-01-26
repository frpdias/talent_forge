"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const platform_express_1 = require("@nestjs/platform-express");
const express_1 = __importDefault(require("express"));
const serverless_express_1 = __importDefault(require("@vendia/serverless-express"));
const app_module_1 = require("./app.module");
let cachedHandler = null;
async function bootstrap() {
    const expressApp = (0, express_1.default)();
    const adapter = new platform_express_1.ExpressAdapter(expressApp);
    const app = await core_1.NestFactory.create(app_module_1.AppModule, adapter, {
        bodyParser: true,
    });
    app.setGlobalPrefix('api/v1');
    const allowedOrigins = [
        process.env.FRONTEND_URL,
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ].filter(Boolean);
    app.enableCors({
        origin: allowedOrigins,
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('TalentForge API')
        .setDescription('API para recrutamento inteligente com testes comportamentais')
        .setVersion('1.0')
        .addBearerAuth()
        .addApiKey({ type: 'apiKey', name: 'x-org-id', in: 'header' }, 'x-org-id')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('docs', app, document);
    await app.init();
    return (0, serverless_express_1.default)({
        app: adapter.getInstance(),
    });
}
const handler = async (event, context, callback) => {
    if (!cachedHandler) {
        cachedHandler = await bootstrap();
    }
    return cachedHandler(event, context, callback);
};
exports.handler = handler;
//# sourceMappingURL=serverless.js.map