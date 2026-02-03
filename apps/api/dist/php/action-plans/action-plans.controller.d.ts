import { ActionPlansService } from './action-plans.service';
import { CreateActionPlanDto, UpdateActionPlanDto, CreateActionItemDto, UpdateActionItemDto, ActionPlanQueryDto } from './dto/action-plan.dto';
export declare class ActionPlansController {
    private readonly actionPlansService;
    constructor(actionPlansService: ActionPlansService);
    findAll(query: ActionPlanQueryDto): Promise<{
        data: import("./entities/action-plan.entity").ActionPlan[];
        count: number;
    }>;
    getStats(orgId: string): Promise<import("./entities/action-plan.entity").ActionPlanStats>;
    getTopPriority(orgId: string, limit?: number): Promise<import("./entities/action-plan.entity").ActionPlan[]>;
    findOne(id: string): Promise<import("./entities/action-plan.entity").ActionPlan>;
    create(dto: CreateActionPlanDto, req: any): Promise<import("./entities/action-plan.entity").ActionPlan>;
    update(id: string, dto: UpdateActionPlanDto, req: any): Promise<import("./entities/action-plan.entity").ActionPlan>;
    remove(id: string): Promise<void>;
    findItems(planId: string): Promise<import("./entities/action-plan.entity").ActionItem[]>;
    createItem(planId: string, dto: CreateActionItemDto): Promise<import("./entities/action-plan.entity").ActionItem>;
    updateItem(id: string, dto: UpdateActionItemDto): Promise<import("./entities/action-plan.entity").ActionItem>;
    removeItem(id: string): Promise<void>;
}
