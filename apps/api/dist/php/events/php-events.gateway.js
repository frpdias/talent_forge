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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PhpEventsGateway_1;
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhpEventsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
let PhpEventsGateway = PhpEventsGateway_1 = class PhpEventsGateway {
    constructor() {
        this.logger = new common_1.Logger(PhpEventsGateway_1.name);
        this.connectedClients = new Map();
        this.orgRooms = new Map();
    }
    afterInit(server) {
        this.logger.log('PHP WebSocket Gateway initialized');
    }
    handleConnection(client) {
        this.logger.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        const clientInfo = this.connectedClients.get(client.id);
        if (clientInfo) {
            const orgRoom = this.orgRooms.get(clientInfo.org_id);
            if (orgRoom) {
                orgRoom.delete(client.id);
                if (orgRoom.size === 0) {
                    this.orgRooms.delete(clientInfo.org_id);
                }
            }
            this.server.to(`org:${clientInfo.org_id}`).emit('user:left', {
                user_id: clientInfo.user_id,
                user_name: clientInfo.user_name,
            });
            this.connectedClients.delete(client.id);
            this.logger.log(`Client disconnected: ${client.id} (${clientInfo.user_name})`);
        }
    }
    handleJoinOrg(client, data) {
        const { org_id, user_id, user_name } = data;
        client.join(`org:${org_id}`);
        this.connectedClients.set(client.id, {
            socket_id: client.id,
            user_id,
            user_name,
            org_id,
            page: 'dashboard',
            joined_at: new Date(),
        });
        if (!this.orgRooms.has(org_id)) {
            this.orgRooms.set(org_id, new Set());
        }
        this.orgRooms.get(org_id).add(client.id);
        client.to(`org:${org_id}`).emit('user:joined', {
            user_id,
            user_name,
            joined_at: new Date().toISOString(),
        });
        const usersInOrg = this.getUsersInOrg(org_id);
        this.logger.log(`User ${user_name} joined org ${org_id}`);
        return {
            success: true,
            users_online: usersInOrg,
            your_socket_id: client.id,
        };
    }
    handleLeaveOrg(client, data) {
        client.leave(`org:${data.org_id}`);
        this.logger.log(`Client ${client.id} left org ${data.org_id}`);
        return { success: true };
    }
    handlePageChange(client, data) {
        const clientInfo = this.connectedClients.get(client.id);
        if (clientInfo) {
            clientInfo.page = data.page;
            this.server.to(`org:${clientInfo.org_id}`).emit('user:page_changed', {
                user_id: clientInfo.user_id,
                user_name: clientInfo.user_name,
                page: data.page,
            });
        }
        return { success: true };
    }
    handleCursorMove(client, data) {
        const clientInfo = this.connectedClients.get(client.id);
        if (clientInfo) {
            client.to(`org:${clientInfo.org_id}`).emit('cursor:update', {
                user_id: clientInfo.user_id,
                user_name: clientInfo.user_name,
                x: data.x,
                y: data.y,
                page: data.page,
            });
        }
    }
    handleActionLock(client, data) {
        const clientInfo = this.connectedClients.get(client.id);
        if (!clientInfo)
            return { success: false, error: 'Not authenticated' };
        this.server.to(`org:${clientInfo.org_id}`).emit('action:locked', {
            action_item_id: data.action_item_id,
            locked_by: {
                user_id: clientInfo.user_id,
                user_name: clientInfo.user_name,
            },
            locked_at: new Date().toISOString(),
        });
        return { success: true };
    }
    handleActionUnlock(client, data) {
        const clientInfo = this.connectedClients.get(client.id);
        if (!clientInfo)
            return { success: false, error: 'Not authenticated' };
        this.server.to(`org:${clientInfo.org_id}`).emit('action:unlocked', {
            action_item_id: data.action_item_id,
        });
        return { success: true };
    }
    handleCommentAdd(client, data) {
        const clientInfo = this.connectedClients.get(client.id);
        if (!clientInfo)
            return { success: false, error: 'Not authenticated' };
        const comment = {
            id: `comment_${Date.now()}`,
            entity_type: data.entity_type,
            entity_id: data.entity_id,
            content: data.content,
            author: {
                user_id: clientInfo.user_id,
                user_name: clientInfo.user_name,
            },
            created_at: new Date().toISOString(),
        };
        this.server.to(`org:${clientInfo.org_id}`).emit('comment:new', comment);
        return { success: true, comment };
    }
    handleDashboardSubscribe(client, data) {
        const clientInfo = this.connectedClients.get(client.id);
        if (!clientInfo)
            return { success: false, error: 'Not authenticated' };
        client.join(`dashboard:${clientInfo.org_id}`);
        this.logger.log(`Client ${client.id} subscribed to dashboard updates`);
        return {
            success: true,
            message: 'Subscribed to dashboard updates',
        };
    }
    handleDashboardUnsubscribe(client) {
        const clientInfo = this.connectedClients.get(client.id);
        if (clientInfo) {
            client.leave(`dashboard:${clientInfo.org_id}`);
        }
        return { success: true };
    }
    emitDashboardUpdate(orgId, metrics) {
        this.server.to(`dashboard:${orgId}`).emit('dashboard:update', {
            metrics,
            updated_at: new Date().toISOString(),
        });
        this.logger.debug(`Dashboard update emitted to org ${orgId}`);
    }
    emitNotification(orgId, notification) {
        const fullNotification = {
            ...notification,
            id: `notif_${Date.now()}`,
            created_at: new Date().toISOString(),
            read: false,
        };
        this.server.to(`org:${orgId}`).emit('notification', fullNotification);
        this.logger.log(`Notification emitted to org ${orgId}: ${notification.title}`);
        return fullNotification;
    }
    emitAssessmentSubmitted(orgId, data) {
        this.server.to(`org:${orgId}`).emit('assessment:submitted', {
            ...data,
            submitted_at: new Date().toISOString(),
        });
        if (data.module === 'nr1' && data.score && data.score >= 3) {
            this.emitNotification(orgId, {
                org_id: orgId,
                type: 'alert',
                category: 'nr1',
                title: '⚠️ Alto Risco NR-1 Detectado',
                message: `${data.employee_name} apresentou score de alto risco na avaliação NR-1`,
                action_url: `/php/nr1?assessment=${data.assessment_id}`,
            });
        }
    }
    emitActionPlanUpdate(orgId, data) {
        this.server.to(`org:${orgId}`).emit('action_plan:update', {
            ...data,
            updated_at: new Date().toISOString(),
        });
        if (data.action === 'completed') {
            this.emitNotification(orgId, {
                org_id: orgId,
                type: 'success',
                category: 'action_plan',
                title: '🎉 Plano de Ação Concluído',
                message: `"${data.title}" foi marcado como concluído por ${data.updated_by}`,
                action_url: `/php/action-plans/${data.action_plan_id}`,
            });
        }
    }
    emitGoalAchieved(orgId, data) {
        this.server.to(`org:${orgId}`).emit('goal:achieved', {
            ...data,
            achieved_at: new Date().toISOString(),
        });
        this.emitNotification(orgId, {
            org_id: orgId,
            type: 'success',
            category: 'system',
            title: '🏆 Meta Atingida!',
            message: `${data.goal_name}: ${data.achieved_value}/${data.target_value}`,
        });
    }
    getUsersInOrg(orgId) {
        const users = [];
        const socketIds = this.orgRooms.get(orgId);
        if (socketIds) {
            for (const socketId of socketIds) {
                const client = this.connectedClients.get(socketId);
                if (client) {
                    users.push({
                        user_id: client.user_id,
                        user_name: client.user_name,
                        page: client.page,
                        last_seen: new Date().toISOString(),
                    });
                }
            }
        }
        return users;
    }
    getConnectedUsersCount(orgId) {
        return this.orgRooms.get(orgId)?.size || 0;
    }
    getStats() {
        const connectionsByOrg = {};
        for (const [orgId, sockets] of this.orgRooms) {
            connectionsByOrg[orgId] = sockets.size;
        }
        return {
            total_connections: this.connectedClients.size,
            orgs_active: this.orgRooms.size,
            connections_by_org: connectionsByOrg,
        };
    }
};
exports.PhpEventsGateway = PhpEventsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", typeof (_a = typeof socket_io_1.Server !== "undefined" && socket_io_1.Server) === "function" ? _a : Object)
], PhpEventsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join:org'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _b : Object, Object]),
    __metadata("design:returntype", void 0)
], PhpEventsGateway.prototype, "handleJoinOrg", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave:org'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _c : Object, Object]),
    __metadata("design:returntype", void 0)
], PhpEventsGateway.prototype, "handleLeaveOrg", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('page:change'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _d : Object, Object]),
    __metadata("design:returntype", void 0)
], PhpEventsGateway.prototype, "handlePageChange", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('cursor:move'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_e = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _e : Object, Object]),
    __metadata("design:returntype", void 0)
], PhpEventsGateway.prototype, "handleCursorMove", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('action:lock'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _f : Object, Object]),
    __metadata("design:returntype", void 0)
], PhpEventsGateway.prototype, "handleActionLock", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('action:unlock'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_g = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _g : Object, Object]),
    __metadata("design:returntype", void 0)
], PhpEventsGateway.prototype, "handleActionUnlock", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('comment:add'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _h : Object, Object]),
    __metadata("design:returntype", void 0)
], PhpEventsGateway.prototype, "handleCommentAdd", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('dashboard:subscribe'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_j = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _j : Object, Object]),
    __metadata("design:returntype", void 0)
], PhpEventsGateway.prototype, "handleDashboardSubscribe", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('dashboard:unsubscribe'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _k : Object]),
    __metadata("design:returntype", void 0)
], PhpEventsGateway.prototype, "handleDashboardUnsubscribe", null);
exports.PhpEventsGateway = PhpEventsGateway = PhpEventsGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
            credentials: true,
        },
        namespace: '/php',
        transports: ['websocket', 'polling'],
    }),
    (0, common_1.Injectable)()
], PhpEventsGateway);
//# sourceMappingURL=php-events.gateway.js.map