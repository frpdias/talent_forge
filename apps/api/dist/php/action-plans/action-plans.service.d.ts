import { CreateActionPlanDto, UpdateActionPlanDto, CreateActionItemDto, UpdateActionItemDto, ActionPlanQueryDto } from './dto/action-plan.dto';
import { ActionPlan, ActionItem, ActionPlanStats } from './entities/action-plan.entity';
export declare class ActionPlansService {
    private readonly logger;
    private supabase;
    constructor();
    findAll(query: ActionPlanQueryDto): Promise<{
        data: ActionPlan[];
        count: number;
    }>;
    findOne(id: string): Promise<ActionPlan>;
    create(dto: CreateActionPlanDto, createdBy: string): Promise<ActionPlan>;
    update(id: string, dto: UpdateActionPlanDto, userId: string): Promise<ActionPlan>;
    remove(id: string): Promise<void>;
    getStats(orgId: string): Promise<ActionPlanStats>;
    getTopPriority(orgId: string, limit?: number): Promise<ActionPlan[]>;
    findItemsByPlan(planId: string): Promise<ActionItem[]>;
    createItem(dto: CreateActionItemDto): Promise<ActionItem>;
    updateItem(id: string, dto: UpdateActionItemDto): Promise<ActionItem>;
    removeItem(id: string): Promise<void>;
}
