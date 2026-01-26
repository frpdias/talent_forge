"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
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
    const port = process.env.PORT || 3001;
    const host = process.env.HOST || '127.0.0.1';
    await app.listen(port, host);
    console.log(`🚀 TalentForge API running on http://${host}:${port}`);
    console.log(`📚 Swagger docs at http://${host}:${port}/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map